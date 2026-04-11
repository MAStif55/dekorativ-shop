import { v4 as uuidv4 } from 'uuid';

/**
 * YooKassa Payment Integration
 * 
 * NOTE: This is a placeholder — YooKassa credentials will be configured later.
 * When ready, set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY in .env.local
 */

const SITE_DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || 'декоратив.рф';

export async function createYooKassaPayment(amount: number, orderId: string, customerEmail: string, description: string) {
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;

    if (!shopId || !secretKey) {
        throw new Error('YooKassa credentials not configured. Payment by card is not yet available.');
    }

    const idempotenceKey = uuidv4();
    const returnUrl = `https://${SITE_DOMAIN}/payment-result?orderId=${orderId}`;

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
