'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const placeholderImages = [
    'https://images.unsplash.com/photo-1622396349586-7a548232cffe?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1549416878-b9ca95e1bb34?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506456034179-11f810012ebb?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1581452668500-11b3bc2e98fa?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534066922906-db289e6eb1ff?q=80&w=800&auto=format&fit=crop'
];

export default function GalleryPreview() {
    const { t } = useLanguage();

    return (
        <section className="py-8 sm:py-6 px-4 sm:px-6 bg-white border-t border-secondary/20 relative">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-ornamental text-graphite mb-6">
                        {t('gallery.title')}
                    </h2>
                    <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-8"></div>
                </div>

                {/* Masonry or Asymmetrical Grid Preview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
                    {/* Large Featured Image */}
                    <div className="col-span-2 md:col-span-2 row-span-2 aspect-square md:aspect-auto md:h-full relative rounded-2xl overflow-hidden group border border-secondary/20 shadow-sm">
                        <Image
                            src={placeholderImages[0]}
                            alt="Gallery preview"
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-graphite/10 group-hover:bg-graphite/20 transition-colors duration-300"></div>
                    </div>

                    {/* Standard Grid Images */}
                    {placeholderImages.slice(1).map((src, index) => (
                        <div key={index} className="col-span-1 aspect-square relative rounded-2xl overflow-hidden group border border-secondary/20 shadow-sm">
                            <Image
                                src={src}
                                alt={`Gallery preview ${index + 2}`}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-graphite/0 group-hover:bg-graphite/20 transition-colors duration-300"></div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link
                        href="/gallery"
                        className="inline-flex items-center justify-center gap-3 px-8 py-4 
                                   text-graphite font-bold tracking-wider uppercase text-sm rounded-full 
                                   border-2 border-primary hover:bg-primary-light transition-all
                                   group shadow-sm hover:shadow-md"
                    >
                        {t('gallery.viewAll')}
                        <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
