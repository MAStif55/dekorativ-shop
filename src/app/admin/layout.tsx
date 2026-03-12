'use client';

import { useAuth } from "@/contexts/AuthContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    LogOut,
    Settings,
    Users,
    Sliders,
    Image as ImageIcon,
    Type
} from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { t, locale } = useTranslation();

    useEffect(() => {
        const normalizedPath = pathname?.endsWith('/') ? pathname.slice(0, -1) : pathname;
        if (!loading && !user && normalizedPath !== '/admin/login') {
            router.push('/admin/login');
        }
    }, [user, loading, router, pathname]);

    // Normalize pathname by removing trailing slash for consistent comparison
    const normalizedPath = pathname?.endsWith('/') ? pathname.slice(0, -1) : pathname;

    const [showForceLogout, setShowForceLogout] = useState(false);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (loading) {
            timeout = setTimeout(() => setShowForceLogout(true), 5000);
        }
        return () => clearTimeout(timeout);
    }, [loading]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100 flex-col gap-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="text-gray-800 font-medium">{t('admin.loading')}</div>
                {showForceLogout && (
                    <div className="mt-4 flex flex-col items-center gap-2 animate-in fade-in duration-500">
                        <p className="text-sm text-gray-500">Taking too long?</p>
                        <button
                            onClick={() => window.location.href = '/admin/login'}
                            className="text-red-500 text-sm hover:underline font-medium"
                        >
                            Force Refresh / Logout
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (normalizedPath === '/admin/login') {
        return <>{children}</>;
    }

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100 flex-col gap-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-gray-800 font-semibold">Redirecting to login...</div>
                </div>
                <button
                    onClick={() => router.push('/admin/login')}
                    className="text-primary hover:underline text-sm font-medium"
                >
                    Click here if not redirected
                </button>
            </div>
        );
    }

    const navItems = [
        { href: '/admin', label: t('admin.dashboard'), icon: LayoutDashboard },
        { href: '/admin/products', label: t('admin.products'), icon: Package },
        { href: '/admin/subcategories', label: locale === 'ru' ? 'Подкатегории' : 'Subcategories', icon: Sliders },
        { href: '/admin/variations', label: locale === 'ru' ? 'Вариации' : 'Variations', icon: Sliders },
        { href: '/admin/portfolio', label: locale === 'ru' ? 'Портфолио' : 'Portfolio', icon: ImageIcon },
        { href: '/admin/fonts', label: locale === 'ru' ? 'Шрифты' : 'Fonts', icon: Type },
        { href: '/admin/orders', label: t('admin.orders'), icon: ShoppingCart },
        { href: '/admin/customers', label: t('admin.customers') || 'Customers', icon: Users },
        { href: '/admin/reviews', label: locale === 'ru' ? 'Отзывы' : 'Reviews', icon: Users },
        { href: '/admin/settings', label: t('admin.settings') || 'Settings', icon: Settings },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-sm border-r border-slate-100 flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <Image
                        src="/logo-geometric.png"
                        alt="Dekorativ Logo"
                        width={32}
                        height={32}
                        className="object-contain"
                    />
                    <h2 className="text-xl font-ornamental font-bold text-slate-dark leading-none">
                        {locale === 'ru' ? 'Декоратив' : 'Dekorativ'}
                    </h2>
                </div>
                <nav className="p-4 space-y-2 flex-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname?.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive
                                    ? 'bg-turquoise-light text-slate-800 shadow-sm border border-turquoise/30'
                                    : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800'
                                    }`}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t">
                    <button
                        onClick={() => logout()}
                        className="flex items-center space-x-3 px-4 py-3 w-full text-left text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
                    >
                        <LogOut size={20} />
                        <span>{t('admin.logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <LanguageProvider>
            <AuthProvider>
                <AdminLayoutContent>{children}</AdminLayoutContent>
            </AuthProvider>
        </LanguageProvider>
    );
}
