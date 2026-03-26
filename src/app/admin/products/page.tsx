'use client';

import { useEffect, useState } from 'react';
import { getAllProducts, deleteProduct, createProduct, updateProduct, bulkUpdateOrder } from '@/lib/firestore-utils';
import { Product, getThumbImageUrl } from '@/types/product';
import { Plus, Trash2, RefreshCw, Search, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/contexts/LanguageContext';
import ConfirmModal from '@/components/admin/ConfirmModal';
import Breadcrumbs from '@/components/admin/Breadcrumbs';
import { AdminProductCard } from '@/components/admin/AdminProductCard';
import { AddProductCard } from '@/components/admin/AddProductCard';
import { formatPrice } from '@/utils/currency';

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

function SortableProductItem({ 
    product, 
    index, 
    locale, 
    onDelete 
}: { 
    product: Product; 
    index: number; 
    locale: string;
    onDelete: (id: string, e: any) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: product.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style}
            className="flex items-center gap-4 bg-white p-3 rounded-lg border shadow-sm group hover:border-primary/30 transition-colors"
        >
            <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-2"
            >
                <GripVertical size={20} />
            </div>
            <img
                src={product.images?.[0] ? getThumbImageUrl(product.images[0]) : ''}
                alt={product.title.en}
                className="w-12 h-12 object-cover rounded shadow-sm"
            />
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{locale === 'ru' ? product.title.ru : product.title.en}</h3>
                <p className="text-xs text-gray-500">{formatPrice(product.basePrice)}</p>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-gray-400">#{index + 1}</span>
                <button
                    onClick={(e) => onDelete(product.id, e)}
                    className="text-gray-400 hover:text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}

import { Category } from '@/types/category';
import { getCategories } from '@/lib/firestore-utils';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [CATEGORIES, setCATEGORIES] = useState<{ id: string; label: { en: string; ru: string } }[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
    const { t, locale } = useTranslation();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await getAllProducts<Product>();
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        getCategories<Category>().then(cats => {
            setCATEGORIES(cats.map(c => ({ id: c.slug, label: c.title })));
        });
    }, []);

    const filteredProducts = products.filter(p => {
        const matchesCategory = categoryFilter ? p.category === categoryFilter : true;
        const matchesSearch = searchQuery
            ? (p.title.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.title.ru.toLowerCase().includes(searchQuery.toLowerCase()))
            : true;
        return matchesCategory && matchesSearch;
    });

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteProduct(itemToDelete);
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
            alert(t('admin.delete_failed'));
        } finally {
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const handleBulkDelete = async () => {
        try {
            for (const id of Array.from(selectedIds)) {
                await deleteProduct(id);
            }
            setSelectedIds(new Set());
            fetchProducts();
        } catch (error) {
            console.error("Error bulk deleting:", error);
            alert(t('admin.delete_failed'));
        } finally {
            setBulkDeleteModalOpen(false);
        }
    };

    const handleDuplicate = async (product: Product) => {
        try {
            const duplicate: Product = {
                ...product,
                id: '', // Will be auto-generated
                slug: `${product.slug}-copy`,
                title: {
                    en: `${product.title.en} (Copy)`,
                    ru: `${product.title.ru} (Копия)`
                }
            };
            await createProduct(duplicate);
            fetchProducts();
        } catch (error) {
            console.error("Error duplicating:", error);
            alert("Failed to duplicate product");
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredProducts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const getCategoryLabel = (id: string) => {
        const cat = CATEGORIES.find(c => c.id === id);
        return cat ? cat.label[locale as 'en' | 'ru'] : id;
    };

    // Reorder State
    const [isReordering, setIsReordering] = useState(false);
    const [reorderedProducts, setReorderedProducts] = useState<Product[]>([]);
    const [savingOrder, setSavingOrder] = useState(false);

    useEffect(() => {
        if (products.length > 0) {
            // Sort by order field (asc) or createdAt (desc) fallback
            const sorted = [...products].sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
                return (b.createdAt || 0) - (a.createdAt || 0);
            });
            // Only set if actually different to avoid infinite loop
            if (JSON.stringify(sorted) !== JSON.stringify(products)) {
                setProducts(sorted);
            }
        }
    }, [products]);

    const toggleReorderMode = () => {
        if (isReordering) {
            setIsReordering(false);
        } else {
            // Initialize reordered list with current sorted products
            const sorted = [...filteredProducts].sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
                return (b.createdAt || 0) - (a.createdAt || 0);
            });
            setReorderedProducts(sorted);
            setIsReordering(true);
        }
    };

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = reorderedProducts.findIndex((p) => p.id === active.id);
            const newIndex = reorderedProducts.findIndex((p) => p.id === over.id);

            const newOrder = arrayMove(reorderedProducts, oldIndex, newIndex);
            setReorderedProducts(newOrder);
        }
    }

    const saveOrder = async () => {
        setSavingOrder(true);
        try {
            const updates = reorderedProducts.map((p, index) => ({
                id: p.id,
                order: index
            }));

            await bulkUpdateOrder('products', updates);

            setProducts(prev => {
                const map = new Map(prev.map(p => [p.id, p]));
                updates.forEach(u => {
                    const p = map.get(u.id);
                    if (p) p.order = u.order;
                });
                return Array.from(map.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
            });

            setIsReordering(false);
            alert(locale === 'ru' ? 'Порядок сохранен' : 'Order saved');
        } catch (error) {
            console.error("Failed to save order", error);
            alert("Failed to save order");
        } finally {
            setSavingOrder(false);
        }
    };

    return (
        <div>
            <Breadcrumbs />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-900">{t('admin.product_management')}</h1>
                <div className="flex space-x-2 w-full sm:w-auto">
                    {isReordering ? (
                        <>
                            <button
                                onClick={() => setIsReordering(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                            >
                                {locale === 'ru' ? 'Отмена' : 'Cancel'}
                            </button>
                            <button
                                onClick={saveOrder}
                                disabled={savingOrder}
                                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium shadow-sm"
                            >
                                {savingOrder ? (locale === 'ru' ? 'Сохранение...' : 'Saving...') : (locale === 'ru' ? 'Сохранить порядок' : 'Save Order')}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={toggleReorderMode}
                                className="p-2 text-gray-800 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
                                title={locale === 'ru' ? 'Изменить порядок' : 'Reorder'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="m21 8-4-4-4 4" /><path d="M17 4v16" /></svg>
                            </button>
                            <button
                                onClick={fetchProducts}
                                className="p-2 text-gray-800 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
                                title="Refresh"
                            >
                                <RefreshCw size={20} />
                            </button>
                            <Link
                                href="/admin/products/new"
                                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm"
                            >
                                <Plus size={20} />
                                <span className="sm:hidden md:inline">{t('admin.add_new_pack')}</span>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Filters (Hide in Reorder Mode) */}
            {!isReordering && (
                <div className="flex flex-wrap items-center gap-4 mb-6 sticky top-0 z-20 bg-gray-50 py-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static sm:bg-transparent">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder={locale === 'ru' ? 'Поиск товаров...' : 'Search products...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary outline-none text-gray-900 font-medium"
                    >
                        <option value="">{locale === 'ru' ? 'Все категории' : 'All Categories'}</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.label[locale as 'en' | 'ru']}
                            </option>
                        ))}
                    </select>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={toggleSelectAll}
                            className="px-3 py-2 text-sm font-medium text-gray-800 bg-white border rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            {selectedIds.size === filteredProducts.length && filteredProducts.length > 0
                                ? (locale === 'ru' ? 'Снять выделение' : 'Deselect All')
                                : (locale === 'ru' ? 'Выбрать все' : 'Select All')}
                        </button>
                    </div>

                    {selectedIds.size > 0 && (
                        <div className="flex items-center space-x-2 bg-red-50 px-4 py-2 rounded-lg ml-auto sm:ml-0 animate-in fade-in slide-in-from-top-2 duration-200">
                            <span className="text-sm text-red-700 font-medium">
                                {selectedIds.size} {locale === 'ru' ? 'выбрано' : 'selected'}
                            </span>
                            <div className="h-4 w-px bg-red-200 mx-2"></div>
                            <button
                                onClick={() => setBulkDeleteModalOpen(true)}
                                className="flex items-center space-x-1 text-red-600 hover:text-red-800 font-medium transition-colors"
                            >
                                <Trash2 size={16} />
                                <span>{locale === 'ru' ? 'Удалить' : 'Delete'}</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl h-[350px] animate-pulse"></div>
                    ))}
                </div>
            ) : isReordering ? (
                /* Reorder List View */
                <div className="space-y-4 pb-10 max-w-2xl mx-auto">
                    <p className="text-center text-sm text-gray-500 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100 shadow-sm leading-relaxed">
                        {locale === 'ru'
                            ? 'Перетащите товары за иконку слева, чтобы изменить их порядок в каталоге.'
                            : 'Drag products by the handle on the left to reorder them in the catalog.'}
                    </p>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={reorderedProducts.map(p => p.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {reorderedProducts.map((product, index) => (
                                    <SortableProductItem 
                                        key={product.id} 
                                        product={product} 
                                        index={index} 
                                        locale={locale as string}
                                        onDelete={(id, e) => {
                                            itemToDelete && setItemToDelete(id);
                                            setItemToDelete(id);
                                            setDeleteModalOpen(true);
                                        }}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                    {/* Add New Card - First Item */}
                    <AddProductCard />

                    {filteredProducts.map((product) => (
                        <AdminProductCard
                            key={product.id}
                            product={product}
                            locale={locale as 'en' | 'ru'}
                            selected={selectedIds.has(product.id)}
                            onToggleSelect={(id, e) => {
                                e.preventDefault(); // Stop navigation
                                toggleSelect(id);
                            }}
                            onDuplicate={(p, e) => {
                                e.preventDefault();
                                handleDuplicate(p);
                            }}
                            onDelete={(id, e) => {
                                e.preventDefault();
                                itemToDelete && setItemToDelete(id);
                                setItemToDelete(id);
                                setDeleteModalOpen(true);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && !isReordering && filteredProducts.length === 0 && (
                <div className="text-center py-6">
                    <p className="text-gray-800 mb-4 font-medium">{t('admin.no_products')}</p>
                    <button onClick={() => setCategoryFilter('')} className="text-gray-900 underline font-bold hover:text-primary">
                        {locale === 'ru' ? 'Очистить фильтры' : 'Clear filters'}
                    </button>
                </div>
            )}

            {/* Single Delete Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                title={locale === 'ru' ? 'Удалить товар?' : 'Delete Product?'}
                message={locale === 'ru' ? 'Это действие нельзя отменить.' : 'This action cannot be undone.'}
                confirmLabel={locale === 'ru' ? 'Удалить' : 'Delete'}
                cancelLabel={locale === 'ru' ? 'Отмена' : 'Cancel'}
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => {
                    setDeleteModalOpen(false);
                    setItemToDelete(null);
                }}
            />

            {/* Bulk Delete Modal */}
            <ConfirmModal
                isOpen={bulkDeleteModalOpen}
                title={locale === 'ru' ? `Удалить ${selectedIds.size} товаров?` : `Delete ${selectedIds.size} products?`}
                message={locale === 'ru' ? 'Это действие нельзя отменить.' : 'This action cannot be undone.'}
                confirmLabel={locale === 'ru' ? 'Удалить все' : 'Delete All'}
                cancelLabel={locale === 'ru' ? 'Отмена' : 'Cancel'}
                variant="danger"
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteModalOpen(false)}
            />
        </div>
    );
}
