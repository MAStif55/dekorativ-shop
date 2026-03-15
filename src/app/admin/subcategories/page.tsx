'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Category, SubCategory } from '@/types/category';
import { getCategories, createMainCategory, updateMainCategory, deleteMainCategory, getSubcategories, createSubcategory, deleteSubcategory, updateDocument, bulkUpdateOrder } from '@/lib/firestore-utils';
import { Plus, Trash2, Loader2, AlertCircle, GripVertical, Edit2, X, Save } from 'lucide-react';
import MarkdownEditor from '@/components/admin/MarkdownEditor';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableSubCategoryItem({ 
    sub, 
    onEdit,
    onDelete, 
    locale 
}: { 
    sub: SubCategory; 
    onEdit: (sub: SubCategory) => void;
    onDelete: (id: string) => void; 
    locale: string;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: sub.id as string });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <li 
            ref={setNodeRef} 
            style={style}
            className="flex items-center justify-between p-3 bg-white rounded-lg border group hover:border-primary/30 transition-colors shadow-sm"
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div 
                    {...attributes} 
                    {...listeners} 
                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
                >
                    <GripVertical size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                        {sub.title[locale as 'en' | 'ru']} 
                    </div>
                    {sub.description && (
                        <div className="text-sm text-gray-600 mt-1 line-clamp-1">{sub.description[locale as 'en' | 'ru']}</div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 ml-2">
                <button
                    onClick={() => onEdit(sub)}
                    className="text-gray-400 hover:text-primary p-2 rounded-full hover:bg-primary/5 transition-colors"
                    title={locale === 'ru' ? 'Редактировать' : 'Edit'}
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={() => sub.id && onDelete(sub.id)}
                    className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                    title={locale === 'ru' ? 'Удалить' : 'Delete'}
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </li>
    );
}

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

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px drag before starting
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Add Page Form State
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [newCatTitleRu, setNewCatTitleRu] = useState('');
    const [newCatTitleEn, setNewCatTitleEn] = useState('');
    const [newCatSlug, setNewCatSlug] = useState('');
    const [newCatOrder, setNewCatOrder] = useState<number>(0);
    const [isSubmittingCat, setIsSubmittingCat] = useState(false);

    // Add Block Form State
    const [editingSub, setEditingSub] = useState<SubCategory | null>(null);
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
            
            // Handle cross-sync if route changes from outside, or on initial load
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
        if (newTitleEn && !newSlug && !editingSub) {
            const slug = newTitleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            setNewSlug(slug);
        }
    }, [newTitleEn, editingSub]);

    function startEditPage() {
        const cat = categories.find(c => c.slug === activeTab);
        if (cat) {
            setEditingCategory(cat);
            setNewCatTitleRu(cat.title.ru);
            setNewCatTitleEn(cat.title.en);
            setNewCatSlug(cat.slug);
            setNewCatOrder(cat.order || 0);
            setActiveTab('NEW_PAGE');
        }
    }

    function cancelEditPage() {
        setEditingCategory(null);
        setNewCatTitleRu('');
        setNewCatTitleEn('');
        setNewCatSlug('');
        setNewCatOrder(0);
        if (categories.length > 0) {
            // Find a valid slug to return to, prefer the one we were just editing
            const returnSlug = editingCategory?.slug || categories[0].slug;
            setActiveTab(returnSlug);
        } else {
            setActiveTab('NEW_PAGE');
        }
    }

    async function handleAddPage(e: React.FormEvent) {
        e.preventDefault();
        if (!newCatTitleRu || !newCatTitleEn || !newCatSlug) return;

        setIsSubmittingCat(true);
        try {
            const pageData: any = {
                slug: newCatSlug,
                title: { ru: newCatTitleRu, en: newCatTitleEn },
                description: { ru: '', en: '' }, 
                order: newCatOrder
            };

            if (editingCategory) {
                await updateMainCategory((editingCategory as any).id, pageData);
            } else {
                await createMainCategory(pageData);
            }

            setNewCatTitleRu('');
            setNewCatTitleEn('');
            setNewCatSlug('');
            setNewCatOrder(0);
            setEditingCategory(null);
            
            await loadCategories();
            setActiveTab(newCatSlug);
        } catch (err) {
            console.error("Error saving page:", err);
            setError(locale === 'ru' ? 'Ошибка при сохранении страницы' : 'Error saving page');
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
            const blockData: SubCategory = {
                slug: newSlug,
                title: { ru: newTitleRu, en: newTitleEn },
                description: { ru: newDescRu, en: newDescEn },
                order: newOrder,
                parentCategory: activeTab
            };

            if (editingSub) {
                await updateDocument('subcategories', editingSub.id as string, blockData);
            } else {
                await createSubcategory(blockData);
            }

            setNewTitleRu('');
            setNewTitleEn('');
            setNewDescRu('');
            setNewDescEn('');
            setNewOrder(editingSub ? 0 : (subcategories.length > 0 ? subcategories.length + 1 : 0));
            setNewSlug('');
            setEditingSub(null);

            await loadSubcategories(activeTab);
        } catch (err) {
            console.error("Error saving block:", err);
            setError(locale === 'ru' ? 'Ошибка при сохранении блока' : 'Error saving block');
        } finally {
            setIsSubmittingSub(false);
        }
    }

    function startEditSub(sub: SubCategory) {
        setEditingSub(sub);
        setNewTitleRu(sub.title.ru);
        setNewTitleEn(sub.title.en);
        setNewDescRu(sub.description?.ru || '');
        setNewDescEn(sub.description?.en || '');
        setNewOrder(sub.order || 0);
        setNewSlug(sub.slug);
    }

    function cancelEditSub() {
        setEditingSub(null);
        setNewTitleRu('');
        setNewTitleEn('');
        setNewDescRu('');
        setNewDescEn('');
        setNewOrder(0);
        setNewSlug('');
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

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = subcategories.findIndex((sub) => sub.id === active.id);
            const newIndex = subcategories.findIndex((sub) => sub.id === over.id);

            const newOrder = arrayMove(subcategories, oldIndex, newIndex);
            
            // Optimistic UI update
            setSubcategories(newOrder);

            try {
                const updates = newOrder.map((sub, index) => ({
                    id: sub.id as string,
                    order: index * 10 // Using 10 step for easier manual edits if needed, but consistent
                }));
                await bulkUpdateOrder('subcategories', updates);
            } catch (error) {
                console.error("Failed to update order in Firestore:", error);
                // Revert on failure
                loadSubcategories(activeTab);
            }
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    {locale === 'ru' ? 'Конструктор страниц' : 'Page Builder'}
                </h1>
                {activeTab !== 'NEW_PAGE' && categories.length > 0 && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={startEditPage}
                            className="text-slate-600 hover:text-primary hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-slate-200 shadow-sm"
                        >
                            <Edit2 size={16} />
                            {locale === 'ru' ? 'Редактировать страницу' : 'Edit Page'}
                        </button>
                        <button
                            onClick={handleDeletePage}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-red-200"
                        >
                            <Trash2 size={16} />
                            {locale === 'ru' ? 'Удалить страницу' : 'Delete Page'}
                        </button>
                    </div>
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
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            {editingCategory 
                                ? (locale === 'ru' ? 'Редактирование страницы' : 'Edit Page')
                                : (locale === 'ru' ? 'Новая страница (Главная категория)' : 'New Page (Main Category)')
                            }
                        </h2>
                        {editingCategory && (
                            <button onClick={cancelEditPage} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        )}
                    </div>
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
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={isSubmittingCat}
                                className="flex-1 bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 "
                            >
                                {isSubmittingCat ? <Loader2 className="animate-spin" size={18} /> : (editingCategory ? <Save size={18} /> : <Plus size={18} />)}
                                {editingCategory 
                                    ? (locale === 'ru' ? 'Сохранить изменения' : 'Save Changes')
                                    : (locale === 'ru' ? 'Создать страницу' : 'Create Page')
                                }
                            </button>
                            {editingCategory && (
                                <button
                                    type="button"
                                    onClick={cancelEditPage}
                                    className="px-6 py-2.5 border rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-600"
                                >
                                    {locale === 'ru' ? 'Отмена' : 'Cancel'}
                                </button>
                            )}
                        </div>
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
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={subcategories.map(s => s.id as string)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <ul className="space-y-3">
                                        {subcategories.map(sub => (
                                            <SortableSubCategoryItem 
                                                key={sub.id} 
                                                sub={sub} 
                                                onEdit={startEditSub}
                                                onDelete={handleDeleteSub} 
                                                locale={locale} 
                                            />
                                        ))}
                                    </ul>
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>

                    {/* Add Form Column */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border h-fit">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">
                                {editingSub 
                                    ? (locale === 'ru' ? 'Редактировать блок' : 'Edit Block')
                                    : (locale === 'ru' ? 'Добавить новый блок' : 'Add New Block')
                                }
                            </h2>
                            {editingSub && (
                                <button onClick={cancelEditSub} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            )}
                        </div>

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
                                <MarkdownEditor
                                    value={newDescRu}
                                    onChange={setNewDescRu}
                                    placeholder={locale === 'ru' ? 'Красивые кольца' : 'Beautiful rings'}
                                    className="min-h-[150px]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {locale === 'ru' ? 'Описание (EN)' : 'Description (EN)'}
                                </label>
                                <MarkdownEditor
                                    value={newDescEn}
                                    onChange={setNewDescEn}
                                    placeholder="Beautiful rings"
                                    className="min-h-[150px]"
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

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmittingSub}
                                    className="flex-1 bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmittingSub ? <Loader2 className="animate-spin" size={18} /> : (editingSub ? <Save size={18} /> : <Plus size={18} />)}
                                    {editingSub 
                                        ? (locale === 'ru' ? 'Сохранить изменения' : 'Save Changes')
                                        : (locale === 'ru' ? 'Добавить блок' : 'Add Block')
                                    }
                                </button>
                                {editingSub && (
                                    <button
                                        type="button"
                                        onClick={cancelEditSub}
                                        className="px-6 py-2.5 border rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-600"
                                    >
                                        {locale === 'ru' ? 'Отмена' : 'Cancel'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
