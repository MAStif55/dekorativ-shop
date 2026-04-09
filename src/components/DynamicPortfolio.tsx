'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { PortfolioCategory, PortfolioPhoto } from '@/types/portfolio';
import { PortfolioRepository } from '@/lib/data';
import { X } from 'lucide-react';

interface DynamicPortfolioProps {
    pageId: string;
    title?: { en: string; ru: string };
    subtitle?: { en: string; ru: string };
}

interface CategoryWithPhotos extends PortfolioCategory {
    photos: PortfolioPhoto[];
}

export default function DynamicPortfolio({ pageId, title, subtitle }: DynamicPortfolioProps) {
    const { locale } = useLanguage();
    const [categories, setCategories] = useState<CategoryWithPhotos[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<PortfolioPhoto | null>(null);

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                // Fetch categories mapped to this page
                const cats = await PortfolioRepository.getCategoriesByPage(pageId);

                // Fetch photos for each category
                const completeCats = await Promise.all(cats.map(async (cat) => {
                    const photos = await PortfolioRepository.getPhotosByCategory(cat.id);
                    return { ...cat, photos };
                }));

                // Only render categories that actually have photos
                setCategories(completeCats.filter(c => c.photos.length > 0));
            } catch (error) {
                console.error('Error fetching dynamic portfolio:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPortfolio();
    }, [pageId]);

    // Abort render gracefully if nothing is mapped
    if (!loading && categories.length === 0) {
        return null;
    }

    const defaultTitle = { en: 'Our Work Portfolio', ru: 'Портфолио наших работ' };
    const displayTitle = title || defaultTitle;

    return (
        <>
            <section className="py-6 px-4 sm:px-6 relative z-10 w-full overflow-hidden">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="text-center mb-8 transition-opacity duration-500">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center animate-pulse gap-6">
                                <div className="h-12 bg-slate-200/50 rounded-xl w-3/4 max-w-md"></div>
                                <div className="h-4 bg-slate-200/50 rounded-lg w-1/2 max-w-sm"></div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-4xl md:text-5xl font-ornamental text-slate-dark mb-4">
                                    {categories.length === 1
                                        ? (categories[0].name[locale as 'ru' | 'en'] || categories[0].name.ru)
                                        : (displayTitle[locale as 'ru' | 'en'] || displayTitle.ru)}
                                </h2>
                                {(subtitle || (categories.length === 1 && categories[0].description)) && (
                                    <p className="text-lg text-slate max-w-2xl mx-auto whitespace-pre-wrap leading-relaxed">
                                        {(categories.length === 1 && categories[0].description)
                                            ? (categories[0].description[locale as 'ru' | 'en'] || categories[0].description.ru)
                                            : (subtitle?.[locale as 'ru' | 'en'] || subtitle?.ru)}
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="aspect-square rounded-2xl bg-white/40 animate-pulse border border-slate-100"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-12">
                            {categories.map((cat, idx) => {
                                const descriptionStr = cat.description?.[locale as 'ru' | 'en'] || cat.description?.ru;

                                return (
                                    <div key={cat.id} className="w-full">

                                        {/* Category Description (only if multiple categories, 
                                        since for a single category it's hoisted to the main header) */}
                                        {categories.length > 1 && (
                                            <div className="mb-8 text-center max-w-3xl mx-auto">
                                                <h3 className="text-2xl font-bold text-slate-dark mb-3">
                                                    {cat.name[locale as 'ru' | 'en'] || cat.name.ru}
                                                </h3>
                                                {descriptionStr && (
                                                    <p className="text-lg text-slate/80 leading-relaxed whitespace-pre-wrap">
                                                        {descriptionStr}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Category Photo Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                                            {cat.photos.map((photo) => (
                                                <div
                                                    key={photo.id}
                                                    className="group rounded-2xl overflow-hidden aspect-square relative shadow-sm hover:shadow-md transition-all border border-slate-100 bg-white cursor-pointer"
                                                    onClick={() => setSelectedPhoto(photo)}
                                                >
                                                    <Image
                                                        src={photo.imageUrl}
                                                        alt={photo.seo.altText[locale as 'ru' | 'en'] || photo.seo.altText.ru || photo.seo.title}
                                                        fill
                                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                        className="object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                                    />

                                                    {/* Hover overlay with SEO description */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-4 lg:p-6 pointer-events-none">
                                                        {(photo.seo.description?.[locale as 'ru' | 'en'] || photo.seo.description?.ru) && (
                                                            <div className="text-white font-medium text-xs sm:text-[1.05rem] leading-snug transform sm:translate-y-2 sm:group-hover:translate-y-0 transition-transform duration-300 line-clamp-3 sm:line-clamp-none">
                                                                {photo.seo.description[locale as 'ru' | 'en'] || photo.seo.description.ru}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Lightbox Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/95 p-4 sm:p-8 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/50 hover:text-white p-2 transition-colors focus:outline-none"
                        onClick={(e) => { e.stopPropagation(); setSelectedPhoto(null); }}
                    >
                        <X size={36} />
                    </button>

                    <div
                        className="relative w-full max-w-7xl max-h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative w-full h-[85vh]">
                            <Image
                                src={selectedPhoto.imageUrl}
                                alt={selectedPhoto.seo.altText[locale as 'ru' | 'en'] || selectedPhoto.seo.altText.ru || 'Portfolio photo'}
                                fill
                                sizes="100vw"
                                quality={100}
                                className="object-contain drop-shadow-2xl"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
