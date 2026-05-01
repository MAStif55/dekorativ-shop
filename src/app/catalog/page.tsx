'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import CategoryCard from '@/components/CategoryCard';
import { Product, getCardImageUrl } from '@/types/product';
import { useProductStore } from '@/store/product-store';
import { useCategoryStore } from '@/store/category-store';
import { useScrollRestore } from '@/hooks/useScrollRestore';

export default function CatalogPage() {
    const { locale, t } = useLanguage();
    const { products, isLoading: isLoadingProducts, hasHydrated: hasHydratedProducts, fetchProducts } = useProductStore();
    const { categories, isLoading: isLoadingCategories, hasHydrated: hasHydratedCategories, fetchCategories } = useCategoryStore();

    const isLoading = isLoadingProducts || isLoadingCategories;
    const hasHydrated = hasHydratedProducts && hasHydratedCategories;

    // Restore scroll position - only if NOT loading AND hydrated
    // This ensures we don't try to scroll on an empty (pre-hydrated) page
    const shouldBeVisible = useScrollRestore(!isLoading && hasHydrated);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [fetchProducts, fetchCategories]);



    return (
        <main
            className={`min-h-screen flex flex-col transition-opacity duration-300 ${shouldBeVisible ? 'opacity-100' : 'opacity-0'}`}
        >
            <Header />
            <section className="relative z-10 py-12 sm:py-16 text-center"> {/* Added section wrapper for title/description */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-ornamental text-slate-dark mb-4 drop-shadow-sm">
                    {t('nav.catalog')}
                </h2>
                <p className="text-base sm:text-lg text-slate max-w-2xl mx-auto font-elegant px-2">
                    {locale === 'ru'
                        ? 'Откройте для себя нашу коллекцию'
                        : 'Discover our collection'}
                </p>
            </section>

            {/* Catalog Content */}
            <section className="relative flex-1 w-full">
                <div className="pb-12 px-4 sm:px-6 max-w-6xl mx-auto relative z-10">


                    {/* Products Grid */}
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : categories.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {categories.map((category) => {
                                const categoryProducts = products.filter(p => p.category === category.slug && p.status !== 'HIDDEN');
                                // Pick a random product from the category to use as the cover image
                                const randomIndex = Math.floor(Math.random() * categoryProducts.length);
                                const coverProduct = categoryProducts.length > 0 ? categoryProducts[randomIndex] : null;
                                const coverImageUrl = coverProduct?.images?.[0] ? getCardImageUrl(coverProduct.images[0]) : undefined;

                                return (
                                    <CategoryCard 
                                        key={category.slug} 
                                        category={category} 
                                        coverImageUrl={coverImageUrl} 
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4 opacity-50 grayscale">🏷️</div>
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
