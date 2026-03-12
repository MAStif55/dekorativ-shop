'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { PortfolioCategory } from '@/types/portfolio';
import { getPortfolioCategories, deletePortfolioCategory, deletePortfolioPhoto, getPortfolioPhotosByCategory } from '@/lib/firestore-utils';
import Link from 'next/link';

export default function AdminPortfolioPage() {
    const { locale } = useTranslation();
    const [categories, setCategories] = useState<PortfolioCategory[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await getPortfolioCategories();
            setCategories(data);
        } catch (error) {
            console.error('Failed to load classes', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = async (category: PortfolioCategory) => {
        if (!window.confirm(locale === 'ru' ? 'Удалить категорию и все ее фотографии?' : 'Delete category and all its photos?')) return;

        try {
            // Very basic relational cleanup. Ideally handled in a Cloud Function for robustness.
            const photos = await getPortfolioPhotosByCategory(category.id);
            for (const p of photos) {
                await deletePortfolioPhoto(p.id);
                // Note: Firebase Storage deletion omitted for brevity in POC, 
                // but should be done here or in Cloud Functions
            }
            await deletePortfolioCategory(category.id);
            fetchCategories();
        } catch (error) {
            console.error('Delete failed', error);
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    {locale === 'ru' ? 'Управление Портфолио' : 'Portfolio Management'}
                </h1>
                <Link
                    href="/admin/portfolio/new"
                    className="flex items-center gap-2 bg-primary text-slate-900 px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors font-semibold shadow-sm"
                >
                    <Plus size={20} />
                    <span>{locale === 'ru' ? 'Добавить категорию' : 'Add Category'}</span>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center my-6">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center text-gray-500 py-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    {locale === 'ru' ? 'Категорий не найдено.' : 'No categories found.'}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((cat) => (
                        <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden group">

                            {/* Status Indicator */}
                            <div className={`absolute top-0 left-0 w-2 h-full ${cat.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>

                            <div className="flex justify-between items-start mb-4 ml-2">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{cat.name[locale as 'ru' | 'en'] || cat.name.ru}</h3>
                                    <p className="text-xs text-gray-500 font-mono mt-1">{cat.slug}</p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link href={`/admin/portfolio/edit?id=${cat.id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md">
                                        <Edit size={16} />
                                    </Link>
                                    <button onClick={() => handleDelete(cat)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-auto ml-2 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    <span className="font-semibold">{locale === 'ru' ? 'Страница:' : 'Page:'}</span>
                                    <span className={!cat.targetPageId ? 'italic text-gray-400' : 'text-primary'}>
                                        {cat.targetPageId || (locale === 'ru' ? 'Не привязана' : 'Unassigned')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-500 px-1 mt-2">
                                    <span>{locale === 'ru' ? 'Порядок:' : 'Order:'} {cat.order}</span>
                                    <Link href={`/admin/portfolio/edit?id=${cat.id}`} className="text-primary hover:underline flex items-center gap-1 font-medium">
                                        <ImageIcon size={14} />
                                        {locale === 'ru' ? 'Управление' : 'Manage'}
                                    </Link>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
