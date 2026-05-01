'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Product, getImageUrl, getImageAlt, getThumbImageUrl } from '@/types/product';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { formatPrice } from '@/utils/currency';
import { ShoppingCart, Check } from 'lucide-react';
import { getProductBySlug, getProductById, getCategoryVariations } from '@/actions/catalog-actions';
import { VariationGroup } from '@/types/product';
import { useCartStore } from '@/store/cart-store';
import { useToastStore } from '@/store/toast-store';

import RelatedProducts from '@/components/RelatedProducts';
import VariationSelector from '@/components/VariationSelector';
import { SelectedVariation } from '@/types/order';
import Markdown from 'react-markdown';
import { useCategoryStore } from '@/store/category-store';
import { Button } from '@/components/ui/Button';

export default function ProductDetailsContent({ initialProduct }: { initialProduct?: Product | null }) {
    const params = useParams();
    // Helper to safely get slug whether it's a string or array
    const slugRaw = params?.slug;
    const slug = Array.isArray(slugRaw) ? slugRaw[0] : slugRaw;

    const { locale, t } = useLanguage();
    const router = useRouter();
    const addToCart = useCartStore((state) => state.addItem);
    const { addToast } = useToastStore();
    const { categories: allCategories, fetchCategories } = useCategoryStore();
    const [product, setProduct] = useState<Product | null>(initialProduct || null);
    const [loading, setLoading] = useState(!initialProduct);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
    const [effectiveVariations, setEffectiveVariations] = useState<VariationGroup[]>([]);
    const [addedToCart, setAddedToCart] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        if (!slug) return;

        async function loadProduct() {
            setLoading(!initialProduct);
            try {
                let data = initialProduct;
                if (!data) {
                    // First try by slug
                    data = await getProductBySlug(slug as string);

                    // If not found by slug, try by ID (fallback for products without slugs)
                    if (!data) {
                        data = await getProductById(slug as string);
                    }
                }

                setProduct(data || null);

                // Determine effective variations (category defaults vs custom)
                let variations: VariationGroup[] = [];

                if (data?.variationOverrides?.useDefaults !== false && data?.category) {
                    // Use category defaults, filter out disabled options
                    const categoryVars = await getCategoryVariations(data.category);
                    const disabledOptions = data.variationOverrides?.disabledOptions || [];

                    variations = categoryVars.map(group => ({
                        ...group,
                        options: group.options.filter(opt => !disabledOptions.includes(opt.id))
                    })).filter(group => group.options.length > 0);
                } else if (data?.variations) {
                    // Use custom variations
                    variations = data.variations;
                }

                setEffectiveVariations(variations);

                // Initialize default selections (first option of each group)
                if (variations.length > 0) {
                    const defaultSelections: Record<string, string> = {};

                    variations.forEach(group => {
                        if (group.options.length > 0) {
                            defaultSelections[group.id] = group.options[0].id;
                        }
                    });

                    setSelectedVariations(defaultSelections);
                }
            } catch (error) {
                console.error("Error loading product:", error);
            } finally {
                setLoading(false);
            }
        }
        loadProduct();
    }, [slug, initialProduct]);

    if (loading) {
        return (
            <main className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1 w-full relative">
                    <div className="max-w-7xl mx-auto px-6 py-8 relative z-10 animate-pulse">
                        {/* Breadcrumbs skeleton */}
                        <div className="h-4 w-48 bg-slate-200 rounded mb-8"></div>

                        <div className="grid lg:grid-cols-2 gap-12 items-start">
                            {/* Image skeleton */}
                            <div className="space-y-4">
                                <div className="aspect-square bg-slate-200 rounded-2xl border border-slate-100"></div>
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 bg-slate-200 rounded-lg"></div>
                                    <div className="w-20 h-20 bg-slate-200 rounded-lg"></div>
                                    <div className="w-20 h-20 bg-slate-200 rounded-lg"></div>
                                </div>
                            </div>

                            {/* Content skeleton */}
                            <div className="space-y-6">
                                <div className="h-4 w-20 bg-slate-200 rounded"></div>
                                <div className="h-12 w-3/4 bg-slate-300 rounded"></div>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-32 bg-slate-200 rounded"></div>
                                    <div className="h-6 w-24 bg-green-100 rounded-full"></div>
                                </div>
                                <div className="space-y-3 pt-4">
                                    <div className="h-4 w-full bg-slate-200 rounded"></div>
                                    <div className="h-4 w-5/6 bg-slate-200 rounded"></div>
                                    <div className="h-4 w-4/5 bg-slate-200 rounded"></div>
                                    <div className="h-4 w-full bg-slate-200 rounded"></div>
                                </div>
                                <div className="h-14 w-full bg-slate-300 rounded-xl mt-8"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    if (!product) {
        return (
            <main className="min-h-screen flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center relative">
                    <div className="relative z-10">
                        <div className="text-6xl mb-4 text-slate-300">🔍</div>
                        <h1 className="text-2xl font-bold text-slate-dark mb-4 font-ornamental">
                            {locale === 'ru' ? 'Товар не найден' : 'Product not found'}
                        </h1>
                        <Link href="/catalog" className="text-primary hover:underline font-medium transition-colors">
                            {locale === 'ru' ? 'Вернуться в каталог' : 'Return to Catalog'}
                        </Link>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    // Calculate total price including variations
    const totalPriceModifier = effectiveVariations.reduce((sum, group) => {
        const optionId = selectedVariations[group.id];
        const option = group.options.find(o => o.id === optionId);
        return sum + (option?.priceModifier || 0);
    }, 0);
    const totalPrice = (product?.basePrice || 0) + totalPriceModifier;

    const handleAddToCart = () => {
        if (!product) return;

        // Build configuration from selected variations
        const configuration: Record<string, string> = {};
        effectiveVariations.forEach(group => {
            const selectedOptionId = selectedVariations[group.id];
            if (selectedOptionId) {
                const option = group.options.find(o => o.id === selectedOptionId);
                if (option) {
                    const groupName = group.name[locale] || group.name.ru;
                    const optionLabel = option.label[locale] || option.label.ru;
                    configuration[groupName] = optionLabel;
                }
            }
        });

        addToCart({
            productId: product.id,
            productTitle: product.title,
            productImage: product.images?.[0] ? getThumbImageUrl(product.images[0]) : '',
            configuration,
            price: totalPrice,
            quantity: 1,
        });

        // Show toast notification
        addToast({
            message: locale === 'ru'
                ? `${product.title[locale]} добавлен в корзину`
                : `${product.title[locale]} added to cart`,
            type: 'success',
            duration: 3000,
        });

        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    return (
        <main className="min-h-screen flex flex-col">
            <Header />

            <div className="flex-1 w-full relative">
                <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
                    {/* Breadcrumbs */}
                    {(() => {
                        // Category translation helper
                        const currentLocale = (locale || 'ru') as 'en' | 'ru';
                        const category = product.category || '';
                        const matchedCat = allCategories.find(c => c.slug === category);
                        const categoryLabel = matchedCat?.title?.[currentLocale] || category;

                        return (
                            <nav className="flex items-center gap-2 text-sm text-slate-light mb-8 overflow-x-auto whitespace-nowrap pb-2">
                                <Link href="/" className="hover:text-primary transition-colors">{t('nav.home')}</Link>
                                <span className="text-slate-200">/</span>
                                <Link href="/catalog" className="hover:text-primary transition-colors">{t('nav.catalog')}</Link>
                                <span className="text-slate-200">/</span>
                                <Link href={`/catalog/${product.category}`} className="hover:text-primary text-xs font-bold tracking-wider">{categoryLabel}</Link>
                                <span className="text-slate-200">/</span>
                                <span className="text-primary font-medium truncate max-w-[200px]">{product.title[locale]}</span>
                            </nav>
                        );
                    })()}

                    <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
                        {/* Left: Images */}
                        <div className="space-y-4">
                            <div
                                className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 relative group product-image-container"
                                onContextMenu={(e) => e.preventDefault()}
                            >
                                {product.images && product.images.length > 0 ? (
                                    <Image
                                        src={getImageUrl(product.images[selectedImage])}
                                        alt={getImageAlt(product.images[selectedImage], locale as 'en' | 'ru', product.title[locale])}
                                        fill
                                        priority
                                        draggable={false}
                                        className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        onDragStart={(e) => e.preventDefault()}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-6xl bg-slate-50 text-slate-300">
                                        🕉️
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {product.images && product.images.length > 1 && (
                                <div className="flex gap-4 overflow-x-auto p-2 scrollbar-hide">
                                    {product.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(idx)}
                                            onContextMenu={(e) => e.preventDefault()}
                                            className={`relative w-20 h-20 rounded-lg overflow-hidden transition-all flex-shrink-0 product-image-container border ${selectedImage === idx ? 'border-primary shadow-sm scale-105 z-10' : 'border-transparent opacity-70 hover:opacity-100 hover:border-slate-300'
                                                }`}
                                        >
                                            <Image
                                                src={getThumbImageUrl(img)}
                                                alt={getImageAlt(img, locale as 'en' | 'ru', '')}
                                                fill
                                                draggable={false}
                                                className="object-cover"
                                                sizes="80px"
                                                onDragStart={(e) => e.preventDefault()}
                                            />
                                            <div className={`absolute inset-0 rounded-lg border-2 pointer-events-none transition-colors ${selectedImage === idx ? 'border-primary' : 'border-transparent'
                                                }`} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Info */}
                        <div className="flex flex-col">
                            <div className="mb-2">
                                <span className="text-primary font-semibold text-xs uppercase tracking-widest opacity-80">
                                    {t(`categories.${product.category}`)}
                                </span>
                            </div>

                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-dark mb-6 font-ornamental leading-tight">
                                {product.title[locale]}
                            </h1>

                            <div className="flex items-end gap-4 mb-8 pb-8 border-b border-slate-100">
                                <div className="flex flex-col">
                                    <span className="text-sm text-slate-light mb-1">{locale === 'ru' ? 'Цена' : 'Price'}</span>
                                    <span className="text-4xl font-bold text-primary font-elegant">
                                        {formatPrice(totalPrice)}
                                    </span>
                                </div>
                                {product.status === 'OUT_OF_STOCK' ? (
                                    <span className="mb-2 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        {locale === 'ru' ? 'Нет в наличии' : 'Out of Stock'}
                                    </span>
                                ) : product.status === 'COMING_SOON' ? (
                                    <span className="mb-2 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        {locale === 'ru' ? 'Скоро в продаже' : 'Coming Soon'}
                                    </span>
                                ) : product.status === 'HIDDEN' ? (
                                    <span className="mb-2 px-3 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        {locale === 'ru' ? 'Скрыт' : 'Hidden'}
                                    </span>
                                ) : (
                                    <span className="mb-2 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Check size={12} strokeWidth={3} />
                                        {locale === 'ru' ? 'В наличии' : 'In Stock'}
                                    </span>
                                )}
                            </div>

                            {/* Variations Selector */}
                            {effectiveVariations.length > 0 && (
                                <VariationSelector
                                    variations={effectiveVariations}
                                    selectedVariations={selectedVariations}
                                    onSelectionChange={(newSelection) => {
                                        setSelectedVariations(newSelection);
                                    }}
                                    locale={locale as 'en' | 'ru'}
                                />
                            )}

                            <div className="space-y-4 mt-8 w-full max-w-sm">
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={addedToCart || product.status === 'OUT_OF_STOCK' || product.status === 'COMING_SOON' || product.status === 'HIDDEN'}
                                    variant="primary"
                                    className="w-full text-sm py-4 shadow-sm disabled:opacity-50"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        {addedToCart ? (
                                            <>
                                                <Check size={20} />
                                                <span>{locale === 'ru' ? 'Добавлено!' : 'Added!'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart size={20} />
                                                <span>{t('product.addToCart') || 'Add to Cart'}</span>
                                            </>
                                        )}
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Full-width Description Section */}
                    <div className="mt-6 pt-8 border-t border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-dark font-ornamental mb-6">
                            {locale === 'ru' ? 'Описание' : 'Description'}
                        </h2>
                        <div className="prose prose-slate max-w-none leading-relaxed font-sans">
                            <Markdown
                                components={{
                                    h1: ({ ...props }) => <h3 className="text-2xl font-bold mt-6 mb-3 font-ornamental text-slate-dark" {...props} />,
                                    h2: ({ ...props }) => <h4 className="text-xl font-bold mt-5 mb-2 font-ornamental text-slate-dark" {...props} />,
                                    h3: ({ ...props }) => <h5 className="text-lg font-bold mt-4 mb-2 font-ornamental text-slate-dark" {...props} />,
                                    ul: ({ ...props }) => <ul className="list-disc pl-5 my-4 space-y-1 marker:text-primary" {...props} />,
                                    ol: ({ ...props }) => <ol className="list-decimal pl-5 my-4 space-y-1 marker:text-primary" {...props} />,
                                    li: ({ ...props }) => <li className="pl-1 text-slate" {...props} />,
                                    p: ({ ...props }) => <p className="mb-4 text-slate" {...props} />,
                                    strong: ({ ...props }) => <strong className="font-bold text-slate-dark" {...props} />,
                                    em: ({ ...props }) => <em className="italic text-slate-dark" {...props} />,
                                    img: () => null,
                                }}
                            >
                                {product.description[locale]}
                            </Markdown>
                        </div>
                    </div>

                    {/* Related Products */}
                    <RelatedProducts currentProductId={product.id} category={product.category || 'general'} />

                </div>
            </div>

            <Footer />
        </main>
    );
}

