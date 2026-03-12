'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/LanguageContext';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { PortfolioCategory } from '@/types/portfolio';
import { createPortfolioCategory } from '@/lib/firestore-utils';

export default function NewPortfolioCategoryPage() {
    const { locale } = useTranslation();
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState<Omit<PortfolioCategory, 'id' | 'createdAt'>>({
        name: { en: '', ru: '' },
        slug: '',
        targetPageId: '',
        isActive: true,
        order: 0
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Convert empty string to null for unassigned
            const payload = {
                ...formData,
                targetPageId: formData.targetPageId === '' ? null : formData.targetPageId
            };
            const newId = await createPortfolioCategory(payload);
            router.push(`/admin/portfolio/edit?id=${newId}`); // Redirect to edit/manage photos page
        } catch (error) {
            console.error('Error saving:', error);
            alert(locale === 'ru' ? 'Ошибка сохранения' : 'Error saving');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/portfolio" className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-dark">
                    {locale === 'ru' ? 'Создать категорию портфолио' : 'Create Portfolio Category'}
                </h1>
            </div>

            <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">

                {/* Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            {locale === 'ru' ? 'Название (RU)' : 'Name (RU)'} *
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.name.ru}
                            onChange={(e) => setFormData({ ...formData, name: { ...formData.name, ru: e.target.value } })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            {locale === 'ru' ? 'Название (EN)' : 'Name (EN)'} *
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.name.en}
                            onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>

                {/* Slug & Target Page */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            {locale === 'ru' ? 'Слаг (URL/ID)' : 'Slug (URL/ID)'} *
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                            placeholder="e.g. custom-keyboards"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            {locale === 'ru' ? 'Привязка к странице' : 'Target Page'}
                        </label>
                        <select
                            value={formData.targetPageId || ''}
                            onChange={(e) => setFormData({ ...formData, targetPageId: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                        >
                            <option value="">{locale === 'ru' ? '-- Не привязывать (Скрыто) --' : '-- Unassigned (Hidden) --'}</option>
                            <option value="home">{locale === 'ru' ? 'Главная (Home)' : 'Home Page'}</option>
                            <option value="gallery">{locale === 'ru' ? 'Галерея (Главная)' : 'Gallery (Main)'}</option>
                            <option value="keyboard-engraving">{locale === 'ru' ? 'Гравировка клавиатур' : 'Keyboard Engraving'}</option>
                            <option value="catalog">{locale === 'ru' ? 'Каталог' : 'Catalog'}</option>
                            <option value="about">{locale === 'ru' ? 'О нас' : 'About Us'}</option>
                            <option value="contact">{locale === 'ru' ? 'Контакты' : 'Contact'}</option>
                            <option value="faq">{locale === 'ru' ? 'FAQ (Вопросы)' : 'FAQ'}</option>
                            {/* In a real app, this list might be fetched dynamically from a 'pages' collection */}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                            {locale === 'ru'
                                ? 'Если выбрано, галерея автоматически появится на этой странице.'
                                : 'If selected, the gallery will automatically appear on this page.'}
                        </p>
                    </div>
                </div>

                {/* Order & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            {locale === 'ru' ? 'Порядок (сортировка)' : 'Order (sorting)'}
                        </label>
                        <input
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer mt-6">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5 text-primary rounded border-slate-300 focus:ring-primary"
                            />
                            <span className="font-semibold text-slate-700">
                                {locale === 'ru' ? 'Активно (Отображается)' : 'Active (Visible)'}
                            </span>
                        </label>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-primary text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Save size={20} />
                        )}
                        <span>{locale === 'ru' ? 'Сохранить и добавить фото' : 'Save & Add Photos'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
