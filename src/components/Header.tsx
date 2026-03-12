'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCartStore } from '@/store/cart-store';
import { useCartUIStore } from '@/store/cart-ui-store';
import { Menu, X, ShoppingBag, Home, Grid3X3, Type, Info, ChevronDown, Keyboard } from 'lucide-react';
import { CATEGORIES } from '@/types/category';

interface HeaderProps {
    variant?: 'transparent' | 'solid';
}

export default function Header({ variant = 'solid' }: HeaderProps) {
    const { locale, setLocale, t } = useLanguage();
    const pathname = usePathname();
    const { getTotalItems } = useCartStore();
    const { openDrawer } = useCartUIStore();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [catalogOpen, setCatalogOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const totalItems = mounted ? getTotalItems() : 0;

    useEffect(() => {
        setMobileMenuOpen(false);
        setCatalogOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    const isActive = (path: string) => {
        if (path === '/catalog') return pathname.startsWith('/catalog');
        return pathname === path;
    };

    const currentLocale = (locale || 'ru') as 'en' | 'ru';
    const catalogCategories = CATEGORIES.map(cat => ({
        href: `/catalog/${cat.slug}`,
        label: cat.title[currentLocale],
    }));

    const navLinks = [
        { href: '/', label: t('nav.home'), icon: Home },
        { href: '/gallery', label: locale === 'ru' ? 'Галерея' : 'Gallery', icon: Grid3X3 },
        { href: '/keyboard-engraving', label: locale === 'ru' ? 'Гравировка клавиатур' : 'Keyboard Engraving', icon: Keyboard },
        { href: '/fonts', label: locale === 'ru' ? 'Выбор шрифта' : 'Fonts', icon: Type },
        { href: '/about', label: locale === 'ru' ? 'О нас / Контакты' : 'About / Contact', icon: Info },
    ];

    const baseClasses = variant === 'transparent'
        ? 'relative z-50'
        : 'relative w-full z-50';

    return (
        <div className={baseClasses}>
            {/* Global Top Contact Bar (Now inside the sticky wrapper) */}
            <div className="w-full py-2 px-4 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-[13px] sm:text-sm relative">
                <div>
                    <span className="font-bold text-slate-900 mr-1">{locale === 'ru' ? 'Телефон:' : 'Phone:'}</span>
                    <a href="tel:+79236800515" className="text-[#F43F5E] font-medium hover:underline">+7(923)-680-05-15</a>
                </div>
                <div className="text-slate-800 text-center">
                    <span className="font-bold text-slate-900 mr-1">{locale === 'ru' ? 'Адрес:' : 'Address:'}</span>
                    <span>{locale === 'ru' ? 'г. Омск, ул. Красный путь 63, ТЦ Сибирские Огни, офис 10' : 'Omsk, Krasny Put 63, Sibirskie Ogni, Office 10'}</span>
                </div>
                <div>
                    <span className="font-bold text-slate-900 mr-1">E-mail:</span>
                    <a href="mailto:aurifex55@yandex.ru" className="text-[#F43F5E] font-medium hover:underline">aurifex55@yandex.ru</a>
                </div>
            </div>

            <header className={variant === 'transparent' ? 'py-6' : 'py-4'}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <Image
                            src="/logo-geometric.png"
                            alt="Dekorativ Logo"
                            width={56}
                            height={56}
                            className="object-contain group-hover:scale-105 transition-transform"
                            priority
                        />
                        <div className="flex flex-col justify-center">
                            <h1 className="text-2xl font-ornamental text-slate-dark tracking-wide group-hover:text-turquoise-dark transition-colors leading-none mb-1">
                                {locale === 'ru' ? 'Декоратив' : 'Dekorativ'}
                            </h1>
                            <p className="hidden sm:block text-[10px] text-slate uppercase tracking-widest font-semibold leading-none">
                                {locale === 'ru' ? 'Гравёрная мастерская' : 'Engraving Workshop'}
                            </p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {/* Dropdown Catalog */}
                        <div
                            className="relative"
                            onMouseEnter={() => setCatalogOpen(true)}
                            onMouseLeave={() => setCatalogOpen(false)}
                        >
                            <button className={`flex items-center gap-1 font-semibold transition-colors py-2 ${isActive('/catalog') ? 'text-turquoise-dark' : 'text-slate hover:text-turquoise-dark'}`}>
                                {t('nav.catalog')}
                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${catalogOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            <div className={`absolute top-full -left-4 w-56 pt-2 transition-all duration-200 ${catalogOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                                <div className="bg-white rounded-xl shadow-lg border border-slate-100 py-2 overflow-hidden">
                                    {catalogCategories.map((cat, idx) => (
                                        <Link
                                            key={idx}
                                            href={cat.href}
                                            className="block px-4 py-2.5 text-sm text-slate hover:bg-turquoise-light hover:text-turquoise-dark font-medium transition-colors"
                                        >
                                            {cat.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Standard Links */}
                        {navLinks.filter(l => l.href !== '/').map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`font-semibold transition-colors py-2 ${isActive(link.href) ? 'text-turquoise-dark' : 'text-slate hover:text-turquoise-dark'}`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        <div className="w-px h-6 bg-slate-200 mx-2"></div>

                        {/* Cart */}
                        <button onClick={openDrawer} className="flex items-center gap-2 font-semibold text-slate hover:text-turquoise-dark transition-colors">
                            <div className="relative">
                                <ShoppingBag className="w-5 h-5" />
                                {totalItems > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-turquoise-dark text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full pointer-events-none">
                                        {totalItems}
                                    </span>
                                )}
                            </div>
                            <span>{t('nav.cart')}</span>
                        </button>

                        {/* Language */}
                        <button
                            onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}
                            className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-xs font-bold text-slate hover:border-turquoise hover:text-turquoise transition-colors"
                        >
                            {locale === 'ru' ? 'EN' : 'RU'}
                        </button>
                    </nav>

                    {/* Mobile Menu Controls */}
                    <div className="md:hidden flex items-center gap-4">
                        <button onClick={openDrawer} className="text-slate hover:text-turquoise-dark relative p-1">
                            <ShoppingBag className="w-6 h-6" />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-turquoise-dark text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                    {totalItems}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-1 text-slate hover:text-turquoise-dark"
                        >
                            {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 bg-slate-dark/20 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setMobileMenuOpen(false)}
            />

            {/* Mobile Menu Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-[280px] bg-ivory border-l border-slate-200 z-50 md:hidden transform transition-transform duration-300 ease-out flex flex-col ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="p-4 flex items-center justify-between border-b border-slate-200">
                    <span className="font-ornamental text-xl text-slate-dark font-bold">Dekorativ</span>
                    <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate hover:text-turquoise-dark bg-white rounded-full shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {/* Catalog Accordion for Mobile */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-2">
                        <button
                            onClick={() => setCatalogOpen(!catalogOpen)}
                            className="w-full flex items-center justify-between p-4 text-slate font-semibold hover:bg-turquoise-light hover:text-turquoise-dark transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Grid3X3 className="w-5 h-5 text-turquoise" />
                                {t('nav.catalog')}
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform ${catalogOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <div className={`bg-slate-50 transition-all overflow-hidden ${catalogOpen ? 'max-h-64 border-t border-slate-100' : 'max-h-0'}`}>
                            {catalogCategories.map((cat, idx) => (
                                <Link
                                    key={idx}
                                    href={cat.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-6 py-3 text-sm font-medium text-slate hover:text-turquoise-dark"
                                >
                                    {cat.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {[...navLinks].map((link) => {
                        const IconComponent = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 p-4 rounded-xl border font-semibold transition-all ${isActive(link.href) ? 'bg-turquoise-light border-turquoise-light text-turquoise-dark' : 'bg-white border-slate-100 text-slate hover:border-turquoise hover:text-turquoise-dark shadow-sm'}`}
                            >
                                <IconComponent className={`w-5 h-5 ${isActive(link.href) ? 'text-turquoise-dark' : 'text-turquoise'}`} />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-200 bg-white">
                    <button
                        onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}
                        className="w-full py-3 rounded-xl border-2 border-slate-100 text-slate font-bold hover:border-turquoise hover:text-turquoise-dark transition-colors flex items-center justify-center gap-2"
                    >
                        <span>{locale === 'ru' ? '🇬🇧 English' : '🇷🇺 Русский'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
