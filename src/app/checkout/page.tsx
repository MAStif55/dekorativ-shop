'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCartStore } from '@/store/cart-store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CheckoutForm from '@/components/CheckoutForm';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/utils/currency';

export default function CheckoutPage() {
    const { locale, t } = useLanguage();
    const { items, getTotalPrice, getDiscount, getFinalPrice, getShippingCost, isFreeShippingEligible } = useCartStore();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // Hydration safety
    useEffect(() => {
        setMounted(true);
    }, []);

    // Show loading state during hydration
    if (!mounted) {
        return (
            <main className="min-h-screen flex flex-col">
                <Header />
                <section className="py-6 px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-ornamental text-slate-dark mb-2">
                        {locale === 'ru' ? 'Оформление заказа' : 'Checkout'}
                    </h2>
                </section>
                <section className="flex-1 py-8 px-6 max-w-6xl mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white/80 border border-slate-100 rounded-2xl p-6 animate-pulse shadow-sm">
                            <div className="h-6 bg-slate-100 rounded mb-4"></div>
                            <div className="h-20 bg-slate-100 rounded"></div>
                        </div>
                        <div className="bg-white/80 border border-slate-100 rounded-2xl p-6 animate-pulse shadow-sm">
                            <div className="h-6 bg-slate-100 rounded mb-4"></div>
                            <div className="h-40 bg-slate-100 rounded"></div>
                        </div>
                    </div>
                </section>
                <Footer />
            </main>
        );
    }

    // Empty state if cart is empty after hydration
    if (items.length === 0) {
        return (
            <main className="min-h-screen flex flex-col">
                <Header />
                <section className="flex-1 flex items-center justify-center py-16 px-6">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="w-20 h-20 mx-auto bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate text-3xl">
                            🛒
                        </div>
                        <h2 className="text-2xl font-bold text-slate-dark font-ornamental">
                            {locale === 'ru' ? 'Ваша корзина пуста' : 'Your cart is empty'}
                        </h2>
                        <p className="text-slate text-sm">
                            {locale === 'ru'
                                ? 'Для оформления заказа необходимо добавить товары в корзину.'
                                : 'You need to add items to your cart to proceed to checkout.'}
                        </p>
                        <Link
                            href="/catalog"
                            className="inline-block bg-[#C5A059] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#A08044] transition-all shadow-md"
                        >
                            {locale === 'ru' ? 'Перейти в каталог' : 'Go to Catalog'}
                        </Link>
                    </div>
                </section>
                <Footer />
            </main>
        );
    }

    return (
        <main className="min-h-screen flex flex-col">
            <Header />

            {/* Hero Banner */}
            <section
                className="py-6 px-6 text-center relative overflow-hidden"
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #C5A059 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

                <h2 className="text-3xl md:text-4xl font-ornamental text-slate-dark mb-2 relative z-10">
                    {locale === 'ru' ? 'Оформление заказа' : 'Checkout'}
                </h2>
                <p className="text-[#C5A059] relative z-10 tracking-wider font-medium">
                    {locale === 'ru' ? 'Заполните данные для доставки' : 'Fill in your delivery details'}
                </p>
            </section>

            <section className="flex-1 py-8 sm:py-6 px-4 sm:px-6 max-w-6xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Order Summary */}
                    <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-dark mb-4 sm:mb-6 font-ornamental">
                            {locale === 'ru' ? 'Ваш заказ' : 'Your Order'}
                        </h3>
                        <div className="bg-white/80 border border-slate-100 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6 space-y-4 backdrop-blur-sm">
                            {items.map((item, index) => (
                                <div key={item.productId + index} className="flex justify-between items-center border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <div className="font-bold text-slate-dark">
                                            {typeof item.productTitle === 'object' ? item.productTitle[locale] : item.productTitle}
                                        </div>
                                        <div className="text-sm text-slate-light">
                                            x{item.quantity}
                                        </div>
                                    </div>
                                    <div className="font-semibold text-[#C5A059] font-mono">
                                        {formatPrice(item.price * item.quantity)}
                                    </div>
                                </div>
                            ))}
                            <div className="pt-4 border-t border-slate-100 space-y-2">
                                <div className="flex justify-between items-center text-base">
                                    <span className="text-slate">{t('cart.subtotal')}:</span>
                                    <span className="text-slate-dark font-medium">{formatPrice(getTotalPrice())}</span>
                                </div>

                                {getDiscount() > 0 && (
                                    <div className="flex justify-between items-center text-base">
                                        <span className="text-green-600">{t('cart.discount')}:</span>
                                        <span className="text-green-600 font-medium">-{formatPrice(getDiscount())}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-base">
                                    <span className="text-slate">{t('cart.shipping')}:</span>
                                    <span className={isFreeShippingEligible() ? 'text-green-600' : 'text-slate-dark font-medium'}>
                                        {isFreeShippingEligible() ? t('cart.free') : formatPrice(getShippingCost())}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-xl font-bold pt-2">
                                    <span className="text-slate">{t('cart.total')}:</span>
                                    <span className="text-slate-dark font-ornamental">{formatPrice(getFinalPrice())}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Checkout Form */}
                    <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-dark mb-4 sm:mb-6 font-ornamental">
                            {locale === 'ru' ? 'Детали доставки' : 'Delivery Details'}
                        </h3>
                        <div className="bg-white/80 border border-slate-100 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-8 backdrop-blur-sm">
                            <CheckoutForm />
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
