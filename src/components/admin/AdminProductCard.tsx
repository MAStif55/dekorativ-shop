'use client';

import { Product, ProductStatus, getCardImageUrl } from '@/types/product';
import Link from 'next/link';
import { Copy, ExternalLink, Trash2, Check, Loader2, Save } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { useState, useEffect } from 'react';

interface AdminProductCardProps {
    product: Product;
    locale: 'en' | 'ru';
    selected: boolean;
    onToggleSelect: (id: string, e: React.MouseEvent) => void;
    onDuplicate: (product: Product, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onUpdate: (id: string, updatedFields: Partial<Product>) => Promise<void>;
}

export function AdminProductCard({
    product,
    locale,
    selected,
    onToggleSelect,
    onDuplicate,
    onDelete,
    onUpdate
}: AdminProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form fields initialized with product details
    const [titleVal, setTitleVal] = useState(product.title[locale] || '');
    const [priceVal, setPriceVal] = useState(product.basePrice || 0);
    const [statusVal, setStatusVal] = useState(product.status || 'AVAILABLE');

    // Keep fields in sync with prop changes
    useEffect(() => {
        setTitleVal(product.title[locale] || '');
        setPriceVal(product.basePrice || 0);
        setStatusVal(product.status || 'AVAILABLE');
    }, [product, locale]);

    // Check if fields were modified
    const isDirty =
        titleVal !== (product.title[locale] || '') ||
        priceVal !== (product.basePrice || 0) ||
        statusVal !== (product.status || 'AVAILABLE');

    // The overlay is visible when hovered, focused, modified, or saving
    const showOverlay = isHovered || isFocused || isDirty || isSaving;

    const resetForm = () => {
        setTitleVal(product.title[locale] || '');
        setPriceVal(product.basePrice || 0);
        setStatusVal(product.status || 'AVAILABLE');
        setIsFocused(false);
    };

    const handleSave = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsSaving(true);
        try {
            const updatedTitle = {
                ...product.title,
                [locale]: titleVal
            };
            await onUpdate(product.id, {
                title: updatedTitle,
                basePrice: Number(priceVal),
                status: statusVal as ProductStatus
            });
            setIsFocused(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        resetForm();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            resetForm();
        }
    };

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                if (!isFocused && !isDirty) {
                    resetForm();
                }
            }}
            className={`group relative flex flex-col bg-white rounded-xl border transition-all duration-200 hover:shadow-lg overflow-hidden h-full min-h-[360px] ${selected
                ? 'border-primary ring-2 ring-primary ring-opacity-50'
                : 'border-gray-200 hover:border-primary/50'
                }`}
        >
            {/* Selection Checkbox (Absolute Top Left) */}
            <div
                className="absolute top-3 left-3 z-10"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleSelect(product.id, e);
                }}
            >
                <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${selected
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white/80 border-gray-300 hover:border-primary text-transparent'
                    }`}>
                    <Check size={14} strokeWidth={3} />
                </div>
            </div>

            {/* Main Clickable Area (Link to full edit) */}
            <Link
                href={`/admin/products/edit?id=${product.id}`}
                className="flex flex-col flex-1"
            >
                {/* Image Area */}
                <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-gray-100">
                    {product.images?.[0] ? (
                        <img
                            src={getCardImageUrl(product.images[0])}
                            alt={product.title[locale]}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                            No Image
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex flex-col flex-1 p-4 pb-2">
                    <div className="mb-2">
                        <h3 className="font-heading font-bold text-base text-gray-900 line-clamp-1 flex items-center gap-2" title={product.title[locale]}>
                            <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                !product.status || product.status === 'AVAILABLE' ? 'bg-green-500' :
                                product.status === 'OUT_OF_STOCK' ? 'bg-amber-500' :
                                product.status === 'COMING_SOON' ? 'bg-blue-500' :
                                'bg-gray-400'
                            }`} title={product.status || 'AVAILABLE'} />
                            {product.title[locale]}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2 min-h-[2.5em] leading-relaxed">
                            {product.description[locale]}
                        </p>
                    </div>
                </div>
            </Link>

            {/* Footer Area (Price and Actions) */}
            <div className="p-4 pt-2 mt-auto flex items-center justify-between border-t border-gray-100 bg-gray-50/30">
                <span className="font-bold text-gray-900 text-base">
                    {formatCurrency(product.basePrice)}
                </span>

                {/* Quick Actions */}
                <div className="flex space-x-1">
                    <a
                        href={`/pack?id=${product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50 transition-colors"
                        title="View Live"
                    >
                        <ExternalLink size={14} />
                    </a>
                    <button
                        onClick={(e) => onDuplicate(product, e)}
                        className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-full hover:bg-indigo-50 transition-colors"
                        title="Duplicate"
                    >
                        <Copy size={14} />
                    </button>
                    <button
                        onClick={(e) => onDelete(product.id, e)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Quick Edit Overlay */}
            <div
                className={`absolute inset-0 bg-white/95 backdrop-blur-[3px] z-20 flex flex-col p-4 transition-all duration-300 ${
                    showOverlay
                        ? 'opacity-100 pointer-events-auto translate-y-0'
                        : 'opacity-0 pointer-events-none translate-y-4'
                }`}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-primary-dark">
                        {locale === 'ru' ? 'Быстрое редактирование' : 'Quick Edit'}
                    </span>
                    {isDirty && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium animate-pulse">
                            {locale === 'ru' ? 'Изменено' : 'Modified'}
                        </span>
                    )}
                </div>

                <div className="flex-1 flex flex-col gap-3">
                    {/* Title Input */}
                    <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                            {locale === 'ru' ? 'Название товара' : 'Product Title'}
                        </label>
                        <input
                            type="text"
                            value={titleVal}
                            onChange={(e) => setTitleVal(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onKeyDown={handleKeyDown}
                            className="w-full text-sm font-bold text-gray-900 bg-transparent border-b border-gray-200 py-1 focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Price Input */}
                    <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                            {locale === 'ru' ? 'Цена (₽)' : 'Price (₽)'}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={priceVal === 0 ? '' : priceVal}
                                onChange={(e) => setPriceVal(Number(e.target.value))}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                onKeyDown={handleKeyDown}
                                className="w-full text-sm font-bold text-gray-900 bg-transparent border-b border-gray-200 py-1 pr-5 focus:border-primary focus:outline-none transition-colors"
                            />
                            <span className="absolute right-0 bottom-1 text-xs font-bold text-gray-400">₽</span>
                        </div>
                    </div>

                    {/* Status Select */}
                    <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                            {locale === 'ru' ? 'Статус наличия' : 'Availability Status'}
                        </label>
                        <select
                            value={statusVal}
                            onChange={(e) => setStatusVal(e.target.value as ProductStatus)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="w-full text-sm font-medium text-gray-900 bg-transparent border-b border-gray-200 py-1 focus:border-primary focus:outline-none transition-colors cursor-pointer"
                        >
                            <option value="AVAILABLE">
                                {locale === 'ru' ? '✅ В наличии' : '✅ Available'}
                            </option>
                            <option value="OUT_OF_STOCK">
                                {locale === 'ru' ? '⏸️ Нет в наличии' : '⏸️ Out of Stock'}
                            </option>
                            <option value="COMING_SOON">
                                {locale === 'ru' ? '🔜 Скоро в продаже' : '🔜 Coming Soon'}
                            </option>
                            <option value="HIDDEN">
                                {locale === 'ru' ? '👁️‍🗨️ Скрыт' : '👁️‍🗨️ Hidden'}
                            </option>
                        </select>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
                    <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="flex-1 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
                    >
                        {locale === 'ru' ? 'Отмена' : 'Cancel'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !isDirty}
                        className="flex-1 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <Save size={12} />
                        )}
                        <span>
                            {isSaving
                                ? (locale === 'ru' ? 'Сохранение...' : 'Saving...')
                                : (locale === 'ru' ? 'Сохранить' : 'Save')}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
