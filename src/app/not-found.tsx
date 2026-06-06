'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFound() {
    const { locale } = useLanguage();

    return (
        <main className="min-h-screen bg-ivory flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C5A059] opacity-[0.03] rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
                <div className="text-[150px] font-ornamental text-slate-200/60 leading-none select-none">
                    404
                </div>
                <div className="text-4xl mb-8 text-[#C5A059] flex justify-center">
                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <h1 className="text-4xl md:text-5xl font-ornamental text-slate-dark mb-6">
                    {locale === 'ru' ? 'Страница не найдена' : 'Page Not Found'}
                </h1>

                <p className="text-xl text-slate mb-8 max-w-lg mx-auto leading-relaxed">
                    {locale === 'ru'
                        ? 'Страница, которую вы ищете, не существует или была перемещена.'
                        : 'The page you are looking for does not exist or has been moved.'}
                </p>

                <Link
                    href="/"
                    className="bg-[#C5A059] text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md inline-block hover:scale-105 hover:bg-[#A08044]"
                >
                    {locale === 'ru' ? 'Вернуться на Главную' : 'Return to Home'}
                </Link>
            </div>
        </main>
    );
}
