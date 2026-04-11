'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Send, MessageCircle, Info } from 'lucide-react';
import { API } from '@/lib/config';

export default function AboutPage() {
    const { locale } = useLanguage();
    const [formData, setFormData] = useState({
        phone: '',
        telegram: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(false);
        try {
            const res = await fetch(API.SUBMIT_FEEDBACK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: formData.phone,
                    telegram: formData.telegram || null,
                    message: formData.message,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSubmitted(true);
                setFormData({ phone: '', telegram: '', message: '' });
            } else {
                setSubmitError(true);
            }
        } catch {
            setSubmitError(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-canvas flex flex-col">
            <Header />

            {/* Hero Section */}
            <section className="pt-12 pb-8 px-4 sm:px-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-turquoise-light/20 rounded-[100%] blur-3xl pointer-events-none"></div>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-100 text-slate text-sm font-semibold mb-6 shadow-sm">
                    <Info className="w-4 h-4 text-turquoise" />
                    {locale === 'ru' ? 'О Компании' : 'About Us'}
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-ornamental text-slate-dark mb-6 relative z-10">
                    {locale === 'ru' ? 'Мастерская Dekorativ' : 'Dekorativ Workshop'}
                </h1>

                <p className="text-lg text-slate max-w-2xl mx-auto font-light leading-relaxed relative z-10">
                    {locale === 'ru'
                        ? 'Мы воплощаем ваши идеи в материале, создавая уникальные гравировки на стекле, металле и дереве. Каждое изделие — это сочетание точности технологий и ручного труда.'
                        : 'We bring your ideas to life in material, creating unique engravings on glass, metal, and wood. Each piece is a combination of precision technology and handcraft.'}
                </p>
            </section>

            {/* Values Grid */}
            <section className="py-6 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                        {[
                            { icon: '✨', titleEn: 'Aesthetics', titleRu: 'Эстетика', descEn: 'Beautiful minimalist designs for your home or business.', descRu: 'Красивый минималистичный дизайн для дома или бизнеса.' },
                            { icon: '🎯', titleEn: 'Precision', titleRu: 'Точность', descEn: 'High-quality engraving ensuring every detail is perfect.', descRu: 'Высококачественная гравировка, где продумана каждая деталь.' },
                            { icon: '🤝', titleEn: 'Care', titleRu: 'Забота', descEn: 'Personal approach and attentive customer service.', descRu: 'Индивидуальный подход и внимательное обслуживание.' }
                        ].map((value, i) => (
                            <div key={i} className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                                <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform">{value.icon}</div>
                                <h4 className="text-xl font-bold text-slate-dark mb-3">{locale === 'ru' ? value.titleRu : value.titleEn}</h4>
                                <p className="text-slate/80 text-sm leading-relaxed">{locale === 'ru' ? value.descRu : value.descEn}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-5 px-4 sm:px-6 relative flex-1">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl sm:text-4xl font-ornamental text-slate-dark mb-4">
                            {locale === 'ru' ? 'Связаться с Нами' : 'Get in Touch'}
                        </h2>
                        <p className="text-slate text-lg">
                            {locale === 'ru' ? 'Выберите удобный способ связи или оставьте заявку.' : 'Choose a convenient way to connect or leave a request.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
                        {/* Messenger Links */}
                        <div className="flex flex-col gap-6">
                            <a
                                href="https://t.me/Trubitsina_Elena_Astrolog"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-6 p-6 rounded-3xl bg-white border border-slate-100 hover:border-turquoise hover:shadow-md transition-all group"
                            >
                                <div className="w-16 h-16 bg-[#229ED9]/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#229ED9]/20 transition-colors">
                                    <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#229ED9]" fill="currentColor">
                                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-dark text-xl group-hover:text-turquoise-dark transition-colors mb-1">Telegram</h4>
                                    <p className="text-slate text-sm">{locale === 'ru' ? 'Быстрые ответы в мессенджере' : 'Quick replies in messenger'}</p>
                                </div>
                            </a>

                            <a
                                href="https://max.ru/u/f9LHodD0cOIistNNtQFWq4OLPx_ZPYrqvTyLMwLrRY0P9hHA7Zd06uRLwCg"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-6 p-6 rounded-3xl bg-white border border-slate-100 hover:border-turquoise hover:shadow-md transition-all group"
                            >
                                <div className="w-16 h-16 bg-[#FF6600]/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#FF6600]/20 transition-colors">
                                    <MessageCircle className="w-8 h-8 text-[#FF6600]" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-dark text-xl group-hover:text-turquoise-dark transition-colors mb-1">Max</h4>
                                    <p className="text-slate text-sm">{locale === 'ru' ? 'Написать нам в Max' : 'Message us on Max'}</p>
                                </div>
                            </a>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative">
                            {/* Decorative element */}
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-turquoise-light/40 rounded-full blur-2xl pointer-events-none"></div>

                            {submitted ? (
                                <div className="py-6 text-center">
                                    <div className="w-20 h-20 bg-turquoise-light text-turquoise-dark rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                                        ✓
                                    </div>
                                    <h4 className="text-2xl font-bold text-slate-dark mb-4">
                                        {locale === 'ru' ? 'Спасибо за заявку!' : 'Thank you!'}
                                    </h4>
                                    <p className="text-slate mb-8">{locale === 'ru' ? 'Мы свяжемся с вами в течение рабочего дня.' : 'We will contact you shortly.'}</p>
                                    <button onClick={() => setSubmitted(false)} className="text-turquoise font-semibold hover:text-turquoise-dark transition-colors">
                                        {locale === 'ru' ? 'Отправить ещё одно сообщение' : 'Send another message'}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-dark mb-2">{locale === 'ru' ? 'Телефон' : 'Phone'} *</label>
                                        <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-5 py-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-dark focus:outline-none focus:ring-2 focus:ring-turquoise focus:bg-white transition-all"
                                            placeholder={locale === 'ru' ? '+7 (___) ___-__-__' : '+1 (___) ___-____'} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-dark mb-2">Telegram {locale === 'ru' ? '(необязательно)' : '(optional)'}</label>
                                        <input type="text" value={formData.telegram} onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                                            className="w-full px-5 py-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-dark focus:outline-none focus:ring-2 focus:ring-turquoise focus:bg-white transition-all"
                                            placeholder="@username" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-dark mb-2">{locale === 'ru' ? 'Сообщение' : 'Message'} *</label>
                                        <textarea required rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full px-5 py-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-dark focus:outline-none focus:ring-2 focus:ring-turquoise focus:bg-white transition-all resize-none"
                                            placeholder={locale === 'ru' ? 'Опишите вашу идею...' : 'Describe your idea...'} />
                                    </div>
                                    {submitError && (
                                        <div className="text-red-500 text-sm bg-red-50 px-5 py-4 rounded-xl border border-red-200">
                                            {locale === 'ru' ? 'Ошибка отправки. Пожалуйста, попробуйте позже.' : 'Failed to send. Please try again later.'}
                                        </div>
                                    )}
                                    <button type="submit" disabled={isSubmitting} className="w-full btn-primary py-4 rounded-xl text-lg flex items-center justify-center gap-2 group">
                                        {isSubmitting ? (locale === 'ru' ? 'Отправка...' : 'Sending...') : (locale === 'ru' ? 'Отправить' : 'Send Message')}
                                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
