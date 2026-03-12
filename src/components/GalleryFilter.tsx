'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { getGalleryImages } from '@/lib/firestore-utils';
import { GalleryImage } from '@/types/gallery';
import { Loader2 } from 'lucide-react';

export default function GalleryFilter() {
    const { t, locale } = useLanguage();
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [categories, setCategories] = useState<string[]>(['all']);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const fetchedImages = await getGalleryImages<GalleryImage>();
                setImages(fetchedImages);

                // Extract unique categories dynamically
                const uniqueCats = Array.from(new Set(fetchedImages.map(img => img.category))).filter(Boolean);
                setCategories(['all', ...uniqueCats]);
            } catch (error) {
                console.error("Failed to load gallery images", error);
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, []);

    const filteredImages = activeCategory === 'all'
        ? images
        : images.filter(img => img.category === activeCategory);

    // Helper to translate category names if they exist in localization, otherwise title-case them
    const renderCategoryName = (cat: string) => {
        if (cat === 'all') return t('gallery.filters.all') || (locale === 'ru' ? 'Все работы' : 'All Works');

        // Try to find a translation in the new dynamic namespace, or fallback to the raw category string
        const translation = t(`gallery.filters.${cat}`);
        if (translation && translation !== `gallery.filters.${cat}`) {
            return translation;
        }

        // Capitalize first letter as fallback
        return cat.charAt(0).toUpperCase() + cat.slice(1);
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-turquoise" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mb-12 relative z-20">
            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-8">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 ${activeCategory === cat
                                ? 'bg-turquoise text-white shadow-md'
                                : 'bg-white border border-slate-200 text-slate hover:border-turquoise/50 hover:text-turquoise-dark hover:bg-slate-50'
                            }`}
                    >
                        {renderCategoryName(cat)}
                    </button>
                ))}
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8 min-h-[500px] content-start">
                {filteredImages.map((image) => (
                    <div
                        key={image.id}
                        className="group relative aspect-square rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 bg-white border border-slate-100 animate-in fade-in zoom-in duration-500"
                    >
                        <Image
                            src={image.imageUrl}
                            alt={image.title || image.category || 'Gallery Image'}
                            fill
                            loading="lazy"
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-slate-dark/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center backdrop-blur-[2px] p-6 text-center">
                            <span className="text-white font-medium text-lg tracking-wide transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100 placeholder-shown:">
                                {image.title || renderCategoryName(image.category)}
                            </span>
                        </div>
                    </div>
                ))}

                {filteredImages.length === 0 && (
                    <div className="col-span-full py-5 text-center text-slate font-light text-xl bg-white rounded-3xl border border-slate-100 shadow-sm">
                        {locale === 'ru' ? 'Фотографии в этой категории пока не добавлены.' : 'No photos found in this category yet.'}
                    </div>
                )}
            </div>
        </div>
    );
}
