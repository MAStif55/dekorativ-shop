'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Hammer, Calendar, Package } from 'lucide-react';

export default function TrustSignals() {
    const { locale } = useLanguage();

    const signals = [
        {
            icon: <Hammer className="w-8 h-8 text-primary-dark" />,
            title: { en: 'Premium Metals', ru: 'Премиальные металлы' },
            desc: { en: 'High-quality brass, copper, and steel', ru: 'Высококачественная латунь, медь и сталь' }
        },
        {
            icon: <Calendar className="w-8 h-8 text-primary-dark" />,
            title: { en: 'Custom Engraving', ru: 'Индивидуальная гравировка' },
            desc: { en: 'Personalized designs for any occasion', ru: 'Персонализированный дизайн для любого повода' }
        },
        {
            icon: <Package className="w-8 h-8 text-primary-dark" />,
            title: { en: 'Handcrafted Quality', ru: 'Ручная работа' },
            desc: { en: 'Meticulous attention to every detail', ru: 'Тщательное внимание к каждой детали' }
        }
    ];

    return (
        <section className="bg-canvas/50 border-b border-secondary/20 relative z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    {signals.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 group text-center sm:text-left md:justify-start">
                            <div className="p-3 bg-white rounded-full border border-secondary/40 group-hover:border-primary-dark transition-colors shadow-sm shrink-0">
                                {item.icon}
                            </div>
                            <div>
                                <h3 className="text-graphite font-bold text-sm uppercase tracking-wider mb-1">
                                    {item.title[locale]}
                                </h3>
                                <p className="text-xs text-graphite/70">
                                    {item.desc[locale]}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
