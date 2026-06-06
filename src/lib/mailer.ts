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

/**
 * Send Magic Link login email to customer
 */
export async function sendMagicLinkEmail(email: string, magicLink: string) {
    const transporter = getTransporter();
    if (!transporter) {
        console.warn('[Mailer] SMTP not configured. Here is the magic link:', magicLink);
        return;
    }

    try {
        const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #C9A227; border-radius: 12px; background-color: #1A1517; color: #F5ECD7;">
                <h2 style="color: #E8D48B; text-align: center;">Вход в личный кабинет</h2>
                <p>Здравствуйте!</p>
                <p>Для входа в ваш личный кабинет в мастерской гравировки нажмите на кнопку ниже:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${magicLink}" style="background-color: #C9A227; color: #0D0A0B; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Войти в Личный Кабинет
                    </a>
                </div>
                <p style="font-size: 12px; color: rgba(245, 236, 215, 0.6);">Эта ссылка действительна в течение 1 часа и может быть использована только один раз.</p>
                <p style="font-size: 12px; color: rgba(245, 236, 215, 0.6);">Если вы не запрашивали эту ссылку, просто проигнорируйте это письмо.</p>
            </div>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to: email,
            subject: 'Ссылка для входа в Личный Кабинет',
            html: emailHtml,
        });
    } catch (e) {
        console.error('Magic Link Email Error:', e);
        throw e;
    }
}

/**
 * Send notification to customer that master replied
 */
export async function sendEmailNewChatMessage(email: string, orderId: string, messageText: string, link: string) {
    const transporter = getTransporter();
    if (!transporter) return;

    try {
        const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #C9A227; border-radius: 12px; background-color: #1A1517; color: #F5ECD7;">
                <h2 style="color: #E8D48B;">Новое сообщение по заказу #${orderId.slice(-8).toUpperCase()}</h2>
                <p>Здравствуйте!</p>
                <p>Мастер отправил вам сообщение в чате заказа:</p>
                <blockquote style="background-color: #0D0A0B; padding: 15px; border-left: 4px solid #C9A227; border-radius: 4px; margin: 20px 0; color: #F5ECD7;">
                    ${messageText.replace(/\n/g, '<br>')}
                </blockquote>
                <div style="text-align: center; margin: 25px 0;">
                    <a href="${link}" style="background-color: #C9A227; color: #0D0A0B; padding: 10px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Перейти к обсуждению в чате
                    </a>
                </div>
            </div>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to: email,
            subject: `Новое сообщение по заказу #${orderId.slice(-8).toUpperCase()}`,
            html: emailHtml,
        });
    } catch (e) {
        console.error('Chat Email Notification Error:', e);
    }
}

/**
 * Send notification to customer that order is approved and awaiting payment
 */
export async function sendEmailOrderApproved(email: string, orderId: string, total: number, paymentLink: string) {
    const transporter = getTransporter();
    if (!transporter) return;

    try {
        const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #C9A227; border-radius: 12px; background-color: #1A1517; color: #F5ECD7;">
                <h2 style="color: #E8D48B; text-align: center;">Макет утвержден! Выставлен счет</h2>
                <p>Здравствуйте!</p>
                <p>Мастер утвердил макет для вашего заказа <strong>#${orderId.slice(-8).toUpperCase()}</strong>.</p>
                <p>Итоговая стоимость заказа к оплате: <strong>${total}₽</strong>.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${paymentLink}" style="background-color: #22C55E; color: #ffffff; padding: 12px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                        Оплатить заказ
                    </a>
                </div>
                <p style="font-size: 12px; color: rgba(245, 236, 215, 0.6); text-align: center;">
                    Вы также можете зайти в свой личный кабинет, чтобы увидеть историю обсуждения и макеты.
                </p>
            </div>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to: email,
            subject: `Счет на оплату заказа #${orderId.slice(-8).toUpperCase()}`,
            html: emailHtml,
        });
    } catch (e) {
        console.error('Order Approved Email Notification Error:', e);
    }
}
