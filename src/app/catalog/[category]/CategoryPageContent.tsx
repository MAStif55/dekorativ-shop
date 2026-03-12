'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CATEGORIES, getCategoryBySlug, CategorySlug, SubCategory } from '@/types/category';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getProductsByCategory, getSubcategories } from '@/lib/firestore-utils';
import { Product, getImageUrl } from '@/types/product';
import ProductCard from '@/components/ProductCard';
import { useScrollRestore } from '@/hooks/useScrollRestore';
import { useProductStore } from '@/store/product-store';

interface CategoryPageContentProps {
    categorySlug: CategorySlug;
}

// ... (existing imports)

export default function CategoryPageContent({ categorySlug }: CategoryPageContentProps) {
    const { locale, t } = useLanguage();
    const category = getCategoryBySlug(categorySlug);

    // Global Store
    const { products: allProducts, isLoading: isProductsLoading, hasHydrated, fetchProducts } = useProductStore();

    // Local state for subcategories
    const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
    const [subcatsLoading, setSubcatsLoading] = useState(true);

    // Filter products for this category
    const products = allProducts.filter(p => p.category === categorySlug);

    // Initial fetch of products (if needed) and subcategories
    useEffect(() => {
        fetchProducts();

        async function loadSubcats() {
            setSubcatsLoading(true);
            try {
                const data = await getSubcategories<SubCategory>(categorySlug);
                setSubcategories(data);
            } catch (error) {
                console.error("Error loading subcategories:", error);
            } finally {
                setSubcatsLoading(false);
            }
        }
        loadSubcats();
    }, [categorySlug, fetchProducts]);

    // Restore scroll position - ready when products are loaded AND store is hydrated
    const shouldBeVisible = useScrollRestore(!isProductsLoading && hasHydrated);

    if (!category) {
        // ... (existing 404 block)
        return (
            <main className="min-h-screen">
                {/* ... existing 404 content */}
                <Header />
                <div className="flex-1 flex items-center justify-center py-5">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🤔</div>
                        <h1 className="text-2xl font-bold text-slate-dark mb-4">
                            {locale === 'ru' ? 'Категория не найдена' : 'Category not found'}
                        </h1>
                        <Link href="/catalog" className="text-primary hover:underline inline-flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                            </svg>
                            {locale === 'ru' ? 'Вернуться в каталог' : 'Back to catalog'}
                        </Link>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    // Memoize random images for each subcategory block
    const subcategoryThumbnails = useMemo(() => {
        const thumbnails: Record<string, string> = {};
        subcategories.forEach(sub => {
            const blockProducts = products.filter(p => p.subcategory === sub.slug);
            if (blockProducts.length > 0) {
                // Pick random product
                const randomIndex = Math.floor(Math.random() * blockProducts.length);
                const product = blockProducts[randomIndex];
                if (product.images && product.images.length > 0) {
                    thumbnails[sub.slug] = getImageUrl(product.images[0]);
                }
            }
        });
        return thumbnails;
    }, [subcategories, products]);

    const scrollToBlock = (slug: string) => {
        const element = document.getElementById(`block-${slug}`);
        if (element) {
            const headerOffset = 100; // Account for sticky header if exists
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <main
            className={`min-h-screen flex flex-col transition-opacity duration-300 ${shouldBeVisible ? 'opacity-100' : 'opacity-0'}`}
        >
            <Header />

            {/* Hero Banner */}
            <section className="py-8 sm:py-12 px-4 sm:px-6 text-center relative overflow-hidden flex-shrink-0">
                <div className="relative z-10">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-ornamental text-slate-dark mb-4 drop-shadow-sm">
                        {category.title[locale]}
                    </h2>
                    <p className="text-base sm:text-lg text-slate max-w-2xl mx-auto font-elegant px-2">
                        {category.description[locale]}
                    </p>
                </div>
            </section>

            {/* Catalog Content */}
            <section className="relative flex-1 w-full">
                <div className="pb-12 px-4 sm:px-6 max-w-6xl mx-auto relative z-10">
                    {/* Breadcrumb */}
                    <nav className="mb-8 text-sm text-slate-light">
                        <Link href="/" className="hover:text-primary transition-colors">{t('nav.home')}</Link>
                        {' / '}
                        <Link href="/catalog" className="hover:text-primary transition-colors">{t('nav.catalog')}</Link>
                        {' / '}
                        <span className="text-primary font-medium">{category.title[locale]}</span>
                    </nav>

                    {/* Anchor Navigation Row */}
                    {!isProductsLoading && subcategories.length > 0 && (
                        <div className="flex gap-4 mb-12 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x">
                            {subcategories.map(sub => {
                                const thumb = subcategoryThumbnails[sub.slug];
                                const hasProducts = products.some(p => p.subcategory === sub.slug);
                                if (!hasProducts) return null;
                                
                                return (
                                    <button
                                        key={`nav-${sub.slug}`}
                                        onClick={() => scrollToBlock(sub.slug)}
                                        className="flex flex-col items-center flex-shrink-0 w-32 sm:w-40 group text-center cursor-pointer transition-transform hover:-translate-y-1 snap-start focus:outline-none"
                                    >
                                        <div className="w-full aspect-square rounded-2xl overflow-hidden mb-3 border border-slate-200 shadow-sm relative bg-slate-50 group-hover:border-primary/50 group-hover:shadow-md transition-all">
                                            {thumb ? (
                                                <img src={thumb} alt={sub.title[locale]} className="w-full h-full object-cover" loading="lazy" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-sm font-medium text-slate-dark group-hover:text-primary transition-colors line-clamp-2 px-1">
                                            {sub.title[locale]}
                                        </span>
                                        <div className="mt-1.5 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            {locale === 'ru' ? 'Перейти →' : 'Go →'}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Catalog Blocks */}
                    {isProductsLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : products.length > 0 ? (
                        <div className="space-y-16 sm:space-y-24">
                            {subcategories.map(sub => {
                                const blockProducts = products.filter(p => p.subcategory === sub.slug);
                                if (blockProducts.length === 0) return null;

                                return (
                                    <section key={sub.slug} id={`block-${sub.slug}`} className="scroll-mt-24">
                                        <div className="mb-6 sm:mb-8 text-center sm:text-left">
                                            <h3 className="text-2xl sm:text-3xl font-ornamental text-slate-dark mb-2">
                                                {sub.title[locale]}
                                            </h3>
                                            {sub.description && sub.description[locale] && (
                                                <p className="text-slate text-sm sm:text-base max-w-3xl font-elegant mx-auto sm:mx-0">
                                                    {sub.description[locale]}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                                            {blockProducts.map((product) => (
                                                <ProductCard key={product.id} product={product} />
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}

                            {/* Default Block (Products without subcategory) */}
                            {(() => {
                                const defaultProducts = products.filter(p => !p.subcategory || !subcategories.some(sub => sub.slug === p.subcategory));
                                if (defaultProducts.length === 0) return null;

                                return (
                                    <section id="block-other" className="scroll-mt-24 pt-4 border-t border-slate-100">
                                        <div className="mb-6 sm:mb-8 text-center sm:text-left">
                                            <h3 className="text-2xl sm:text-3xl font-ornamental text-slate-dark mb-2">
                                                {locale === 'ru' ? 'Другое' : 'Other'}
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                                            {defaultProducts.map((product) => (
                                                <ProductCard key={product.id} product={product} />
                                            ))}
                                        </div>
                                    </section>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4 opacity-50 grayscale">{category.icon}</div>
                            <p className="text-xl text-slate-dark mb-4 font-elegant">
                                {locale === 'ru'
                                    ? 'Товары не найдены'
                                    : 'No products found'}
                            </p>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
}
