'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CategorySlug, SubCategory } from '@/types/category';
import { useCategoryStore } from '@/store/category-store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getProductsByCategory, getSubcategories } from '@/lib/firestore-utils';
import { Product, ProductStatus, STATUS_PRIORITY, getImageUrl } from '@/types/product';
import ProductCard from '@/components/ProductCard';
import { useScrollRestore } from '@/hooks/useScrollRestore';
import { useProductStore } from '@/store/product-store';
import Markdown from 'react-markdown';

interface CategoryPageContentProps {
    categorySlug: CategorySlug;
}

/* ─── Ornamental divider between sections ─── */
function SectionDivider() {
    return (
        <div className="flex items-center justify-center gap-3 py-2" aria-hidden="true">
            <span className="block w-12 h-px bg-gradient-to-r from-transparent to-primary/40" />
            <span className="block w-1.5 h-1.5 rounded-full bg-primary/50" />
            <span className="block w-1.5 h-1.5 rounded-full bg-primary/30" />
            <span className="block w-1.5 h-1.5 rounded-full bg-primary/50" />
            <span className="block w-12 h-px bg-gradient-to-l from-transparent to-primary/40" />
        </div>
    );
}

/* ─── Decorative underline accent for section titles ─── */
function TitleAccent() {
    return (
        <div className="flex justify-center mt-3 mb-6" aria-hidden="true">
            <span className="block w-16 h-[2px] rounded-full bg-gradient-to-r from-primary-light via-primary to-primary-light" />
        </div>
    );
}

/* ─── Shared Markdown component config for descriptions ─── */
const markdownComponents = {
    p: ({ ...props }: React.ComponentPropsWithoutRef<'p'>) => (
        <p className="mb-4 last:mb-0" {...props} />
    ),
    h1: ({ ...props }: React.ComponentPropsWithoutRef<'h2'>) => (
        <h2 className="text-2xl font-ornamental text-slate-dark mb-4" {...props} />
    ),
    h2: ({ ...props }: React.ComponentPropsWithoutRef<'h3'>) => (
        <h3 className="text-xl font-ornamental text-slate-dark mb-3" {...props} />
    ),
    img: ({ ...props }: React.ComponentPropsWithoutRef<'img'>) => (
        <img className="rounded-2xl shadow-lg mx-auto my-10 max-w-full sm:max-w-[85%]" {...props} />
    ),
    blockquote: ({ ...props }: React.ComponentPropsWithoutRef<'blockquote'>) => (
        <blockquote className="border-l-[3px] border-primary pl-5 text-slate-light italic my-6" {...props} />
    ),
    a: ({ ...props }: React.ComponentPropsWithoutRef<'a'>) => (
        <a className="text-turquoise-dark underline underline-offset-2 hover:text-turquoise transition-colors" {...props} />
    ),
    ul: ({ ...props }: React.ComponentPropsWithoutRef<'ul'>) => (
        <ul className="list-disc pl-6 my-4 space-y-2 text-left" {...props} />
    ),
    ol: ({ ...props }: React.ComponentPropsWithoutRef<'ol'>) => (
        <ol className="list-decimal pl-6 my-4 space-y-2 text-left" {...props} />
    ),
};

export default function CategoryPageContent({ categorySlug }: CategoryPageContentProps) {
    const { locale, t } = useLanguage();
    const currentLocale = (locale || 'ru') as 'en' | 'ru';
    const { categories, fetchCategories } = useCategoryStore();
    const category = categories.find(c => c.slug === categorySlug);

    // Global Store
    const { products: allProducts, isLoading: isProductsLoading, hasHydrated, fetchProducts } = useProductStore();

    // Local state for subcategories
    const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
    const [subcatsLoading, setSubcatsLoading] = useState(true);

    // Filter products for this category, exclude HIDDEN
    const products = allProducts.filter(p => p.category === categorySlug && (p.status || 'AVAILABLE') !== 'HIDDEN');

    // Sort products by status priority: AVAILABLE > OUT_OF_STOCK > COMING_SOON
    const sortByStatus = (items: Product[]) => {
        return [...items].sort((a, b) => {
            const priorityA = STATUS_PRIORITY[(a.status || 'AVAILABLE') as ProductStatus];
            const priorityB = STATUS_PRIORITY[(b.status || 'AVAILABLE') as ProductStatus];
            return priorityA - priorityB;
        });
    };

    // Initial fetch of products (if needed) and subcategories
    useEffect(() => {
        fetchProducts();
        fetchCategories();

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
    }, [categorySlug, fetchProducts, fetchCategories]);

    // Restore scroll position - ready when products are loaded AND store is hydrated
    const shouldBeVisible = useScrollRestore(!isProductsLoading && hasHydrated);

    // Memoize random images for each subcategory block
    const subcategoryThumbnails = useMemo(() => {
        const thumbnails: Record<string, string> = {};
        subcategories.forEach(sub => {
            const blockProducts = products.filter(p => p.subcategory === sub.slug);
            if (blockProducts.length > 0) {
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
            const headerOffset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    /* ─── Not found state ─── */
    if (!category) {
        return (
            <main className="min-h-screen">
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

    /* ─── Subcategories with products ─── */
    const visibleSubcategories = subcategories.filter(sub =>
        products.some(p => p.subcategory === sub.slug)
    );

    return (
        <main
            className={`min-h-screen flex flex-col transition-opacity duration-300 ${shouldBeVisible ? 'opacity-100' : 'opacity-0'}`}
        >
            <Header />

            {/* ═══════════════════════════════════════════════════
                PAGE CONTAINER
                ═══════════════════════════════════════════════════ */}
            <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6">

                {/* ─── HEADER: BREADCRUMBS + DESCRIPTION ─── */}
                <section className="pt-5 pb-3">
                    {/* Breadcrumbs — left-aligned, primary navigation cue */}
                    <nav className="mb-3 flex items-center gap-2 text-xs tracking-wide uppercase text-slate-light">
                        <Link href="/" className="hover:text-primary transition-colors duration-200">
                            {t('nav.home')}
                        </Link>
                        <span className="opacity-40 text-[10px]" aria-hidden="true">›</span>
                        <Link href="/catalog" className="hover:text-primary transition-colors duration-200">
                            {t('nav.catalog')}
                        </Link>
                        <span className="opacity-40 text-[10px]" aria-hidden="true">›</span>
                        <span className="text-primary font-medium">
                            {category.title?.[locale] || category.title?.ru || ''}
                        </span>
                    </nav>

                </section>


                {/* ─── ANCHOR NAVIGATION — Overlay Cards ─── */}
                {!isProductsLoading && visibleSubcategories.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
                        {visibleSubcategories.map(sub => {
                            const thumb = subcategoryThumbnails[sub.slug];
                            const title = sub.title?.[locale] || sub.title?.ru || '';

                            return (
                                <button
                                    key={`nav-${sub.slug}`}
                                    onClick={() => scrollToBlock(sub.slug)}
                                    className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-md hover:shadow-xl border border-white/20 hover:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 transition-all duration-500 cursor-pointer"
                                    aria-label={title}
                                >
                                    {/* Image — zooms on hover */}
                                    {thumb ? (
                                        <img
                                            src={thumb}
                                            alt={title}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-slate-200 flex items-center justify-center text-slate-400">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Uniform dark scrim — guarantees legibility */}
                                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/65 transition-colors duration-500" />

                                    {/* Title — absolutely centered */}
                                    <div className="absolute inset-0 flex items-center justify-center px-4">
                                        <span className="text-white text-sm sm:text-base lg:text-lg font-semibold uppercase tracking-widest leading-tight text-center drop-shadow-sm">
                                            {title}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}


                {/* ─── CONTENT SECTIONS ─── */}
                <div className="pb-24">
                    {isProductsLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-8 h-8 border-3 border-slate-200 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : products.length > 0 ? (
                        <div className="flex flex-col">
                            {visibleSubcategories.map((sub, idx) => {
                                const blockProducts = sortByStatus(products.filter(p => p.subcategory === sub.slug));
                                if (blockProducts.length === 0) return null;

                                return (
                                    <div key={sub.slug}>
                                        {idx > 0 && (
                                            <div className="py-5">
                                                <SectionDivider />
                                            </div>
                                        )}

                                        <section id={`block-${sub.slug}`} className="scroll-mt-24">
                                            {/* Section Header — large & centered */}
                                            <div className="mb-4">
                                                <h2 className="text-2xl sm:text-3xl font-ornamental text-slate-dark text-center mb-3">
                                                    {sub.title?.[currentLocale] || sub.title?.ru || ''}
                                                </h2>

                                                {sub.description && (sub.description[currentLocale] || sub.description.ru || sub.description.en) && (
                                                    <div className="text-sm text-slate-dark font-medium leading-tight mt-1.5 text-left catalog-prose">
                                                        <Markdown components={markdownComponents}>
                                                            {sub.description[currentLocale] || sub.description.ru || sub.description.en || ''}
                                                        </Markdown>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Product Grid */}
                                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                                {blockProducts.map((product) => (
                                                    <ProductCard key={product.id} product={product} />
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                );
                            })}

                            {/* Default "Other" Block */}
                            {(() => {
                                const defaultProducts = sortByStatus(products.filter(p => !p.subcategory || !subcategories.some(sub => sub.slug === p.subcategory)));
                                if (defaultProducts.length === 0) return null;

                                return (
                                    <div>
                                        {visibleSubcategories.length > 0 && (
                                            <div className="py-5">
                                                <SectionDivider />
                                            </div>
                                        )}

                                        <section id="block-other" className="scroll-mt-24">
                                            <h2 className="text-2xl sm:text-3xl font-ornamental text-slate-dark text-center mb-4">
                                                {locale === 'ru' ? 'Другое' : 'Other'}
                                            </h2>

                                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                                {defaultProducts.map((product) => (
                                                    <ProductCard key={product.id} product={product} />
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="text-center py-24">
                            <div className="text-5xl mb-6 opacity-20 grayscale">{category.icon}</div>
                            <p className="text-lg text-slate font-light">
                                {locale === 'ru' ? 'Товары скоро появятся' : 'Products coming soon'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </main>
    );
}
