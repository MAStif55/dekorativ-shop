function escapeMarkdown(text: string | null | undefined): string {
    if (!text) return '';
    return text.replace(/([_*\[\]()~`>#+=|{}.!\\-])/g, '\\$1');
}

/**
 * Send order notification to Telegram
 */
export async function sendTelegramOrderNotification(orderData: any, orderId: string, isPaid: boolean) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) return;

    try {
        const itemsList = orderData.items
            .map(
                (item: any) =>
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
    } catch (e) {
        console.error('Telegram Error:', e);
        throw e;
    }
}

/**
 * Send feedback/contact form notification to Telegram
 */
export async function sendTelegramFeedbackNotification(data: any) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) return;

    try {
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
    } catch (e) {
        console.error('Feedback Telegram Error:', e);
    }
}
