'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/types/category';
import { useLanguage } from '@/contexts/LanguageContext';

interface CategoryCardProps {
    category: Category;
    coverImageUrl?: string;
}

export default function CategoryCard({ category, coverImageUrl }: CategoryCardProps) {
    const { locale } = useLanguage();

    return (
        <div className="h-full">
            <Link
                href={`/catalog/${category.slug}`}
                className="group bg-white/80 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col h-full overflow-hidden relative backdrop-blur-sm"
            >
                {/* Subtle top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-light via-primary to-primary-light opacity-0 group-hover:opacity-100 transition-opacity z-20" />

                {/* Image Container */}
                <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden bg-slate-50 border-b border-slate-100">
                    {coverImageUrl ? (
                        <Image
                            src={coverImageUrl}
                            alt={category.title[locale]}
                            fill
                            className="object-cover transform transition-transform duration-700 group-hover:scale-105 z-0"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            draggable={false}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300">
                            <span className="text-6xl mb-2 filter drop-shadow-sm">{category.icon || '🏷️'}</span>
                        </div>
                    )}

                    {/* Gradient Overlay for better text readability if we want to place text on image in the future, 
                        or just a subtle dark gradient at the bottom of the image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 flex flex-col flex-1 bg-white relative z-10 text-center">
                    <div className="flex items-center justify-center mb-3">
                        <span className="text-2xl mr-2">{category.icon}</span>
                        <h3 className="text-xl sm:text-2xl font-medium text-slate-dark group-hover:text-primary transition-colors font-heading line-clamp-2">
                            {category.title[locale]}
                        </h3>
                    </div>

                    <p className="text-sm sm:text-base text-slate-light mb-4 flex-1 font-medium line-clamp-3">
                        {category.description?.[locale]}
                    </p>

                    <div className="mt-auto pt-4 border-t border-slate-100">
                        <span className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-slate-50 text-primary font-semibold text-sm group-hover:bg-primary group-hover:text-white transition-colors duration-300 w-full">
                            {locale === 'ru' ? 'Смотреть товары' : 'View Products'}
                        </span>
                    </div>
                </div>
            </Link>
        </div>
    );
}
