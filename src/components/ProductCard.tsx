'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Product, getImageUrl, getImageAlt } from '@/types/product';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingCart } from 'lucide-react';
import { formatPrice } from '@/utils/currency';
import { useCartStore } from '@/store/cart-store';
import { useToastStore } from '@/store/toast-store';
import Image from 'next/image';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { locale, t } = useLanguage();
    const { addItem } = useCartStore();
    const { addToast } = useToastStore();

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent navigation

        addItem({
            productId: product.id,
            productTitle: product.title,
            productImage: product.images?.[0] ? getImageUrl(product.images[0]) : '',
            price: product.basePrice,
            quantity: 1,
            configuration: {}
        });

        // Show toast notification
        addToast({
            message: locale === 'ru'
                ? `${product.title[locale]} добавлен в корзину`
                : `${product.title[locale]} added to cart`,
            type: 'success',
            duration: 3000,
        });
    };

    // Fallback to product ID if slug is missing
    const productSlug = product.slug || product.id;

    return (
        <Link href={`/product/${productSlug}`} className="group bg-[#1A1517] rounded-xl shadow-lg hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-300 border border-[#C9A227]/20 hover:border-[#C9A227]/60 flex flex-col h-full overflow-hidden relative">
            {/* Gold accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8B6914] via-[#C9A227] to-[#8B6914] opacity-60 group-hover:opacity-100 transition-opacity" />

            {/* Image Container */}
            <div
                className="relative aspect-square overflow-hidden bg-[#0D0A0B] product-image-container"
                onContextMenu={(e) => e.preventDefault()}
            >
                {product.images && product.images.length > 0 ? (
                    <Image
                        src={getImageUrl(product.images[0])}
                        alt={getImageAlt(product.images[0], locale as 'en' | 'ru', product.title[locale])}
                        fill
                        draggable={false}
                        className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        onDragStart={(e) => e.preventDefault()}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-[#0D0A0B] text-[#C9A227]/30">
                        🕉️
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-[#E8D48B] mb-2 group-hover:text-glow-gold transition-all font-elegant text-center line-clamp-2 min-h-[3.5rem] flex items-center justify-center">
                    {product.title[locale]}
                </h3>

                <div className="text-sm text-[#F5ECD7]/70 mb-4 flex-1 font-medium text-center">
                    <div className="[&>p]:mb-2 last:[&>p]:mb-0">
                        <ReactMarkdown>
                            {product.shortDescription?.[locale] || product.description[locale].replace(/<[^>]*>/g, '')}
                        </ReactMarkdown>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#C9A227]/20">
                    <span className="text-xl font-bold text-[#C9A227]">
                        {formatPrice(product.basePrice)}
                    </span>
                    <button
                        onClick={handleAddToCart}
                        className="flex items-center justify-center gap-2 h-11 min-w-[44px] px-4 rounded-lg bg-gradient-to-r from-[#C9A227] to-[#8B6914] text-[#0D0A0B] font-bold text-sm uppercase tracking-wide hover:shadow-[0_0_20px_rgba(201,162,39,0.5)] hover:scale-105 transition-all duration-200 border border-[#C9A227]"
                        title={t('product.addToCart')}
                    >
                        <ShoppingCart size={18} />
                        <span className="hidden sm:inline">{locale === 'ru' ? 'В корзину' : 'Add'}</span>
                    </button>
                </div>
            </div>
        </Link>
    );
}
