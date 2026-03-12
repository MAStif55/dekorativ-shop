'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutSnippet() {
    const { locale } = useLanguage();

    return (
        <section className="py-8 sm:py-6 px-4 sm:px-6 bg-canvas relative overflow-hidden">
            {/* Gradient Overlay to fade into footer */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-canvas to-transparent z-10 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    {/* Text Content */}
                    <div className="text-center lg:text-left">
                        <span className="text-secondary font-bold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4 block">
                            {locale === 'ru' ? 'НАШ ПОДХОД' : 'Our Approach'}
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-ornamental text-graphite mb-6 sm:mb-8 leading-tight">
                            {locale === 'ru'
                                ? 'Искусство гравировки в безупречном исполнении'
                                : 'The Art of Engraving in Flawless Execution'}
                        </h2>
                        <div className="space-y-4 sm:space-y-6 text-graphite/80 text-base sm:text-lg leading-relaxed font-light">
                            <p>
                                {locale === 'ru'
                                    ? 'Dekorativ — это мастерская, где обычный металл обретает смысл и индивидуальность. Мы создаем уникальные предметы декора и подарки с помощью высокоточной лазерной и механической гравировки.'
                                    : 'Dekorativ is a workshop where ordinary metal takes on meaning and individuality. We create unique decor items and gifts using high-precision laser and mechanical engraving.'}
                            </p>
                            <p>
                                {locale === 'ru'
                                    ? 'Для нас важна каждая деталь. Мы тщательно отбираем материалы и контролируем каждый этап производства, чтобы готовое изделие служило долгие годы и хранило память о важных моментах вашей жизни.'
                                    : 'Every detail matters to us. We carefully select materials and monitor every stage of production so that the finished product serves for many years and preserves the memory of important moments in your life.'}
                            </p>
                        </div>


                    </div>

                    {/* Visual Placeholder */}
                    <div className="relative">
                        <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-secondary/20 relative shadow-sm">
                            {/* Abstract Gradient Art representing 'Dekorativ' vibe */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white via-canvas to-[#e0e8e6]"></div>

                            {/* Mandala/Engraving overlay - Light aesthetic */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-60">
                                {/* Rotating Outer Ring */}
                                <svg className="w-[140%] h-[140%] animate-spin-slow-reverse opacity-40 absolute" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.3" style={{ color: "var(--color-primary-dark)" }}>
                                    <circle cx="100" cy="100" r="95" strokeDasharray="4 4" />
                                    <circle cx="100" cy="100" r="85" />
                                    {/* Petal-like curves */}
                                    <path d="M100 5 Q130 5 130 35 T160 65 T190 95" strokeOpacity="0.5" />
                                    <path d="M100 195 Q70 195 70 165 T40 135 T10 105" strokeOpacity="0.5" />
                                </svg>

                                {/* Main Geometric Structure */}
                                <svg className="w-[85%] h-[85%] animate-spin-slow" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: "var(--color-secondary)" }}>
                                    {/* Concentric Circles */}
                                    <circle cx="100" cy="100" r="98" strokeOpacity="0.4" />
                                    <circle cx="100" cy="100" r="70" strokeOpacity="0.6" />

                                    {/* Intersecting Squares */}
                                    <rect x="55" y="55" width="90" height="90" transform="rotate(45 100 100)" strokeOpacity="0.8" />
                                    <rect x="55" y="55" width="90" height="90" transform="rotate(0 100 100)" strokeOpacity="0.8" />

                                    {/* Central focal point */}
                                    <circle cx="100" cy="100" r="8" fill="var(--color-primary-dark)" fillOpacity="0.2" />
                                    <circle cx="100" cy="100" r="3" fill="var(--color-primary-dark)" />
                                </svg>
                            </div>

                            <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/80 backdrop-blur-md border border-secondary/30 rounded-xl shadow-sm text-center">
                                <p className="font-elegant text-graphite text-lg sm:text-xl">
                                    {locale === 'ru' ? 'Точность и Красота' : 'Precision & Beauty'}
                                </p>
                            </div>
                        </div>

                        {/* Decorative background circle */}
                        <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-secondary/20 rounded-full"></div>
                    </div>
                </div>
            </div>
        </section >
    );
}
