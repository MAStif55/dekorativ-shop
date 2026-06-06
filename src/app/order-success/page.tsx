'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCartStore } from '@/store/cart-store';
import { useEffect, useState, Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const paymentMethod = searchParams.get('method');
    const { locale } = useLanguage();
    const { clearCart } = useCartStore();
    const [mounted, setMounted] = useState(false);

    // Hydration safety
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && orderId) {
            clearCart();
        }
    }, [orderId, clearCart, mounted]);

    return (
        <main className="min-h-screen bg-ivory flex flex-col">
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

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-ornamental text-slate-dark mb-4">
                        {locale === 'ru' ? 'Заказ оформлен!' : 'Order Placed!'}
                    </h1>

                    {/* Order Number */}
                    {orderId && (
                        <div className="bg-white border border-slate-100 rounded-xl p-6 mb-8 shadow-sm">
                            <p className="text-slate/60 text-sm mb-2">
                                {locale === 'ru' ? 'Номер заказа:' : 'Order Number:'}
                            </p>
                            <p className="text-2xl font-mono text-[#C5A059] font-bold tracking-wider">
                                #{orderId.slice(-8).toUpperCase()}
                            </p>
                        </div>
                    )}

                    {/* Message */}
                    <p className="text-slate mb-6 leading-relaxed">
                        {locale === 'ru'
                            ? 'Спасибо за ваш заказ! Мы свяжемся с вами в ближайшее время для подтверждения деталей доставки.'
                            : 'Thank you for your order! We will contact you shortly to confirm delivery details.'}
                    </p>

                    {/* Bank Transfer Info */}
                    {paymentMethod === 'bank_transfer' && (
                        <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-5 mb-8 text-left shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">🏦</span>
                                <h3 className="font-bold text-slate-dark">
                                    {locale === 'ru' ? 'Оплата переводом' : 'Bank Transfer'}
                                </h3>
                            </div>
                            <p className="text-slate text-sm leading-relaxed">
                                {locale === 'ru'
                                    ? 'Менеджер свяжется с вами и предоставит реквизиты для оплаты. После получения оплаты заказ будет обработан.'
                                    : 'A manager will contact you with payment details. Your order will be processed after payment is received.'}
                            </p>
                        </div>
                    )}

                    {/* Contact Info */}
                    <div className="bg-white/40 border border-slate-200/60 rounded-xl p-4 mb-8 shadow-sm">
                        <p className="text-slate/60 text-sm">
                            {locale === 'ru'
                                ? 'Если у вас есть вопросы, свяжитесь с нами через Telegram или email.'
                                : 'If you have any questions, contact us via Telegram or email.'}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/catalog"
                            className="inline-flex items-center justify-center gap-2 bg-[#C5A059] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#A08044] transition-all shadow-md transform hover:-translate-y-0.5"
                        >
                            {locale === 'ru' ? 'Продолжить покупки' : 'Continue Shopping'}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate px-8 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
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

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-ivory flex items-center justify-center text-slate">Loading...</div>}>
            <OrderSuccessContent />
        </Suspense>
    );
}
