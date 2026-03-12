'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
    const { locale, t } = useLanguage();

    const navLinks = [
        { href: '/catalog', label: t('nav.catalog') },
        { href: '/about', label: t('nav.about') },
        { href: '/shipping', label: t('nav.shipping') },
        { href: '/offer', label: t('nav.offer') },
    ];

    return (
        <footer className="border-t border-slate-200/50 py-8 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-sacred-pattern opacity-10"></div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 mb-8 sm:mb-5">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-4 group">
                        <Image
                            src="/logo-geometric.png"
                            alt="Dekorativ Logo"
                            width={64}
                            height={64}
                            className="transform group-hover:scale-110 transition-transform"
                        />
                        <div className="flex flex-col justify-center">
                            <h2 className="text-2xl font-ornamental text-graphite group-hover:text-primary-dark transition-all leading-none mb-1">
                                {locale === 'ru' ? 'Декоратив' : 'Dekorativ'}
                            </h2>
                            <p className="text-xs text-secondary group-hover:text-primary-dark uppercase tracking-[0.2em] leading-none">
                                {locale === 'ru' ? 'Гравёрная мастерская' : 'Engraving Workshop'}
                            </p>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex flex-wrap justify-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-graphite/60 hover:text-primary-dark transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Footer Contact Block */}
                <div className="flex flex-col items-center text-center gap-3 mt-6 mb-8 text-graphite/80 text-sm sm:text-base max-w-3xl mx-auto">
                    <h3 className="font-bold text-xl text-graphite mb-2">{locale === 'ru' ? 'Контакты' : 'Contacts'}</h3>
                    <p><span className="font-bold text-graphite mr-2">{locale === 'ru' ? 'Телефон:' : 'Phone:'}</span> <a href="tel:+79236800515" className="text-primary-dark font-medium hover:underline">+7(923)-680-05-15</a></p>
                    <p><span className="font-bold text-graphite mr-2">{locale === 'ru' ? 'Адрес:' : 'Address:'}</span> {locale === 'ru' ? 'г. Омск, ул. Красный путь 63, ТЦ Сибирские Огни, цокольный этаж, офис 10' : 'Omsk, Krasny Put 63, Sibirskie Ogni, Ground Floor, Office 10'}</p>
                    <p><span className="font-bold text-graphite mr-2">{locale === 'ru' ? 'Режим работы:' : 'Hours:'}</span> {locale === 'ru' ? 'Понедельник-суббота с 10:00 до 19:00. Воскресенье - выходной.' : 'Mon-Sat 10:00 to 19:00. Sunday - closed.'}</p>
                    <p><span className="font-bold text-graphite mr-2">E-mail:</span> <a href="mailto:aurifex55@yandex.ru" className="text-primary-dark font-medium hover:underline">aurifex55@yandex.ru</a></p>
                </div>

                {/* Divider */}
                <div className="divider-ornamental my-8 opacity-40">
                    <span className="text-secondary/50">☸</span>
                </div>

                {/* Copyright */}
                <div className="text-center text-sm text-graphite/60 flex flex-col items-center gap-2">
                    <p>{locale === 'ru' ? 'ИП Михалев В.В. ИНН 550147646705 ОГРНИП 316554300156911' : 'IP Mikhalev V.V. INN 550147646705 OGRNIP 316554300156911'}</p>
                    <p>© {new Date().getFullYear()} {locale === 'ru' ? 'Декоратив' : 'Dekorativ'}. | {locale === 'ru' ? 'Все права защищены.' : 'All rights reserved.'}</p>
                </div>
            </div>
        </footer>
    );
}
