const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });
const { v4: uuidv4 } = require('uuid');

admin.initializeApp();
const db = admin.firestore();

// ============================================================================
// HELPERS
// ============================================================================

// Promo config — mirrors client-side config/promotions.ts
const PROMO_CONFIG = {
    FREE_SHIPPING_THRESHOLD: 3000,
    SHIPPING_COST: 350,
    GIFT_EVERY_N_ITEMS: 11,
};

/**
 * Server-side gift discount recalculation.
 * Mirrors the logic in cart-store.ts getDiscount().
 * Every Nth item is free — the cheapest items are discounted.
 */
function calculateGiftDiscount(cartItems) {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const freeCount = Math.floor(totalItems / PROMO_CONFIG.GIFT_EVERY_N_ITEMS);
    if (freeCount === 0) return 0;

    // Flatten all items into individual price units
    const units = [];
    cartItems.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
            units.push(item.price);
        }
    });

    // Sort ascending — cheapest items are free
    units.sort((a, b) => a - b);

    let discount = 0;
    for (let i = 0; i < freeCount && i < units.length; i++) {
        discount += units[i];
    }
    return discount;
}

function validateOrder(data) {
    // Name: min 2, max 100
    if (!data.customerName || data.customerName.length < 2) return 'Invalid name';
    if (data.customerName.length > 100) return 'Name too long';
    // Email: must contain @, max 254 (RFC 5321)
    if (!data.email || !data.email.includes('@')) return 'Invalid email';
    if (data.email.length > 254) return 'Email too long';
    // Phone: required, max 30
    if (!data.phone) return 'Invalid phone';
    if (data.phone.length > 30) return 'Phone too long';
    // Address: min 10, max 500
    if (!data.address || data.address.length < 10) return 'Invalid address';
    if (data.address.length > 500) return 'Address too long';
    // Telegram: optional, max 100
    if (data.telegram && data.telegram.length > 100) return 'Telegram too long';
    // Notes: optional, max 1000
    if (data.notes && data.notes.length > 1000) return 'Notes too long';
    // Payment method
    if (!['card', 'bank_transfer'].includes(data.paymentMethod)) return 'Invalid payment method';
    // ContactPreferences validation (if present)
    if (data.contactPreferences) {
        const validMethods = ['telegram', 'max', 'phone_call', 'sms', 'email'];
        if (!Array.isArray(data.contactPreferences.methods) || data.contactPreferences.methods.length === 0) {
            return 'At least one contact method required';
        }
        for (const m of data.contactPreferences.methods) {
            if (!validMethods.includes(m)) return 'Invalid contact method: ' + m;
        }
        if (data.contactPreferences.methods.includes('telegram') && !data.contactPreferences.telegramHandle) {
            return 'Telegram handle required when Telegram is selected';
        }
        if (data.contactPreferences.methods.includes('max') && !data.contactPreferences.maxId) {
            return 'MAX ID required when MAX is selected';
        }
    }
    return null;
}

function escapeMarkdown(text) {
    if (!text) return '';
    return text.replace(/([_*\[\]()~`>#+=|{}.!\\-])/g, '\\$1');
}

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

async function sendTelegramNotification(orderData, orderId, isPaid) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) return;

    const itemsList = orderData.items
        .map(
            (item) =>
                `  • ${escapeMarkdown(item.productTitle)} x${item.quantity} — ${item.price * item.quantity}₽`
        )
        .join('\n');

    const paymentMethodLabel = orderData.paymentMethod === 'card' ? '💳 Банковская карта' : '🏦 Перевод по реквизитам';
    const paymentStatusLabel = isPaid
        ? '✅ Оплачен'
        : '⏳ Ожидает подтверждения менеджером';

    const message = `
🛒 *Новый заказ\\!*

📋 *Заказ \\#${orderId.slice(-6).toUpperCase()}*

👤 *Клиент:* ${escapeMarkdown(orderData.customerName)}
📧 *Email:* ${escapeMarkdown(orderData.email)}
📱 *Телефон:* ${escapeMarkdown(orderData.phone)}
📍 *Адрес:* ${escapeMarkdown(orderData.address)}
${orderData.telegram ? `💬 *Telegram:* ${escapeMarkdown(orderData.telegram)}` : ''}
${orderData.customerNotes ? `📝 *Комментарий:* ${escapeMarkdown(orderData.customerNotes)}` : ''}

📦 *Товары:*
${itemsList}

💰 *Итого:* ${orderData.total}₽
${escapeMarkdown(paymentMethodLabel)}
${escapeMarkdown(paymentStatusLabel)}
    `.trim();

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'MarkdownV2',
        }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Telegram API ${response.status}: ${body}`);
    }
}

async function sendEmailNotification(orderData, orderId, isPaid) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) return;

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: smtpUser, pass: smtpPass },
    });

    const itemsHtml = orderData.items
        .map(
            (item) =>
                `<li>${item.productTitle} x${item.quantity} — ${item.price * item.quantity}₽</li>`
        )
        .join('');

    const paymentLabel = orderData.paymentMethod === 'card'
        ? '💳 Банковская карта'
        : '🏦 Перевод по реквизитам';

    const statusLabel = isPaid
        ? '✅ Оплачен'
        : '⏳ Ожидает подтверждения';

    const emailHtml = `
        <h1>Новый заказ #${orderId.slice(-6).toUpperCase()}</h1>
        <p><strong>Клиент:</strong> ${orderData.customerName}</p>
        <p><strong>Email:</strong> ${orderData.email}</p>
        <p><strong>Телефон:</strong> ${orderData.phone}</p>
        <p><strong>Адрес:</strong> ${orderData.address}</p>
        ${orderData.telegram ? `<p><strong>Telegram:</strong> ${orderData.telegram}</p>` : ''}
        ${orderData.customerNotes ? `<p><strong>Комментарий:</strong> ${orderData.customerNotes}</p>` : ''}
        <h3>Товары:</h3>
        <ul>${itemsHtml}</ul>
        <h3>Итого: ${orderData.total}₽</h3>
        <p><strong>Способ оплаты:</strong> ${paymentLabel}</p>
        <p><strong>Статус:</strong> ${statusLabel}</p>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || smtpUser,
        to: process.env.EMAIL_TO || smtpUser,
        subject: `Новый заказ #${orderId.slice(-6).toUpperCase()}`,
        html: emailHtml,
    });
}

async function sendFeedbackTelegram(data) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) return;

    const message = `
📩 *Новое сообщение с сайта\\!*

📱 *Телефон:* ${escapeMarkdown(data.phone)}
${data.telegram ? `💬 *Telegram:* ${escapeMarkdown(data.telegram)}` : ''}

✉️ *Сообщение:*
${escapeMarkdown(data.message)}
    `.trim();

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'MarkdownV2',
        }),
    });
}

async function sendFeedbackEmail(data) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) return;

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: smtpUser, pass: smtpPass },
    });

    const emailHtml = `
        <h2>Новое сообщение с сайта</h2>
        <p><strong>Телефон:</strong> ${data.phone}</p>
        ${data.telegram ? `<p><strong>Telegram:</strong> ${data.telegram}</p>` : ''}
        <h3>Сообщение:</h3>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
    `;

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || smtpUser,
        to: process.env.EMAIL_TO || smtpUser,
        subject: `Сообщение с сайта от ${data.phone}`,
        html: emailHtml,
    });
}

/**
 * Sends notifications and logs errors to the order document's notificationStatus field.
 * Uses Promise.allSettled so one channel failure doesn't block the other.
 * Per spec Section 7.1: errors logged to order.notificationStatus.{telegramError, emailError}
 */
async function sendNotificationsWithLogging(orderData, orderId, isPaid, orderRef) {
    const results = await Promise.allSettled([
        sendTelegramNotification(orderData, orderId, isPaid),
        sendEmailNotification(orderData, orderId, isPaid),
    ]);

    const [telegramResult, emailResult] = results;
    const notificationStatus = {};

    if (telegramResult.status === 'rejected') {
        console.error('Telegram notification failed:', telegramResult.reason);
        notificationStatus.telegramError = telegramResult.reason?.message || String(telegramResult.reason);
    }
    if (emailResult.status === 'rejected') {
        console.error('Email notification failed:', emailResult.reason);
        notificationStatus.emailError = emailResult.reason?.message || String(emailResult.reason);
    }

    // Persist notification errors to the order document if any occurred
    if (Object.keys(notificationStatus).length > 0) {
        try {
            await orderRef.update({ notificationStatus });
        } catch (logErr) {
            console.error('Failed to log notification status to order:', logErr);
        }
    }
}

// ============================================================================
// YOOKASSA HELPER
// ============================================================================

async function createYooKassaPayment(amount, orderId, customerEmail, description) {
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;

    if (!shopId || !secretKey) {
        throw new Error('YooKassa credentials not configured');
    }

    const idempotenceKey = uuidv4();
    const returnUrl = `https://somanatha.ru/payment-result?orderId=${orderId}`;

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Idempotence-Key': idempotenceKey,
            'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64'),
        },
        body: JSON.stringify({
            amount: {
                value: amount.toFixed(2),
                currency: 'RUB',
            },
            confirmation: {
                type: 'redirect',
                return_url: returnUrl,
            },
            capture: true,
            description: description,
            metadata: {
                order_id: orderId,
            },
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('YooKassa API error:', response.status, errorBody);
        throw new Error(`YooKassa API error: ${response.status}`);
    }

    return await response.json();
}

// ============================================================================
// CLOUD FUNCTIONS
// ============================================================================

/**
 * createOrder - Creates order in Firestore.
 *   paymentMethod = 'card'          → creates YooKassa payment, returns paymentUrl
 *   paymentMethod = 'bank_transfer' → saves order as awaiting_transfer, sends notifications, returns orderId
 */
exports.createOrder = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        try {
            const { cartItems, customerInfo, locale } = req.body;

            // Validation
            const error = validateOrder(customerInfo);
            if (error) {
                return res.status(400).json({ success: false, error });
            }

            // Recalculate total server-side (never trust client total)
            const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

            // Server-side gift discount recalculation (Spec Gap #3)
            const giftDiscount = calculateGiftDiscount(cartItems);
            const total = Math.max(0, subtotal - giftDiscount);

            const orderItems = cartItems.map((item) => ({
                productId: item.productId,
                // Fix productTitle serialization — prevent [object Object] (Spec Section 10.1)
                productTitle: typeof item.productTitle === 'object'
                    ? (item.productTitle.ru || item.productTitle.en || 'Untitled')
                    : (item.productTitle || 'Untitled'),
                configuration: item.configuration || {},
                quantity: item.quantity,
                price: item.price,
            }));

            const paymentMethod = customerInfo.paymentMethod; // 'card' or 'bank_transfer'

            const orderData = {
                customerName: customerInfo.customerName,
                email: customerInfo.email,
                phone: customerInfo.phone,
                address: customerInfo.address,
                addressDetails: customerInfo.addressDetails || null,
                telegram: customerInfo.telegram || null,
                contactPreferences: customerInfo.contactPreferences || null,
                customerNotes: customerInfo.notes || null,
                items: orderItems,
                subtotal,
                giftDiscount,
                total,
                status: 'pending',
                paymentMethod: paymentMethod,
                paymentStatus: paymentMethod === 'card' ? 'pending' : 'awaiting_transfer',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            // 1. Save order to Firestore
            const docRef = await db.collection('orders').add(orderData);
            const orderId = docRef.id;

            // 2. Handle payment method
            if (paymentMethod === 'card') {
                // --- CARD: create YooKassa payment ---
                const itemDescriptions = orderItems
                    .map((item) => `${item.productTitle} x${item.quantity}`)
                    .join(', ');
                const description = `Заказ #${orderId.slice(-6).toUpperCase()}: ${itemDescriptions}`.substring(0, 128);

                try {
                    const payment = await createYooKassaPayment(
                        total,
                        orderId,
                        customerInfo.email,
                        description
                    );

                    await docRef.update({
                        paymentId: payment.id,
                        paymentUrl: payment.confirmation.confirmation_url,
                    });

                    return res.status(200).json({
                        success: true,
                        orderId,
                        paymentMethod: 'card',
                        paymentUrl: payment.confirmation.confirmation_url,
                    });
                } catch (paymentError) {
                    console.error('Payment creation error:', paymentError);
                    await docRef.update({ paymentStatus: 'failed' });
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to create payment. Please try again.',
                    });
                }
            } else {
                // --- BANK TRANSFER: order placed, manager will approve ---
                // Send notifications with error logging (Promise.allSettled per spec Section 7.2)
                await sendNotificationsWithLogging(orderData, orderId, false, docRef);

                return res.status(200).json({
                    success: true,
                    orderId,
                    paymentMethod: 'bank_transfer',
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });
});

/**
 * yookassaWebhook - Receives payment status updates from YooKassa
 */
exports.yookassaWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const event = req.body;

        if (!event || !event.event || !event.object) {
            console.error('Invalid webhook payload:', JSON.stringify(req.body));
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const payment = event.object;
        const paymentId = payment.id;
        const orderId = payment.metadata?.order_id;

        console.log(`Webhook received: ${event.event} for payment ${paymentId}, order ${orderId}`);

        if (!orderId) {
            console.error('No order_id in payment metadata');
            return res.status(200).json({ status: 'ok' });
        }

        const orderRef = db.collection('orders').doc(orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            console.error(`Order ${orderId} not found`);
            return res.status(200).json({ status: 'ok' });
        }

        const orderData = orderDoc.data();

        if (event.event === 'payment.succeeded') {
            await orderRef.update({
                paymentStatus: 'paid',
                paymentId: paymentId,
                paidAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Send notifications with error logging (fixes Spec Gap #4 — webhook errors now logged)
            await sendNotificationsWithLogging(orderData, orderId, true, orderRef);

            console.log(`Order ${orderId} payment confirmed, notifications sent`);
        } else if (event.event === 'payment.canceled') {
            await orderRef.update({
                paymentStatus: 'cancelled',
                paymentId: paymentId,
            });
            console.log(`Order ${orderId} payment cancelled`);
        }

        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(200).json({ status: 'ok' });
    }
});

/**
 * submitFeedback - Receives contact form submissions, sends to Telegram and email.
 */
exports.submitFeedback = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        try {
            const { message, phone, telegram } = req.body;

            // Validation
            if (!message || message.trim().length < 2) {
                return res.status(400).json({ success: false, error: 'Message is required' });
            }
            if (!phone || phone.trim().length < 5) {
                return res.status(400).json({ success: false, error: 'Phone number is required' });
            }

            const feedbackData = {
                message: message.trim(),
                phone: phone.trim(),
                telegram: telegram ? telegram.trim() : null,
            };

            // Send notifications in parallel
            await Promise.all([
                sendFeedbackTelegram(feedbackData),
                sendFeedbackEmail(feedbackData),
            ]);

            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Feedback error:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });
});

/**
 * triggerDeploy - Triggers a GitHub Actions deployment via repository_dispatch.
 * Requires authenticated Firebase user (admin).
 * Uses GITHUB_PAT and GITHUB_REPO env vars.
 */
exports.triggerDeploy = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        try {
            // Verify Firebase Auth token
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            const idToken = authHeader.split('Bearer ')[1];
            await admin.auth().verifyIdToken(idToken);

            // Trigger GitHub Actions
            const githubPat = process.env.GITHUB_PAT;
            const githubRepo = process.env.GITHUB_REPO || 'MAStif55/dekorativ-shop';

            if (!githubPat) {
                return res.status(500).json({ success: false, error: 'GITHUB_PAT not configured' });
            }

            const response = await fetch(
                `https://api.github.com/repos/${githubRepo}/dispatches`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/vnd.github+json',
                        'Authorization': `Bearer ${githubPat}`,
                        'X-GitHub-Api-Version': '2022-11-28',
                    },
                    body: JSON.stringify({
                        event_type: 'deploy',
                        client_payload: {
                            triggered_by: 'admin_panel',
                            timestamp: new Date().toISOString(),
                        },
                    }),
                }
            );

            if (response.status === 204) {
                return res.status(200).json({ success: true, message: 'Deployment triggered' });
            } else {
                const errorBody = await response.text();
                console.error('GitHub API error:', response.status, errorBody);
                return res.status(response.status).json({
                    success: false,
                    error: `GitHub API error: ${response.status}`,
                });
            }
        } catch (error) {
            console.error('triggerDeploy error:', error);
            if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
                return res.status(401).json({ success: false, error: 'Invalid or expired token' });
            }
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });
});
