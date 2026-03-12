import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DynamicPortfolio from '@/components/DynamicPortfolio';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Галерея работ | Dekorativ',
    description: 'Галерея работ мастерской Dekorativ. Примеры лазерной и механической гравировки на металле, стекле и дереве.',
};

export default function GalleryPage() {
    return (
        <main className="min-h-screen bg-canvas flex flex-col">
            <Header variant="solid" />

            {/* Page Header */}
            <section className="pt-12 pb-8 px-4 sm:px-6 relative overflow-hidden bg-canvas">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-turquoise-light/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/40 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-ornamental text-slate-dark mb-6">
                        Галерея работ
                    </h1>
                    <p className="text-slate/80 text-lg sm:text-lg max-w-2xl mx-auto font-light leading-relaxed">
                        Познакомьтесь с примерами наших работ. Каждое изделие — это результат кропотливого труда,
                        сочетающий современные технологии гравировки и ручную обработку.
                    </p>
                </div>
            </section>

            {/* Dynamic Gallery Component */}
            <div className="flex-grow relative z-20">
                <DynamicPortfolio pageId="gallery" subtitle={{ ru: '', en: '' }} title={{ ru: '', en: '' }} />
            </div>

            <Footer />
        </main>
    );
}
