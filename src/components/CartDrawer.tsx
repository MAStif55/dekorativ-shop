'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCartStore } from '@/store/cart-store';
import { useCartUIStore } from '@/store/cart-ui-store';
import { formatPrice } from '@/utils/currency';
import { PROMO_CONFIG } from '@/config/promotions';
import { useScrollLock } from '@/hooks/useScrollLock';

export default function CartDrawer() {
    const { locale, t } = useLanguage();
    const {
        items,
        removeItem,
        updateQuantity,
        getTotalPrice,
        clearCart,
        getFreeShippingThreshold,
        getGiftThreshold,
        isFreeShippingEligible,
        getDiscount,
        getFinalPrice,
        getTotalItems,
        getShippingCost
    } = useCartStore();
    const { isDrawerOpen, closeDrawer } = useCartUIStore();
    const [mounted, setMounted] = useState(false);

    // Hydration safety
    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent body scroll when drawer is open
    useScrollLock(isDrawerOpen);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeDrawer();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [closeDrawer]);

    if (!mounted) return null;

    const isEmpty = items.length === 0;
    const subtotal = getTotalPrice();
    const discount = getDiscount();
    const finalPrice = getFinalPrice();

    // Free Shipping Logic
    const freeShippingRemaining = getFreeShippingThreshold();
    const isFreeShipping = isFreeShippingEligible();
    const freeShippingProgress = Math.min(100, (subtotal / PROMO_CONFIG.FREE_SHIPPING_THRESHOLD) * 100);

    // Gift Logic
    const giftRemaining = getGiftThreshold();
    const totalItems = getTotalItems();
    // Same logic as CartPage
    const isGiftSuccess = totalItems > 0 && totalItems % PROMO_CONFIG.GIFT_EVERY_N_ITEMS === 0;
    const giftProgress = isGiftSuccess ? 100 : ((totalItems % PROMO_CONFIG.GIFT_EVERY_N_ITEMS) / PROMO_CONFIG.GIFT_EVERY_N_ITEMS) * 100;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={closeDrawer}
            />

            {/* Drawer Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-ivory border-l border-[#C5A059]/20 shadow-2xl z-[100] transform transition-transform duration-300 ease-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="text-[#C5A059]" size={24} />
                        <h2 className="text-xl font-bold text-slate-dark font-ornamental">
                            {t('cart.title')}
                        </h2>
                        <span className="bg-turquoise-dark text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {items.length}
                        </span>
                    </div>
                    <button
                        onClick={closeDrawer}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate hover:text-slate-dark transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Progress Bars (Only show when cart is not empty) */}
                {!isEmpty && (
                    <div className="p-4 space-y-4 border-b border-slate-100 bg-white/40 backdrop-blur-sm">
                        {/* Free Shipping Bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                                <span className={`font-medium ${isFreeShipping ? 'text-green-600' : 'text-slate-dark'}`}>
                                    {isFreeShipping
                                        ? t('cart.freeShippingSuccess')
                                        : t('cart.freeShippingRemaining', { amount: formatPrice(freeShippingRemaining) })}
                                </span>
                                <span className="text-slate-light">{Math.round(freeShippingProgress)}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ease-out ${isFreeShipping ? 'bg-green-500' : 'bg-gradient-to-r from-[#C5A059] to-[#A08044]'}`}
                                    style={{ width: `${freeShippingProgress}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Gift Item Bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                                <span className={`font-medium ${isGiftSuccess ? 'text-green-600' : 'text-slate-dark'}`}>
                                    {isGiftSuccess
                                        ? t('cart.giftSuccess')
                                        : t('cart.giftRemaining', { count: giftRemaining })}
                                </span>
                                <span className="text-slate-light">{Math.round(giftProgress)}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ease-out ${isGiftSuccess ? 'bg-green-500' : 'bg-gradient-to-r from-[#C5A059] to-[#A08044]'}`}
                                    style={{ width: `${giftProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isEmpty ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="text-6xl mb-4 opacity-40">🛒</div>
                            <p className="text-slate-dark font-medium mb-1">
                                {t('cart.empty')}
                            </p>
                            <p className="text-xs text-slate-light">
                                {locale === 'ru'
                                    ? 'Добавьте товары из каталога'
                                    : 'Add items from the catalog'}
                            </p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-slate-100 hover:border-[#C5A059]/30 shadow-sm transition-all"
                            >
                                <div className="flex gap-3">
                                    {/* Image */}
                                    <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-200">
                                        {item.productImage ? (
                                            <Image
                                                src={item.productImage}
                                                alt={typeof item.productTitle === 'object' ? item.productTitle[locale] : item.productTitle}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-slate-dark truncate">
                                            {typeof item.productTitle === 'object'
                                                ? item.productTitle[locale]
                                                : item.productTitle}
                                        </h3>
                                        {item.configuration && Object.keys(item.configuration).length > 0 && (
                                            <p className="text-xs text-slate-light truncate">
                                                {Object.values(item.configuration).join(', ')}
                                            </p>
                                        )}
                                        <p className="text-[#C5A059] font-bold text-sm mt-1">
                                            {formatPrice(item.price * item.quantity)}
                                        </p>
                                    </div>

                                    {/* Remove */}
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="p-1.5 text-slate-light hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-start top-0"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Quantity Controls */}
                                <div className="flex items-center justify-end gap-2 mt-2">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        disabled={item.quantity <= 1}
                                        className="w-7 h-7 rounded-md bg-slate-100 text-slate hover:bg-[#C5A059] hover:text-white transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-8 text-center text-sm font-bold text-slate-dark">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="w-7 h-7 rounded-md bg-slate-100 text-slate hover:bg-[#C5A059] hover:text-white transition-colors flex items-center justify-center"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {!isEmpty && (
                    <div className="p-4 border-t border-slate-200 space-y-4 bg-white/90 backdrop-blur-sm">
                        {/* Summary breakdown */}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center text-slate">
                                <span>{t('cart.subtotal')}:</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between items-center text-green-600">
                                    <span>{t('cart.discount')}:</span>
                                    <span>-{formatPrice(discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-slate">
                                <span>{t('cart.shipping')}:</span>
                                <span className={isFreeShipping ? 'text-green-600' : ''}>
                                    {isFreeShipping ? t('cart.free') : formatPrice(getShippingCost())}
                                </span>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                            <span className="text-slate font-medium">
                                {t('cart.total')}:
                            </span>
                            <span className="text-2xl font-bold text-slate-dark">
                                {formatPrice(finalPrice)}
                            </span>
                        </div>

                        {/* Buttons */}
                        <div className="space-y-2">
                            <Link
                                href="/checkout"
                                onClick={closeDrawer}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#C5A059] text-white font-bold uppercase tracking-widest text-sm hover:bg-[#A08044] hover:shadow-lg hover:shadow-[#C5A059]/20 transition-all"
                            >
                                {t('cart.checkout')}
                            </Link>
                            <Link
                                href="/cart"
                                onClick={closeDrawer}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#C5A059] text-slate hover:text-[#A08044] hover:border-[#A08044] hover:bg-white transition-all font-semibold uppercase tracking-wider text-xs"
                            >
                                {locale === 'ru' ? 'Открыть корзину' : 'View Cart'}
                            </Link>
                        </div>

                        {/* Clear Cart */}
                        <button
                            onClick={() => {
                                clearCart();
                                closeDrawer();
                            }}
                            className="w-full text-center text-xs text-red-500/60 hover:text-red-600 transition-colors hover:underline"
                        >
                            {locale === 'ru' ? 'Очистить корзину' : 'Clear Cart'}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
