'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Tag } from 'lucide-react';

export default function WholesaleBanner() {
    const { t } = useLanguage();

    return (
        <section className="bg-secondary/10 border-y border-secondary/20 py-4 sm:py-6 relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-sacred-pattern opacity-10 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
                    <div className="p-2 bg-white rounded-full border border-secondary/30 text-primary-dark shadow-sm">
                        <Tag className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <p className="text-graphite font-bold text-sm sm:text-base md:text-lg tracking-wide uppercase">
                        {t('wholesale.banner')}
                    </p>
                </div>
            </div>
        </section>
    );
}
