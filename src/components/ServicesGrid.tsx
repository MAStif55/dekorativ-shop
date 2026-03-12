'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const services = [
    { id: 'keyboard', image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop', key: 'keyboard' },
    { id: 'metal', image: 'https://images.unsplash.com/photo-1601366533287-5ee4c763ae4e?q=80&w=800&auto=format&fit=crop', key: 'metal' },
    { id: 'glass', image: 'https://images.unsplash.com/photo-1544427920-c49ccfc8c57f?q=80&w=800&auto=format&fit=crop', key: 'glass' },
    { id: 'wood', image: 'https://images.unsplash.com/photo-1611078810232-a58fbbdb2a66?q=80&w=800&auto=format&fit=crop', key: 'wood' },
    { id: 'gifts', image: 'https://images.unsplash.com/photo-1619420674846-5fd71effe8db?q=80&w=800&auto=format&fit=crop', key: 'gifts' },
    { id: 'stamps', image: 'https://images.unsplash.com/photo-1599577905953-29aefea4dfce?q=80&w=800&auto=format&fit=crop', key: 'stamps' }
];

export default function ServicesGrid() {
    const { t } = useLanguage();

    return (
        <section className="py-8 sm:py-6 px-4 sm:px-6 bg-canvas relative">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-ornamental text-graphite mb-6">
                        {t('services.title')}
                    </h2>
                    <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {services.map((service) => (
                        <div key={service.id} className="group relative aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border border-secondary/20 shadow-sm hover:shadow-xl transition-all duration-500">
                            {/* Image */}
                            <Image
                                src={service.image}
                                alt={t(`services.${service.key}`)}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-graphite/90 via-graphite/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>

                            {/* Content Block */}
                            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                                <h3 className="text-white font-elegant text-2xl sm:text-3xl mb-3 drop-shadow-md">
                                    {t(`services.${service.key}`)}
                                </h3>

                                {/* Reveal Button */}
                                <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                    <span className="font-semibold tracking-wider uppercase text-xs">
                                        {t('services.more')}
                                    </span>
                                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-2 transition-transform duration-300" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
