'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Product } from '@/types/product';
import { Info, Ruler, Sparkles, HeartHandshake } from 'lucide-react';

interface ProductTabsProps {
    product: Product;
}

export default function ProductTabs({ product }: ProductTabsProps) {
    const { locale } = useLanguage();
    const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'care' | 'meaning'>('desc');

    const tabs = [
        { id: 'desc', label: { en: 'Description', ru: 'Описание' }, icon: <Info size={18} /> },
        { id: 'specs', label: { en: 'Specifications', ru: 'Характеристики' }, icon: <Ruler size={18} /> },
        { id: 'meaning', label: { en: 'Meaning', ru: 'Значение' }, icon: <Sparkles size={18} /> },
        { id: 'care', label: { en: 'Care', ru: 'Уход' }, icon: <HeartHandshake size={18} /> },
    ] as const;

    return (
        <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-[#E8D48B]/20">
            {/* Tabs Header */}
            <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${activeTab === tab.id
                            ? 'bg-[#2D1B1F] text-[#E8D48B] shadow-md'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-[#8B4513]'
                            }`}
                    >
                        {tab.icon}
                        {tab.label[locale]}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px] text-[#666] leading-relaxed animate-fade-in">
                {activeTab === 'desc' && (
                    <div className="prose prose-stone max-w-none">
                        <p className="whitespace-pre-wrap">{product.description[locale]}</p>
                    </div>
                )}

                {activeTab === 'specs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-900">{locale === 'ru' ? 'Категория' : 'Category'}</span>
                            <span className="capitalize">{product.category}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-900">{locale === 'ru' ? 'Базовая цена' : 'Base Price'}</span>
                            <span>{product.basePrice} THB</span>
                        </div>
                        {/* Placeholder for future specific attributes */}
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-900">{locale === 'ru' ? 'Метод нанесения' : 'Engraving Method'}</span>
                            <span>{locale === 'ru' ? 'Глубокая лазерная гравировка' : 'Deep Laser Engraving'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-900">{locale === 'ru' ? 'Срок изготовления' : 'Production Time'}</span>
                            <span>{locale === 'ru' ? '1-3 дня' : '1-3 Days'}</span>
                        </div>
                    </div>
                )}

                {activeTab === 'meaning' && (
                    <div className="space-y-4">
                        <p>
                            {locale === 'ru'
                                ? 'Каждое изделие создается нашими мастерами с особым вниманием к деталям. Глубокая и точная гравировка гарантирует долговечность и премиальный вид, превращая обычный предмет в уникальный личный аксессуар.'
                                : 'Each piece is created by our artisans with special attention to detail. Deep and precise engraving guarantees durability and a premium look, turning an ordinary item into a unique personal accessory.'}
                        </p>
                        <div className="p-4 bg-[#F5ECD7]/30 rounded-xl border border-[#C9A227]/20 italic text-[#8B4513]">
                            {locale === 'ru'
                                ? '"Искусство в каждом изгибе, качество на всю жизнь."'
                                : '"Art in every curve, quality for a lifetime."'}
                        </div>
                    </div>
                )}

                {activeTab === 'care' && (
                    <ul className="list-disc pl-5 space-y-2">
                        <li>{locale === 'ru' ? 'Протирайте мягкой чистой тканью.' : 'Wipe with a soft clean cloth.'}</li>
                        <li>{locale === 'ru' ? 'Избегайте сильных механических повреждений и царапин.' : 'Avoid severe mechanical damage and scratches.'}</li>
                        <li>{locale === 'ru' ? 'Избегайте контакта с агрессивными химикатами.' : 'Avoid contact with harsh chemicals.'}</li>
                    </ul>
                )}
            </div>
        </div>
    );
}
