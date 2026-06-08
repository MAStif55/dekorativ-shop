import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data/yandex/mongo-client';
import { OrderRepository } from '@/lib/data';
import { getSession } from '@/actions/auth-actions';
import { getCustomerSession } from '@/actions/customer-auth-actions';
import { chatEmitter, activeClients, emailDebounceTimers, emailLastMessages } from '@/utils/chat-emitter';
import { sendEmailNewChatMessage } from '@/lib/mailer';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const orderId = params.id;
    
    // 1. Authenticate user (either Admin or Owner of the order)
    const adminSession = await getSession();
    const customerSession = await getCustomerSession();

    if (!adminSession && !customerSession) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const order = await OrderRepository.getById(orderId);

        if (!order) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }

        // Customer can only view their own order
        if (!adminSession && customerSession && order.email.toLowerCase() !== customerSession.email.toLowerCase()) {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        // 2. Check if client wants SSE (text/event-stream)
        const acceptHeader = request.headers.get('accept');
        
        if (acceptHeader === 'text/event-stream') {
            const responseStream = new TransformStream();
            const writer = responseStream.writable.getWriter();
            const encoder = new TextEncoder();

            // Set up listener for new messages
            const onNewMessage = (msg: any) => {
                if (msg.orderId === orderId) {
                    try {
                        writer.write(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
                    } catch (e) {
                        console.error('Error writing to SSE stream:', e);
                    }
                }
            };

            // Register listener
            chatEmitter.on('newMessage', onNewMessage);

            // Track client connection (customer session email matches order email)
            const isClient = !adminSession && customerSession && order.email.toLowerCase() === customerSession.email.toLowerCase();
            if (isClient) {
                const currentCount = activeClients.get(orderId) || 0;
                activeClients.set(orderId, currentCount + 1);

                // Cancel any pending email debounce timer since the client is now online
                const pendingTimer = emailDebounceTimers.get(orderId);
                if (pendingTimer) {
                    clearTimeout(pendingTimer);
                    emailDebounceTimers.delete(orderId);
                    emailLastMessages.delete(orderId);
                    console.log(`[SSE Chat] Client came online for order ${orderId}. Cancelled pending email notification.`);
                }
            }

            // Clean up when client disconnects
            request.signal.addEventListener('abort', () => {
                chatEmitter.off('newMessage', onNewMessage);
                if (isClient) {
                    const currentCount = activeClients.get(orderId) || 0;
                    const newCount = Math.max(0, currentCount - 1);
                    if (newCount === 0) {
                        activeClients.delete(orderId);
                    } else {
                        activeClients.set(orderId, newCount);
                    }
                }
                try {
                    writer.close();
                } catch (e) {}
            });

            // Keep-alive interval to prevent timeout (ping every 30 seconds)
            const keepAliveInterval = setInterval(() => {
                try {
                    writer.write(encoder.encode(': keep-alive\n\n'));
                } catch (e) {
                    clearInterval(keepAliveInterval);
                }
            }, 30000);

            request.signal.addEventListener('abort', () => {
                clearInterval(keepAliveInterval);
            });

            return new Response(responseStream.readable, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache, no-transform',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no', // Disable Nginx buffering for SSE
                },
            });
        }

        // 3. Normal request: return full chat history from MongoDB
        const db = await getDb();
        const messages = await db.collection('order_messages')
            .find({ orderId })
            .sort({ createdAt: 1 })
            .toArray();

        return NextResponse.json({ success: true, messages });
    } catch (error: any) {
        console.error('[API Chat GET] Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const orderId = params.id;

    // 1. Authenticate user
    const adminSession = await getSession();
    const customerSession = await getCustomerSession();

    if (!adminSession && !customerSession) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { text, fileUrl, sender: bodySender } = body;

        if (!text && !fileUrl) {
            return NextResponse.json({ success: false, error: 'Message text or attachment is required' }, { status: 400 });
        }

        const order = await OrderRepository.getById(orderId);

        if (!order) {
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }

        // Customer can only write to their own order
        if (!adminSession && customerSession && order.email.toLowerCase() !== customerSession.email.toLowerCase()) {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        let sender: 'admin' | 'client' = 'client';
        if (bodySender === 'admin') {
            if (!adminSession) {
                return NextResponse.json({ success: false, error: 'Unauthorized to send as admin' }, { status: 403 });
            }
            sender = 'admin';
        } else {
            if (!customerSession && !adminSession) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
            }
            sender = 'client';
        }

        const messageDoc = {
            orderId,
            sender,
            text: text || '',
            fileUrl: fileUrl || null,
            createdAt: Date.now(),
        };

        // 2. Save message to database
        const db = await getDb();
        const result = await db.collection('order_messages').insertOne(messageDoc);
        const savedMessage = { id: result.insertedId.toString(), ...messageDoc };

        // 3. Emit message event for active SSE connections
        chatEmitter.emit('newMessage', savedMessage);

        // 4. Send email alert to customer if master (admin) sent a message (with hybrid online check and 2 min debounce)
        if (sender === 'admin' && order.email) {
            const isClientOnline = (activeClients.get(orderId) || 0) > 0;
            
            if (isClientOnline) {
                console.log(`[API Chat POST] Customer is online for order ${orderId}. Suppressing email notification.`);
            } else {
                const protocol = request.headers.get('x-forwarded-proto') || 'http';
                const host = request.headers.get('host') || 'localhost:3000';
                const orderLink = `${protocol}://${host}/orders/${orderId}`;
                const messageText = text || '[Вложение]';

                // Reset any existing debounce timer for this order
                const existingTimer = emailDebounceTimers.get(orderId);
                if (existingTimer) {
                    clearTimeout(existingTimer);
                }

                // Buffer the latest message content
                emailLastMessages.set(orderId, {
                    email: order.email,
                    orderId,
                    text: messageText,
                    orderLink
                });

                // Set a 2-minute debounce timer (120,000 ms)
                const timer = setTimeout(() => {
                    const lastMsg = emailLastMessages.get(orderId);
                    if (lastMsg) {
                        emailDebounceTimers.delete(orderId);
                        emailLastMessages.delete(orderId);
                        
                        console.log(`[API Chat POST] Sending debounced email notification to ${lastMsg.email} for order ${lastMsg.orderId}`);
                        sendEmailNewChatMessage(lastMsg.email, lastMsg.orderId, lastMsg.text, lastMsg.orderLink).catch(e => {
                            console.error('[API Chat POST] Failed to send debounced email notification:', e);
                        });
                    }
                }, 120000);

                emailDebounceTimers.set(orderId, timer);
                console.log(`[API Chat POST] Customer is offline. Scheduled email notification for order ${orderId} in 2 minutes.`);
            }
        }

        return NextResponse.json({ success: true, message: savedMessage });
    } catch (error: any) {
        console.error('[API Chat POST] Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
