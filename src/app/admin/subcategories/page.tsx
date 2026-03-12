'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Category, SubCategory } from '@/types/category';
import { getCategories, createMainCategory, deleteMainCategory, getSubcategories, createSubcategory, deleteSubcategory } from '@/lib/firestore-utils';
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';

export default function PageBuilderAdmin() {
    const { t, locale } = useTranslation();
    
    // Categories (Pages) State
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Subcategories (Blocks) State
    const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
    const [loadingSubs, setLoadingSubs] = useState(false);

    // Add Page Form State
    const [newCatTitleRu, setNewCatTitleRu] = useState('');
    const [newCatTitleEn, setNewCatTitleEn] = useState('');
    const [newCatSlug, setNewCatSlug] = useState('');
    const [newCatOrder, setNewCatOrder] = useState<number>(0);
    const [isSubmittingCat, setIsSubmittingCat] = useState(false);

    // Add Block Form State
    const [newTitleRu, setNewTitleRu] = useState('');
    const [newTitleEn, setNewTitleEn] = useState('');
    const [newDescRu, setNewDescRu] = useState('');
    const [newDescEn, setNewDescEn] = useState('');
    const [newOrder, setNewOrder] = useState<number>(0);
    const [newSlug, setNewSlug] = useState('');
    const [isSubmittingSub, setIsSubmittingSub] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        if (activeTab && activeTab !== 'NEW_PAGE') {
            loadSubcategories(activeTab);
        }
    }, [activeTab]);

    async function loadCategories() {
        setLoadingCategories(true);
        setError(null);
        try {
            const data = await getCategories<Category>();
            setCategories(data);
            if (data.length > 0 && !activeTab) {
                setActiveTab(data[0].slug);
            } else if (data.length === 0) {
                setActiveTab('NEW_PAGE');
            }
        } catch (err) {
            console.error("Error loading categories:", err);
            setError(locale === 'ru' ? 'Ошибка загрузки страниц' : 'Error loading pages');
        } finally {
            setLoadingCategories(false);
        }
    }

    async function loadSubcategories(categorySlug: string) {
        setLoadingSubs(true);
        try {
            const data = await getSubcategories<SubCategory>(categorySlug);
            setSubcategories(data);
        } catch (err) {
            console.error("Error loading subcategories:", err);
        } finally {
            setLoadingSubs(false);
        }
    }

    // Auto-generate slug for new Page
    useEffect(() => {
        if (newCatTitleEn && !newCatSlug) {
            const slug = newCatTitleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            setNewCatSlug(slug);
        }
    }, [newCatTitleEn]);

    // Auto-generate slug for new Block
    useEffect(() => {
        if (newTitleEn && !newSlug) {
            const slug = newTitleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            setNewSlug(slug);
        }
    }, [newTitleEn]);

    async function handleAddPage(e: React.FormEvent) {
        e.preventDefault();
        if (!newCatTitleRu || !newCatTitleEn || !newCatSlug) return;

        setIsSubmittingCat(true);
        try {
            const newCat: any = {
                slug: newCatSlug,
                title: { ru: newCatTitleRu, en: newCatTitleEn },
                description: { ru: '', en: '' }, // optional description
                order: newCatOrder
            };

            await createMainCategory(newCat);

            setNewCatTitleRu('');
            setNewCatTitleEn('');
            setNewCatSlug('');
            setNewCatOrder(categories.length > 0 ? categories.length * 10 : 0);
            
            await loadCategories();
            setActiveTab(newCatSlug);
        } catch (err) {
            console.error("Error adding page:", err);
            setError(locale === 'ru' ? 'Ошибка при добавлении страницы' : 'Error adding page');
        } finally {
            setIsSubmittingCat(false);
        }
    }

    async function handleDeletePage() {
        if (!activeTab || activeTab === 'NEW_PAGE') return;
        
        // Find doc ID to delete. Since we query categories returning {id, slug}, we need the document ID.
        // Wait, our getCategories maps {id: doc.id, ...doc.data()}. So Category type needs an `id` field.
        const catToDelete = categories.find(c => c.slug === activeTab);
        if (!catToDelete || !(catToDelete as any).id) return;

        if (subcategories.length > 0) {
            alert(locale === 'ru' ? 'Сначала удалите все блоки внутри этой страницы.' : 'Delete all blocks in this page first.');
            return;
        }

        if (!confirm(locale === 'ru' ? 'Удалить эту страницу?' : 'Delete this page?')) return;

        try {
            await deleteMainCategory((catToDelete as any).id);
            setActiveTab(''); // Reset to trigger auto-select first tab
            await loadCategories();
        } catch (err) {
            console.error("Error deleting page:", err);
            alert(locale === 'ru' ? 'Ошибка удаления' : 'Error deleting page');
        }
    }

    async function handleAddSubcategory(e: React.FormEvent) {
        e.preventDefault();
        if (!newTitleRu || !newTitleEn || !newSlug || activeTab === 'NEW_PAGE') return;

        setIsSubmittingSub(true);
        try {
            const newSub: SubCategory = {
                slug: newSlug,
                title: { ru: newTitleRu, en: newTitleEn },
                description: { ru: newDescRu, en: newDescEn },
                order: newOrder,
                parentCategory: activeTab
            };

            await createSubcategory(newSub);

            setNewTitleRu('');
            setNewTitleEn('');
            setNewDescRu('');
            setNewDescEn('');
            setNewOrder(subcategories.length > 0 ? subcategories.length + 1 : 0);
            setNewSlug('');

            await loadSubcategories(activeTab);
        } catch (err) {
            console.error("Error adding subcategory:", err);
            setError(locale === 'ru' ? 'Ошибка при добавлении блока' : 'Error adding block');
        } finally {
            setIsSubmittingSub(false);
        }
    }

    async function handleDeleteSub(id: string) {
        if (!confirm(locale === 'ru' ? 'Удалить этот блок?' : 'Delete this block?')) return;

        try {
            await deleteSubcategory(id);
            await loadSubcategories(activeTab);
        } catch (err) {
            console.error("Error deleting subcategory:", err);
            alert(locale === 'ru' ? 'Ошибка удаления' : 'Error deleting block');
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    {locale === 'ru' ? 'Конструктор страниц' : 'Page Builder'}
                </h1>
                {activeTab !== 'NEW_PAGE' && categories.length > 0 && (
                    <button
                        onClick={handleDeletePage}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-red-200"
                    >
                        <Trash2 size={16} />
                        {locale === 'ru' ? 'Удалить страницу' : 'Delete Page'}
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Category Tabs */}
            <div className="flex flex-wrap border-b mb-6 gap-y-2">
                {loadingCategories ? (
                    <div className="p-3"><Loader2 className="animate-spin text-gray-400" size={20} /></div>
                ) : (
                    <>
                        {categories.map(cat => (
                            <button
                                key={cat.slug}
                                onClick={() => setActiveTab(cat.slug)}
                                className={`px-5 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === cat.slug
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {cat.title[locale]}
                            </button>
                        ))}
                        <button
                            onClick={() => setActiveTab('NEW_PAGE')}
                            className={`px-5 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-1 ${activeTab === 'NEW_PAGE'
                                ? 'border-primary text-primary bg-primary/5'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Plus size={16} />
                            {locale === 'ru' ? 'Добавить страницу' : 'Add Page'}
                        </button>
                    </>
                )}
            </div>

            {activeTab === 'NEW_PAGE' ? (
                /* ADD PAGE FORM */
                <div className="bg-white p-6 rounded-lg shadow-sm border max-w-xl">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">
                        {locale === 'ru' ? 'Новая страница (Главная категория)' : 'New Page (Main Category)'}
                    </h2>
                    <form onSubmit={handleAddPage} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {locale === 'ru' ? 'Название (RU)' : 'Title (RU)'}
                            </label>
                            <input
                                type="text"
                                value={newCatTitleRu}
                                onChange={e => setNewCatTitleRu(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {locale === 'ru' ? 'Название (EN)' : 'Title (EN)'}
                            </label>
                            <input
                                type="text"
                                value={newCatTitleEn}
                                onChange={e => setNewCatTitleEn(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                                <input
                                    type="text"
                                    value={newCatSlug}
                                    onChange={e => setNewCatSlug(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none font-mono text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {locale === 'ru' ? 'Порядок' : 'Order'}
                                </label>
                                <input
                                    type="number"
                                    value={newCatOrder}
                                    onChange={e => setNewCatOrder(Number(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmittingCat}
                            className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 "
                        >
                            {isSubmittingCat ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                            {locale === 'ru' ? 'Создать страницу' : 'Create Page'}
                        </button>
                    </form>
                </div>
            ) : (
                /* MANAGE BLOCKS (SUBCATEGORIES) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* List Column */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">
                            {locale === 'ru' ? 'Блоки на странице' : 'Blocks on Page'}
                        </h2>

                        {loadingSubs ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-primary" />
                            </div>
                        ) : subcategories.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">
                                {locale === 'ru' ? 'Нет блоков' : 'No blocks found'}
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {subcategories.map(sub => (
                                    <li key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border group hover:border-primary/30 transition-colors">
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {sub.title[locale]} 
                                                {sub.order !== undefined && <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full border">order: {sub.order}</span>}
                                            </div>
                                            {sub.description && (
                                                <div className="text-sm text-gray-600 mt-1 line-clamp-1">{sub.description[locale]}</div>
                                            )}
                                            <div className="text-xs text-gray-500 font-mono mt-1">{sub.slug}</div>
                                        </div>
                                        <button
                                            onClick={() => sub.id && handleDeleteSub(sub.id)}
                                            className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Add Form Column */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border h-fit">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800">
                            {locale === 'ru' ? 'Добавить новый блок' : 'Add New Block'}
                        </h2>

                        <form onSubmit={handleAddSubcategory} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {locale === 'ru' ? 'Название (RU)' : 'Title (RU)'}
                                </label>
                                <input
                                    type="text"
                                    value={newTitleRu}
                                    onChange={e => setNewTitleRu(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="Кольца"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {locale === 'ru' ? 'Название (EN)' : 'Title (EN)'}
                                </label>
                                <input
                                    type="text"
                                    value={newTitleEn}
                                    onChange={e => setNewTitleEn(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="Rings"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {locale === 'ru' ? 'Описание (RU)' : 'Description (RU)'}
                                </label>
                                <textarea
                                    value={newDescRu}
                                    onChange={e => setNewDescRu(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder={locale === 'ru' ? 'Красивые кольца' : 'Beautiful rings'}
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {locale === 'ru' ? 'Описание (EN)' : 'Description (EN)'}
                                </label>
                                <textarea
                                    value={newDescEn}
                                    onChange={e => setNewDescEn(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="Beautiful rings"
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {locale === 'ru' ? 'Порядок' : 'Order'}
                                    </label>
                                    <input
                                        type="number"
                                        value={newOrder}
                                        onChange={e => setNewOrder(Number(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Slug (ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={newSlug}
                                        onChange={e => setNewSlug(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none font-mono text-sm"
                                        placeholder="rings"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingSub}
                                className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmittingSub ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                {locale === 'ru' ? 'Добавить блок' : 'Add Block'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
