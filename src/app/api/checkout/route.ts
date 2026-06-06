import { NextResponse } from 'next/server';
import { OrderRepository } from '@/lib/data';
import { sendTelegramOrderNotification } from '@/lib/telegram';
import { sendEmailOrderNotification } from '@/lib/mailer';
import { createYooKassaPayment } from '@/lib/yookassa';

// ============================================================================
// Promo config — mirrors client-side config/promotions.ts
// ============================================================================

const PROMO_CONFIG = {
    FREE_SHIPPING_THRESHOLD: 3000,
    SHIPPING_COST: 350,
    GIFT_EVERY_N_ITEMS: 11,
};

/**
 * Server-side gift discount recalculation.
 * Every Nth item is free — the cheapest items are discounted.
 */
function calculateGiftDiscount(cartItems: any[]) {
    const totalItems = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const freeCount = Math.floor(totalItems / PROMO_CONFIG.GIFT_EVERY_N_ITEMS);
    if (freeCount === 0) return 0;

    const units: number[] = [];
    cartItems.forEach((item: any) => {
        for (let i = 0; i < item.quantity; i++) {
            units.push(item.price);
        }
    });

    units.sort((a, b) => a - b);

    let discount = 0;
    for (let i = 0; i < freeCount && i < units.length; i++) {
        discount += units[i];
    }
    return discount;
}

async function verifyTurnstileToken(token: string) {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
        console.warn('[Turnstile] No TURNSTILE_SECRET_KEY configured, bypassing verification.');
        return true;
    }
    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
        });
        const outcome = await response.json();
        return outcome.success;
    } catch (err) {
        console.error('[Turnstile] Verification error:', err);
        return false;
    }
}

function validateOrder(data: any) {
    if (!data.customerName || data.customerName.length < 2) return 'Invalid name';
    if (data.customerName.length > 100) return 'Name too long';
    if (!data.email || !data.email.includes('@')) return 'Invalid email';
    if (data.email.length > 254) return 'Email too long';
    if (!data.phone) return 'Invalid phone';
    if (data.phone.length > 30) return 'Phone too long';
    if (!data.address || data.address.length < 10) return 'Invalid address';
    if (data.address.length > 500) return 'Address too long';
    if (data.telegram && data.telegram.length > 100) return 'Telegram too long';
    if (data.notes && data.notes.length > 1000) return 'Notes too long';
    if (data.paymentMethod && !['card', 'bank_transfer', 'post_payment'].includes(data.paymentMethod)) return 'Invalid payment method';
    return null;
}

function serializeProductTitle(title: any): string {
    if (typeof title === 'object') {
        return title.ru || title.en || 'Untitled';
    }
    return title || 'Untitled';
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { cartItems, customerInfo, locale } = body;

        // Validation
        const error = validateOrder(customerInfo);
        if (error) {
            return NextResponse.json({ success: false, error }, { status: 400 });
        }

        // Captcha validation
        if (customerInfo.captchaToken) {
            const isHuman = await verifyTurnstileToken(customerInfo.captchaToken);
            if (!isHuman) {
                return NextResponse.json({ success: false, error: 'CAPTCHA verification failed. Please try again.' }, { status: 400 });
            }
        }

        const orderItems = cartItems.map((item: any) => ({
            productId: item.productId,
            productTitle: serializeProductTitle(item.productTitle),
            configuration: item.configuration || {},
            quantity: item.quantity,
            price: item.price,
        }));

        // Server-side price calculation (source of truth)
        const subtotal = orderItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
        const giftDiscount = calculateGiftDiscount(orderItems);
        const total = Math.max(0, subtotal - giftDiscount);

        const paymentMethod = customerInfo.paymentMethod || 'post_payment';

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
            paymentMethod,
            paymentStatus: 'pending', // Pending verification by master
            attachments: customerInfo.attachments || [],
        };

        // 1. Save order to database
        const orderId = await OrderRepository.create(orderData as any);

        const fullOrderData = { ...orderData, id: orderId, status: 'pending', createdAt: Date.now() };

        // 2. Notify master and customer (without payment flow since it is post-payment)
        const [telegramResult, emailResult] = await Promise.allSettled([
            sendTelegramOrderNotification(fullOrderData, orderId, false),
            sendEmailOrderNotification(fullOrderData, orderId, false),
        ]);

        const notificationStatus: any = {};
        if (telegramResult.status === 'rejected') {
            notificationStatus.telegramError = telegramResult.reason?.message || 'Unknown error';
        }
        if (emailResult.status === 'rejected') {
            notificationStatus.emailError = emailResult.reason?.message || 'Unknown error';
        }
        if (Object.keys(notificationStatus).length > 0) {
            await OrderRepository.update(orderId, { notificationStatus });
        }

        return NextResponse.json({
            success: true,
            orderId,
            paymentMethod,
        });
    } catch (error) {
        console.error('Create Checkout Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
