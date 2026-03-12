'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { Package, ShoppingCart, Users, TrendingUp, Settings, Sliders, Image as ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAllOrders } from '@/lib/firestore-utils';
import { Order } from '@/types/order';

export default function AdminDashboard() {
    const { user } = useAuth();
    const { t, locale } = useTranslation();
    const [ordersCount, setOrdersCount] = useState<string>('...');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const orders = await getAllOrders<Order>();
                setOrdersCount(orders.length.toString());
            } catch (error) {
                console.error("Error fetching stats:", error);
                setOrdersCount('0');
            }
        };

        fetchStats();
    }, []);

    const stats = [
        { label: locale === 'ru' ? 'Товары' : 'Products', value: '...', icon: Package, href: '/admin/products', color: 'text-turquoise-dark bg-turquoise/10 border-turquoise/20' },
        { label: locale === 'ru' ? 'Заказы' : 'Orders', value: ordersCount, icon: ShoppingCart, href: '/admin/orders', color: 'text-turquoise-dark bg-turquoise/10 border-turquoise/20' },
        { label: locale === 'ru' ? 'Вариации' : 'Variations', value: '', icon: Sliders, href: '/admin/variations', color: 'text-slate-dark bg-slate-100 border-slate-200' },
        { label: locale === 'ru' ? 'Настройки' : 'Settings', value: '', icon: Settings, href: '/admin/settings', color: 'text-slate-dark bg-slate-100 border-slate-200' },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-ornamental font-bold text-slate-dark">
                    {locale === 'ru' ? 'Панель управления' : 'Dashboard'}
                </h1>
                <p className="text-slate mt-2">
                    {locale === 'ru' ? 'Добро пожаловать,' : 'Welcome back,'} <span className="font-semibold">{user?.email}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Link key={index} href={stat.href} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-turquoise-light transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl border ${stat.color} transition-colors group-hover:bg-turquoise-light group-hover:border-turquoise`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className="text-2xl font-bold text-slate-dark">{stat.value}</span>
                            </div>
                            <h3 className="text-slate font-semibold group-hover:text-turquoise-dark transition-colors">{stat.label}</h3>
                        </Link>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Removed irrelevant Recent Activity block */}

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 col-span-1 lg:col-span-2">
                    <h2 className="text-xl font-bold text-slate-dark mb-4">
                        {locale === 'ru' ? 'Быстрые действия' : 'Quick Actions'}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <Link href="/admin/products/new" className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate font-medium hover:border-turquoise hover:text-turquoise-dark hover:bg-turquoise-light/30 transition-all">
                            <Package className="w-5 h-5" />
                            {locale === 'ru' ? 'Добавить товар' : 'Add New Product'}
                        </Link>
                        <Link href="/admin/gallery" className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate font-medium hover:border-turquoise hover:text-turquoise-dark hover:bg-turquoise-light/30 transition-all">
                            <ImageIcon className="w-5 h-5" />
                            {locale === 'ru' ? 'Загрузить в галерею' : 'Upload to Gallery'}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

