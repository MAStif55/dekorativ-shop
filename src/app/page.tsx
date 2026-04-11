'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getNewestProducts, getNewestPortfolioPhotos } from '@/actions/catalog-actions';
import { Product } from '@/types/product';
import { PortfolioPhoto } from '@/types/portfolio';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
    const { locale, t } = useLanguage();
    const [newArrivals, setNewArrivals] = useState<Product[]>([]);
    const [loadingArrivals, setLoadingArrivals] = useState(true);
    const [galleryWorks, setGalleryWorks] = useState<PortfolioPhoto[]>([]);
    const [loadingGallery, setLoadingGallery] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [products, images] = await Promise.all([
                    getNewestProducts(4),
                    getNewestPortfolioPhotos(4)
                ]);
                setNewArrivals(products);
                setGalleryWorks(images);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoadingArrivals(false);
                setLoadingGallery(false);
            }
        };
        fetchData();
    }, []);

    return (
        <main className="min-h-screen flex flex-col">
            <Header variant="transparent" />

            {/* MINIMALIST HERO SECTION */}
            <section className="flex-1 flex items-center justify-center px-4 sm:px-6 py-5 lg:py-16 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl aspect-square bg-turquoise-light/30 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="text-center max-w-4xl mx-auto relative z-10">


                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-ornamental tracking-tight text-slate-dark leading-[1.1] mb-8">
                        {locale === 'ru' ? 'Граверная мастерская' : 'Engraving Workshop'}
                    </h1>

                    <p className="text-xl sm:text-2xl md:text-3xl text-slate-dark font-medium mb-4">
                        {locale === 'ru' ? 'Лазерная гравировка в Омске' : 'Laser engraving in Omsk'}
                    </p>

                    <p className="text-lg sm:text-lg md:text-xl text-slate max-w-3xl mx-auto mb-6 font-light leading-relaxed">
                        {locale === 'ru'
                            ? 'Точное и долговечное нанесение текста, логотипов и рисунков. Работаем с вашими предметами и нашими заготовками. От 1 штуки до оптовых партий.'
                            : 'Precise and durable application of text, logos, and drawings. We work with your items and our blanks. From 1 piece to wholesale batches.'}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/catalog" className="btn-primary w-full sm:w-auto text-lg px-8 py-4 flex items-center justify-center gap-2 group">
                            {locale === 'ru' ? 'Каталог' : 'Catalog'}
                            <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/gallery" className="btn-outline w-full sm:w-auto text-lg px-8 py-4 bg-white/50 backdrop-blur-sm">
                            {locale === 'ru' ? 'Галерея работ' : 'Gallery of Works'}
                        </Link>
                    </div>
                </div>
            </section>

            {/* SPLIT SECTIONS: FEATURED PRODUCTS & NEW IN GALLERY */}
            <section className="py-6 px-4 sm:px-6 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col gap-24">

                    {/* 1. Featured Products */}
                    <div>
                        <div className="flex flex-col items-center justify-center text-center mb-6 gap-4">
                            <h2 className="text-4xl md:text-5xl font-ornamental text-slate-dark drop-shadow-sm">
                                {locale === 'ru' ? 'Популярные товары' : 'Featured Products'}
                            </h2>
                            <p className="text-slate text-lg max-w-2xl">
                                {locale === 'ru'
                                    ? 'Выбор наших клиентов и лучшие предложения.'
                                    : 'Our customers\' favorites and best offers.'}
                            </p>
                        </div>

                        {loadingArrivals ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="aspect-[3/4] rounded-2xl bg-white/40 animate-pulse border border-slate-100"></div>
                                ))}
                            </div>
                        ) : newArrivals.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {newArrivals.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-5 text-slate bg-white/40 rounded-3xl border border-slate-100 backdrop-blur-sm">
                                {locale === 'ru' ? 'Каталог пока пуст' : 'Catalog is currently empty'}
                            </div>
                        )}

                        <div className="mt-6 text-center">
                            <Link href="/catalog" className="inline-flex items-center gap-2 text-turquoise-dark font-semibold hover:text-turquoise transition-colors group">
                                {locale === 'ru' ? 'Смотреть весь каталог' : 'View entire catalog'}
                                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* 2. New in Gallery */}
                    <div>
                        <div className="flex flex-col items-center justify-center text-center mb-6 gap-4">
                            <h2 className="text-4xl md:text-5xl font-ornamental text-slate-dark drop-shadow-sm">
                                {locale === 'ru' ? 'Новое в галерее' : 'New in Gallery'}
                            </h2>
                            <p className="text-slate text-lg max-w-2xl">
                                {locale === 'ru'
                                    ? 'Вдохновитесь нашими недавними проектами и найдите идею для подарка.'
                                    : 'Get inspired by our recent projects and find a gift idea.'}
                            </p>
                        </div>

                        {loadingGallery ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="aspect-square rounded-2xl bg-white/40 animate-pulse border border-slate-100"></div>
                                ))}
                            </div>
                        ) : galleryWorks.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                {galleryWorks.map((work) => (
                                    <Link key={work.id} href="/gallery" className="group rounded-2xl overflow-hidden aspect-square relative shadow-sm hover:shadow-md transition-shadow border border-slate-100">
                                        <Image
                                            src={work.imageUrl}
                                            alt={work.seo?.altText?.[locale as 'ru' | 'en'] || work.seo?.altText?.ru || work.seo?.title || 'Gallery work'}
                                            fill
                                            sizes="(max-width: 768px) 50vw, 25vw"
                                            className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-slate-dark/0 group-hover:bg-slate-dark/10 transition-colors duration-300 pointer-events-none" />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-5 text-slate bg-white/40 rounded-3xl border border-slate-100 backdrop-blur-sm">
                                {locale === 'ru' ? 'Фотографии пока не добавлены' : 'No photos added yet'}
                            </div>
                        )}

                        <div className="mt-6 text-center">
                            <Link href="/gallery" className="inline-flex items-center gap-2 text-turquoise-dark font-semibold hover:text-turquoise transition-colors group">
                                {locale === 'ru' ? 'Смотреть все работы' : 'View all works'}
                                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                </div>
            </section>

            <Footer />
        </main>
    );
}

