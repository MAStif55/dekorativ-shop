'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FAQPage() {
    const { locale } = useLanguage();

    const faqs = [
        {
            q: { en: 'Are the engravings durable?', ru: 'Насколько долговечна гравировка?' },
            a: { en: 'Yes, we use deep laser engraving which does not fade or erase over time.', ru: 'Да, мы используем глубокую лазерную гравировку, которая не стирается и не тускнеет со временем.' }
        },
        {
            q: { en: 'How do I care for my engraved item?', ru: 'Как ухаживать за изделием с гравировкой?' },
            a: { en: 'Simply wipe with a soft dry cloth. Avoid harsh chemicals or abrasive materials that might scratch the surface.', ru: 'Просто протирайте мягкой сухой тканью. Избегайте агрессивных химикатов и абразивных материалов, которые могут поцарапать поверхность.' }
        },
        {
            q: { en: 'Where are you located?', ru: 'Где вы находитесь?' },
            a: { en: 'Our engraving workshop is located in Omsk, Russia.', ru: 'Наша гравёрная мастерская находится в городе Омск, Россия.' }
        }
    ];

    return (
        <main className="min-h-screen bg-[#FAF9F6]">
            <Header />

            <div className="max-w-3xl mx-auto px-6 py-8">
                <h1 className="text-4xl font-ornamental text-[#2D1B1F] mb-2 text-center">
                    FAQ
                </h1>
                <div className="w-24 h-1 bg-[#C9A227] mx-auto rounded-full mb-6"></div>

                <div className="space-y-6">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-[#C9A227]/10 p-6">
                            <h3 className="text-lg font-bold text-[#8B4513] mb-2">{faq.q[locale]}</h3>
                            <p className="text-[#666] leading-relaxed">{faq.a[locale]}</p>
                        </div>
                    ))}
                </div>
            </div>

            <Footer />
        </main>
    );
}
