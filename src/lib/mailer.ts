import nodemailer from 'nodemailer';

let _transporter: nodemailer.Transporter | null = null;

function getTransporter() {
    if (!_transporter) {
        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        if (!smtpHost || !smtpUser || !smtpPass) return null;

        _transporter = nodemailer.createTransport({
            host: smtpHost,
            port: Number(process.env.SMTP_PORT) || 465,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: { user: smtpUser, pass: smtpPass },
        });
    }
    return _transporter;
}

/**
 * Send order notification email to admin
 */
export async function sendEmailOrderNotification(orderData: any, orderId: string, isPaid: boolean) {
    const transporter = getTransporter();
    if (!transporter) return;

    try {
        const itemsHtml = orderData.items
            .map(
                (item: any) =>
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
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to: process.env.EMAIL_TO || process.env.SMTP_USER,
            subject: `Новый заказ #${orderId.slice(-6).toUpperCase()}`,
            html: emailHtml,
        });
    } catch (e) {
        console.error('Email Error:', e);
        throw e;
    }
}

/**
 * Send feedback/contact form email to admin
 */
export async function sendEmailFeedbackNotification(data: any) {
    const transporter = getTransporter();
    if (!transporter) return;

    try {
        const emailHtml = `
            <h2>Новое сообщение с сайта</h2>
            <p><strong>Телефон:</strong> ${data.phone}</p>
            ${data.telegram ? `<p><strong>Telegram:</strong> ${data.telegram}</p>` : ''}
            <h3>Сообщение:</h3>
            <p>${data.message.replace(/\n/g, '<br>')}</p>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to: process.env.EMAIL_TO || process.env.SMTP_USER,
            subject: `Сообщение с сайта от ${data.phone}`,
            html: emailHtml,
        });
    } catch (e) {
        console.error('Feedback Email Error:', e);
    }
}
