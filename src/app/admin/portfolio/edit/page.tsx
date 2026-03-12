'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/contexts/LanguageContext';
import { ArrowLeft, Save, Trash2, GripVertical, Edit } from 'lucide-react';
import Link from 'next/link';
import { PortfolioCategory, PortfolioPhoto } from '@/types/portfolio';
import { getPortfolioCategory, updatePortfolioCategory, getPortfolioPhotosByCategory, deletePortfolioPhoto, updatePortfolioPhoto } from '@/lib/firestore-utils';
import PortfolioPhotoUploader from '@/components/admin/PortfolioPhotoUploader';

function EditPortfolioCategoryContent() {
    const searchParams = useSearchParams();
    const categoryId = searchParams?.get('id');
    const { locale } = useTranslation();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState<Partial<PortfolioCategory>>({
        name: { en: '', ru: '' },
        description: { en: '', ru: '' },
        slug: '',
        targetPageId: '',
        isActive: true,
        order: 0
    });

    const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
    const [editingPhoto, setEditingPhoto] = useState<PortfolioPhoto | null>(null);
    const [savingPhoto, setSavingPhoto] = useState(false);

    const loadData = async () => {
        if (!categoryId) {
            router.push('/admin/portfolio');
            return;
        }

        setLoading(true);
        try {
            const cat = await getPortfolioCategory(categoryId);
            if (cat) {
                setFormData({
                    ...cat,
                    targetPageId: cat.targetPageId || '',
                    description: cat.description || { en: '', ru: '' }
                });
            } else {
                router.push('/admin/portfolio');
                return;
            }

            const p = await getPortfolioPhotosByCategory(categoryId);
            setPhotos(p);
        } catch (error) {
            console.error('Failed to load category', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [categoryId, router]);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...formData,
                targetPageId: formData.targetPageId === '' ? null : formData.targetPageId
            };
            await updatePortfolioCategory(categoryId!, payload);
            if (e) alert(locale === 'ru' ? 'Категория сохранена' : 'Category saved');
        } catch (error) {
            console.error('Error saving:', error);
            if (e) alert(locale === 'ru' ? 'Ошибка сохранения' : 'Error saving');
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePhoto = async (photoId: string) => {
        if (!window.confirm(locale === 'ru' ? 'Точно удалить фото?' : 'Delete this photo?')) return;
        try {
            await deletePortfolioPhoto(photoId);
            loadData();
        } catch (error) {
            console.error('Error deleting photo', error);
            alert('Error deleting photo');
        }
    };

    const handleSavePhotoEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPhoto) return;

        setSavingPhoto(true);
        try {
            // Only update SEO and order fields, not the image URL itself
            await updatePortfolioPhoto(editingPhoto.id, {
                seo: editingPhoto.seo,
                order: editingPhoto.order
            });
            setEditingPhoto(null);
            loadData();
            alert(locale === 'ru' ? 'Фото обновлено' : 'Photo updated');
        } catch (error) {
            console.error('Error updating photo', error);
            alert(locale === 'ru' ? 'Ошибка обновления' : 'Error updating');
        } finally {
            setSavingPhoto(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center my-6">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/portfolio" className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate" />
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-dark">
                        {locale === 'ru' ? 'Редактировать категорию' : 'Edit Category'}
                    </h1>
                </div>
            </div>

            {/* Category Settings Form */}
            <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800 border-b pb-2 flex-grow">
                        {locale === 'ru' ? 'Настройки категории' : 'Category Settings'}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            {locale === 'ru' ? 'Название (RU)' : 'Name (RU)'} *
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.name?.ru || ''}
                            onChange={(e) => setFormData({ ...formData, name: { ...formData.name!, ru: e.target.value } })}
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
                            value={formData.name?.en || ''}
                            onChange={(e) => setFormData({ ...formData, name: { ...formData.name!, en: e.target.value } })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>

                {/* Description Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            {locale === 'ru' ? 'Описание (RU)' : 'Description (RU)'}
                        </label>
                        <textarea
                            value={formData.description?.ru || ''}
                            onChange={(e) => setFormData({ ...formData, description: { ...formData.description!, ru: e.target.value } })}
                            placeholder={locale === 'ru' ? 'Необязательное описание, которое появится над фото' : 'Optional description above photos'}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary h-24 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            {locale === 'ru' ? 'Описание (EN)' : 'Description (EN)'}
                        </label>
                        <textarea
                            value={formData.description?.en || ''}
                            onChange={(e) => setFormData({ ...formData, description: { ...formData.description!, en: e.target.value } })}
                            placeholder={locale === 'ru' ? 'Опционально' : 'Optional description above photos'}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary h-24 resize-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            {locale === 'ru' ? 'Слаг (URL/ID)' : 'Slug (URL/ID)'} *
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.slug || ''}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
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
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            {locale === 'ru' ? 'Порядок (сортировка)' : 'Order (sorting)'}
                        </label>
                        <input
                            type="number"
                            value={formData.order || 0}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer mt-6">
                            <input
                                type="checkbox"
                                checked={formData.isActive || false}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5 text-primary rounded border-slate-300 focus:ring-primary"
                            />
                            <span className="font-semibold text-slate-700">
                                {locale === 'ru' ? 'Активно (Отображается)' : 'Active (Visible)'}
                            </span>
                        </label>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-primary text-slate-900 px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Save size={18} />
                        )}
                        <span>{locale === 'ru' ? 'Сохранить настройки' : 'Save Settings'}</span>
                    </button>
                </div>
            </form>

            <div className="border-t-2 border-slate-200/60 my-8"></div>

            {/* Photo Management Section */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">
                        {locale === 'ru' ? 'Фотографии категории' : 'Category Photos'}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {locale === 'ru' ? 'Перетащите изображение в область ниже, чтобы добавить новое фото. После загрузки вы сможете настроить SEO параметры.' : 'Drag and drop an image below to add a new photo. You will be able to configure SEO data afterwards.'}
                    </p>
                </div>

                {/* Uploader Component */}
                <PortfolioPhotoUploader
                    categoryId={categoryId!}
                    onUploadSuccess={loadData}
                />

                {/* Image Grid */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-dark mb-4">
                        {locale === 'ru' ? 'Загруженные фотографии' : 'Uploaded Photos'} ({photos.length})
                    </h3>

                    {photos.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                            {locale === 'ru' ? 'Нет фотографий. Загрузите первую выше.' : 'No photos. Upload the first one above.'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {photos.map(photo => (
                                <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-square shadow-sm flex flex-col bg-slate-50">
                                    <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                                        Order: {photo.order || 0}
                                    </div>
                                    <img
                                        src={photo.imageUrl}
                                        alt={photo.seo.altText.en || 'Portfolio photo'}
                                        className="w-full h-full object-cover flex-grow"
                                    />

                                    {/* Overlay Data & Actions */}
                                    <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setEditingPhoto(photo)}
                                                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm"
                                                title="Edit photo"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePhoto(photo.id)}
                                                className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-sm"
                                                title="Delete photo"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="text-white text-xs space-y-1">
                                            <p className="font-semibold truncate text-sm">{photo.seo.title}</p>
                                            <p className="opacity-80 truncate">Alt (RU): {photo.seo.altText.ru}</p>
                                            <p className="opacity-80 truncate pt-1 border-t border-white/20">Keys: {photo.seo.keywords?.join(', ')}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Photo Edit Modal */}
            {editingPhoto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800">
                                {locale === 'ru' ? 'Редактировать фото' : 'Edit Photo'}
                            </h3>
                            <button
                                onClick={() => setEditingPhoto(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSavePhotoEdit} className="p-6 overflow-y-auto space-y-6">
                            {/* Preview */}
                            <div className="flex justify-center mb-6">
                                <img
                                    src={editingPhoto.imageUrl}
                                    alt="Preview"
                                    className="h-48 object-contain rounded-lg border border-slate-200"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {locale === 'ru' ? 'Название (SEO Title)' : 'Title'} *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={editingPhoto.seo.title}
                                        onChange={(e) => setEditingPhoto({
                                            ...editingPhoto,
                                            seo: { ...editingPhoto.seo, title: e.target.value }
                                        })}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {locale === 'ru' ? 'Порядок (сортировка)' : 'Order'}
                                    </label>
                                    <input
                                        type="number"
                                        value={editingPhoto.order || 0}
                                        onChange={(e) => setEditingPhoto({
                                            ...editingPhoto,
                                            order: parseInt(e.target.value) || 0
                                        })}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {locale === 'ru' ? 'Alt Текст (RU)' : 'Alt Text (RU)'} *
                                    </label>
                                    <textarea
                                        required
                                        value={editingPhoto.seo.altText.ru || ''}
                                        onChange={(e) => setEditingPhoto({
                                            ...editingPhoto,
                                            seo: {
                                                ...editingPhoto.seo,
                                                altText: { ...editingPhoto.seo.altText, ru: e.target.value }
                                            }
                                        })}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary h-20 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {locale === 'ru' ? 'Alt Текст (EN)' : 'Alt Text (EN)'} *
                                    </label>
                                    <textarea
                                        required
                                        value={editingPhoto.seo.altText.en || ''}
                                        onChange={(e) => setEditingPhoto({
                                            ...editingPhoto,
                                            seo: {
                                                ...editingPhoto.seo,
                                                altText: { ...editingPhoto.seo.altText, en: e.target.value }
                                            }
                                        })}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary h-20 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {locale === 'ru' ? 'Подпись / Описание (RU)' : 'Caption / Description (RU)'}
                                    </label>
                                    <textarea
                                        value={editingPhoto.seo.description?.ru || ''}
                                        onChange={(e) => setEditingPhoto({
                                            ...editingPhoto,
                                            seo: {
                                                ...editingPhoto.seo,
                                                description: { ...(editingPhoto.seo.description || { en: '', ru: '' }), ru: e.target.value }
                                            }
                                        })}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary h-20 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        {locale === 'ru' ? 'Подпись / Описание (EN)' : 'Caption / Description (EN)'}
                                    </label>
                                    <textarea
                                        value={editingPhoto.seo.description?.en || ''}
                                        onChange={(e) => setEditingPhoto({
                                            ...editingPhoto,
                                            seo: {
                                                ...editingPhoto.seo,
                                                description: { ...(editingPhoto.seo.description || { en: '', ru: '' }), en: e.target.value }
                                            }
                                        })}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary h-20 resize-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    {locale === 'ru' ? 'Ключевые слова (через запятую)' : 'Keywords (comma separated)'}
                                </label>
                                <input
                                    type="text"
                                    value={editingPhoto.seo.keywords?.join(', ') || ''}
                                    onChange={(e) => {
                                        const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                                        setEditingPhoto({
                                            ...editingPhoto,
                                            seo: { ...editingPhoto.seo, keywords: tags }
                                        });
                                    }}
                                    placeholder="keyboard, custom, engraving"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-4 border-t flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingPhoto(null)}
                                    className="px-6 py-2 rounded-lg font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    {locale === 'ru' ? 'Отмена' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingPhoto}
                                    className="flex items-center gap-2 bg-primary text-slate-900 px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
                                >
                                    {savingPhoto ? (
                                        <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    <span>{locale === 'ru' ? 'Сохранить изменения' : 'Save Changes'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EditPortfolioCategoryPage() {
    return (
        <Suspense fallback={<div className="flex justify-center my-6"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <EditPortfolioCategoryContent />
        </Suspense>
    );
}
