'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CATEGORIES, getCategoryBySlug, CategorySlug, SubCategory } from '@/types/category';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getProductsByCategory, getSubcategories } from '@/lib/firestore-utils';
import { Product } from '@/types/product';
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

    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

    // Filter products by selected tags (AND Logic) and Search Query
    const filteredProducts = products.filter(product => {
        // 1. Filter by Subcategory
        if (selectedSubcategory && product.subcategory !== selectedSubcategory) {
            return false;
        }

        return true;
    });

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

                    {/* Subcategories Filter - Only if current category has them */}
                    {subcategories.length > 0 && (
                        <div className="flex gap-2 sm:gap-3 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center scrollbar-hide flex-nowrap">
                            <button
                                onClick={() => setSelectedSubcategory(null)}
                                className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg border font-medium transition-all text-sm whitespace-nowrap flex-shrink-0 ${!selectedSubcategory
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-white text-slate border-slate-200 hover:border-primary/50'
                                    }`}
                            >
                                {t('categories.all')}
                            </button>
                            {subcategories.map((sub) => (
                                <button
                                    key={sub.slug}
                                    onClick={() => setSelectedSubcategory(sub.slug === selectedSubcategory ? null : sub.slug)}
                                    className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg border font-medium transition-all text-sm whitespace-nowrap flex-shrink-0 ${selectedSubcategory === sub.slug
                                        ? 'bg-primary text-white border-primary shadow-sm'
                                        : 'bg-white text-slate border-slate-200 hover:border-primary hover:text-primary'
                                        }`}
                                >
                                    {sub.title[locale]}
                                </button>
                            ))}
                        </div>
                    )}



                    {/* Products Grid */}
                    {isProductsLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4 opacity-50 grayscale">{category.icon}</div>
                            <p className="text-xl text-slate-dark mb-4 font-elegant">
                                {locale === 'ru'
                                    ? 'Товары не найдены'
                                    : 'No products found'}
                            </p>
                            <button
                                onClick={() => {
                                    setSelectedSubcategory(null);
                                }}
                                className="text-primary font-medium hover:underline transition-colors"
                            >
                                {locale === 'ru' ? 'Сбросить фильтры' : 'Reset filters'}
                            </button>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
}
