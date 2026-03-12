'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Product, getImageUrl, getImageAlt } from '@/types/product';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLiveVideoContext } from '@/contexts/LiveVideoContext';
import { ShoppingCart, Play } from 'lucide-react';
import { formatPrice } from '@/utils/currency';
import { useCartStore } from '@/store/cart-store';
import { useToastStore } from '@/store/toast-store';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { locale, t } = useLanguage();
    const { addItem } = useCartStore();
    const { addToast } = useToastStore();

    // Video Preview State
    const [isHovered, setIsHovered] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hasVideo = !!product.videoPreviewUrl;

    const { activeHeroId, registerCard, unregisterCard } = useLiveVideoContext();

    useEffect(() => {
        if (hasVideo && containerRef.current) {
            registerCard(product.id, containerRef.current);
            return () => unregisterCard(product.id);
        }
    }, [hasVideo, product.id, registerCard, unregisterCard]);

    useEffect(() => {
        if (!videoRef.current) return;

        const isHero = activeHeroId === product.id;
        const shouldPlay = isHero || isHovered;

        if (hasVideo) {
            if (shouldPlay) {
                videoRef.current.play().catch(e => console.log('Autoplay prevented:', e));
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0; // reset
            }
        }
    }, [isHovered, activeHeroId, hasVideo, product.id]);

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

    const router = useRouter();

    const handleDetailsClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/product/${productSlug}`);
    };

    // Fallback to product ID if slug is missing
    const productSlug = product.slug || product.id;

    return (
        <div ref={containerRef} className="h-full">
            <Link
                href={`/product/${productSlug}`}
                className="group bg-white/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 flex flex-col h-full overflow-hidden relative backdrop-blur-sm"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onFocus={() => setIsHovered(true)}
                onBlur={() => setIsHovered(false)}
            >
                {/* Subtle top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-light via-primary to-primary-light opacity-0 group-hover:opacity-100 transition-opacity z-20" />

                {/* Image/Video Container */}
                <div
                    className="relative aspect-square overflow-hidden bg-slate-50 border-b border-slate-100 product-image-container"
                    onContextMenu={(e) => e.preventDefault()}
                >


                    {/* Video Element */}
                    {hasVideo && (
                        <video
                            ref={videoRef}
                            src={product.videoPreviewUrl}
                            className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-500 ${isHovered || activeHeroId === product.id ? 'opacity-100' : 'opacity-0'}`}
                            playsInline
                            muted
                            loop
                            preload="metadata"
                        />
                    )}

                    {product.images && product.images.length > 0 ? (
                        <Image
                            src={getImageUrl(product.images[0])}
                            alt={getImageAlt(product.images[0], locale as 'en' | 'ru', product.title[locale])}
                            fill
                            draggable={false}
                            className={`object-cover transform transition-all duration-500 ${isHovered && hasVideo ? 'scale-100 opacity-0' : 'group-hover:scale-105 opacity-100 z-0'}`}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            onDragStart={(e) => e.preventDefault()}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-50 text-slate-300">
                            🕉️
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1 bg-white relative z-10">
                    <h3 className="text-xl sm:text-2xl font-medium text-slate-dark mb-2 group-hover:text-primary transition-all font-heading text-center line-clamp-2 min-h-[3.5rem] flex items-center justify-center">
                        {product.title[locale]}
                    </h3>

                    <div className="text-sm text-slate-light mb-4 flex-1 font-medium text-center">
                        <div className="[&>p]:mb-2 last:[&>p]:mb-0">
                            <ReactMarkdown>
                                {product.shortDescription?.[locale] || product.description[locale].replace(/<[^>]*>/g, '')}
                            </ReactMarkdown>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                        <span className="text-xl font-bold text-primary">
                            {formatPrice(product.basePrice)}
                        </span>
                        <Button
                            onClick={handleDetailsClick}
                            title={t('product.details')}
                        >
                            {locale === 'ru' ? 'Подробнее' : 'Details'}
                        </Button>
                    </div>
                </div>
            </Link>
        </div>
    );
}
