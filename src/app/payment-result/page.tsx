'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCartStore } from '@/store/cart-store';
import { useEffect, useState, Suspense, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getOrderByIdForCustomer } from '@/actions/customer-auth-actions';

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'unknown';

function PaymentResultContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const { locale } = useLanguage();
    const { clearCart } = useCartStore();
    const [mounted, setMounted] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
    const [checking, setChecking] = useState(true);
    const [attempts, setAttempts] = useState(0);

    const maxAttempts = 10;
    const pollIntervalMs = 3000;

    // Hydration safety
    useEffect(() => {
        setMounted(true);
    }, []);

    const checkPaymentStatus = useCallback(async () => {
        if (!orderId) {
            setPaymentStatus('unknown');
            setChecking(false);
            return;
        }

        try {
            const order = await getOrderByIdForCustomer(orderId);

            if (!order) {
                setPaymentStatus('unknown');
                setChecking(false);
                return;
            }

            const status = order.paymentStatus as PaymentStatus;

            if (status === 'paid') {
                setPaymentStatus('paid');
                setChecking(false);
                clearCart();
                return;
            }

            if (status === 'failed' || status === 'cancelled') {
                setPaymentStatus(status);
                setChecking(false);
                return;
            }

            // Still pending — continue polling
            setAttempts((prev) => prev + 1);
        } catch (error) {
            console.error('Error checking payment status:', error);
        }
    }, [orderId, clearCart]);

    useEffect(() => {
        if (!mounted || !orderId) return;

        // Initial check
        checkPaymentStatus();
    }, [mounted, orderId, checkPaymentStatus]);

    useEffect(() => {
        if (!mounted || !checking || paymentStatus !== 'pending') return;
        if (attempts >= maxAttempts) {
            // Stop polling after max attempts — payment might still process via webhook
            setChecking(false);
            return;
        }

        const timer = setTimeout(() => {
            checkPaymentStatus();
        }, pollIntervalMs);

        return () => clearTimeout(timer);
    }, [mounted, checking, paymentStatus, attempts, checkPaymentStatus]);

    // ---- RENDER ----

    // Payment confirmed
    if (paymentStatus === 'paid') {
        return (
            <main className="min-h-screen flex flex-col">
                <Header />
                <section className="flex-1 flex items-center justify-center py-16 px-6">
                    <div className="max-w-lg w-full text-center">
                        {/* Success Icon */}
                        <div className="mb-8">
                            <div className="w-24 h-24 mx-auto bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center shadow-sm">
                                <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-ornamental text-slate-dark mb-4">
                            {locale === 'ru' ? 'Оплата прошла успешно!' : 'Payment Successful!'}
                        </h1>

                        {orderId && (
                            <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-6 mb-8 shadow-sm">
                                <p className="text-slate/60 text-sm mb-2">
                                    {locale === 'ru' ? 'Номер заказа:' : 'Order Number:'}
                                </p>
                                <p className="text-2xl font-mono text-[#C5A059] font-bold tracking-wider">
                                    #{orderId.slice(-8).toUpperCase()}
                                </p>
                            </div>
                        )}

                        <p className="text-slate mb-8 leading-relaxed">
                            {locale === 'ru'
                                ? 'Спасибо за покупку! Ваш заказ оплачен и принят в работу. Мы свяжемся с вами для подтверждения деталей доставки.'
                                : 'Thank you for your purchase! Your order has been paid and accepted. We will contact you to confirm delivery details.'}
                        </p>

                        <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-5 mb-8 text-left shadow-sm space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">💬</span>
                                <h3 className="font-bold text-slate-dark text-sm sm:text-base">
                                    {locale === 'ru' ? 'Обсуждение заказа в личном кабинете' : 'Discuss Order in Client Cabinet'}
                                </h3>
                            </div>
                            <p className="text-slate text-xs sm:text-sm leading-relaxed">
                                {locale === 'ru'
                                    ? 'Вы можете следить за статусом заказа, просматривать макеты и переписываться с мастером в вашем личном кабинете.'
                                    : 'You can track your order status, view layouts, and chat with the master in your client cabinet.'}
                            </p>
                            <div className="pt-1">
                                <Link
                                    href="/cabinet"
                                    className="inline-flex items-center gap-1.5 text-[#C5A059] hover:text-[#A08044] font-bold text-xs sm:text-sm transition-colors"
                                >
                                    {locale === 'ru' ? 'Войти в Личный Кабинет →' : 'Go to Client Cabinet →'}
                                </Link>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                href="/catalog"
                                className="btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto text-center"
                            >
                                {locale === 'ru' ? 'Продолжить покупки' : 'Continue Shopping'}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                            <Link
                                href="/"
                                className="btn-outline inline-flex items-center justify-center gap-2 w-full sm:w-auto text-center"
                            >
                                {locale === 'ru' ? 'На главную' : 'Home'}
                            </Link>
                        </div>
                    </div>
                </section>
                <Footer />
            </main>
        );
    }

    // Payment failed or cancelled
    if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
        return (
            <main className="min-h-screen flex flex-col">
                <Header />
                <section className="flex-1 flex items-center justify-center py-16 px-6">
                    <div className="max-w-lg w-full text-center">
                        {/* Error Icon */}
                        <div className="mb-8">
                            <div className="w-24 h-24 mx-auto bg-red-50 border border-red-200 rounded-full flex items-center justify-center shadow-sm">
                                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-ornamental text-red-600 mb-4">
                            {locale === 'ru'
                                ? (paymentStatus === 'cancelled' ? 'Оплата отменена' : 'Ошибка оплаты')
                                : (paymentStatus === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed')}
                        </h1>

                        <p className="text-slate mb-8 leading-relaxed">
                            {locale === 'ru'
                                ? 'К сожалению, оплата не прошла. Вы можете попробовать снова или связаться с нами для помощи.'
                                : 'Unfortunately, the payment was not completed. You can try again or contact us for assistance.'}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                href="/checkout"
                                className="btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto text-center"
                            >
                                {locale === 'ru' ? 'Попробовать снова' : 'Try Again'}
                            </Link>
                            <Link
                                href="/"
                                className="btn-outline inline-flex items-center justify-center gap-2 w-full sm:w-auto text-center"
                            >
                                {locale === 'ru' ? 'На главную' : 'Home'}
                            </Link>
                        </div>
                    </div>
                </section>
                <Footer />
            </main>
        );
    }

    // Waiting / checking payment status
    return (
        <main className="min-h-screen flex flex-col">
            <Header />
            <section className="flex-1 flex items-center justify-center py-16 px-6">
                <div className="max-w-lg w-full text-center">
                    {/* Loading spinner */}
                    <div className="mb-8">
                        <div className="w-24 h-24 mx-auto border-4 border-slate-200 border-t-[#C5A059] rounded-full animate-spin" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-ornamental text-slate-dark mb-4">
                        {locale === 'ru' ? 'Проверяем оплату...' : 'Checking payment...'}
                    </h1>

                    <p className="text-slate mb-8 leading-relaxed">
                        {checking
                            ? (locale === 'ru'
                                ? 'Пожалуйста, подождите. Мы проверяем статус вашего платежа.'
                                : 'Please wait. We are checking your payment status.')
                            : (locale === 'ru'
                                ? 'Платёж ещё обрабатывается. Вы получите уведомление, когда оплата будет подтверждена.'
                                : 'Your payment is still being processed. You will be notified when it is confirmed.')}
                    </p>

                    {!checking && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                href="/catalog"
                                className="btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto text-center"
                            >
                                {locale === 'ru' ? 'Вернуться в каталог' : 'Back to Catalog'}
                            </Link>
                            <Link
                                href="/"
                                className="btn-outline inline-flex items-center justify-center gap-2 w-full sm:w-auto text-center"
                            >
                                {locale === 'ru' ? 'На главную' : 'Home'}
                            </Link>
                        </div>
                    )}
                </div>
            </section>
            <Footer />
        </main>
    );
}

export default function PaymentResultPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate">Loading...</div>}>
            <PaymentResultContent />
        </Suspense>
    );
}
