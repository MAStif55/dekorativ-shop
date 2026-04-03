'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Loader2, Upload, X, ImageIcon, Download, ChevronDown, ChevronUp, GripVertical, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProductImage } from '@/types/product';
import ImageCropper from './ImageCropper';

/**
 * Image Upload Component with SEO Metadata
 * 
 * Features:
 * - Drag and drop support
 * - Automatic image optimization (resize + WebP conversion)
 * - Alt text and keywords editing for SEO
 * - Preview with download and remove buttons
 * - Replace existing image while preserving SEO metadata
 * - Firebase Storage integration
 * - Backwards compatible with string URLs
 */

interface ImageUploadProps {
    value: (string | ProductImage)[];
    onChange: (images: ProductImage[]) => void;
    storagePath?: string;
}

export default function ImageUpload({
    value,
    onChange,
    storagePath = 'uploads',
}: ImageUploadProps) {
    const { locale } = useLanguage();
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    // Track previous length to detect new uploads
    const [prevLength, setPrevLength] = useState(value.length);

    // Cropping State — shared for both "add new" and "replace" flows
    const [croppingFile, setCroppingFile] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');

    // Replace State — which index is currently being replaced
    const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
    const replaceInputRef = useRef<HTMLInputElement>(null);

    // Auto-expand new images
    useEffect(() => {
        if (value.length > prevLength) {
            setExpandedIndex(value.length - 1);
        }
        setPrevLength(value.length);
    }, [value.length, prevLength]);

    // Robust normalization to handle various input shapes
    // CRITICAL: spread entire object first to preserve cardUrl, thumbUrl
    const normalizedImages: ProductImage[] = value.map(img => {
        if (typeof img === 'string') {
            return { url: img, alt: { en: '', ru: '' }, keywords: [] };
        }
        return {
            ...img,
            url: img.url || '',
            alt: img.alt || { en: '', ru: '' },
            keywords: img.keywords || []
        };
    });

    /**
     * Image variant definitions for multi-resolution upload
     */
    const VARIANTS = [
        { suffix: '',       maxDim: 1200, quality: 0.85 },  // full
        { suffix: '_card',  maxDim: 600,  quality: 0.82 },  // card
        { suffix: '_thumb', maxDim: 300,  quality: 0.75 },  // thumb
    ] as const;

    /**
     * Generates a resized WebP blob using canvas
     */
    const generateVariant = (file: File, maxDim: number, quality: number): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDim || height > maxDim) {
                    if (width >= height) {
                        height = (height * maxDim) / width;
                        width = maxDim;
                    } else {
                        width = (width * maxDim) / height;
                        height = maxDim;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                ctx!.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    blob => blob ? resolve(blob) : reject(new Error('Blob generation failed')),
                    'image/webp', quality
                );
            };
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = URL.createObjectURL(file);
        });
    };

    const uploadMetadata = {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000, immutable',
    };

    /**
     * Attempt to delete an old Storage URL (non-fatal — may fail for external/legacy URLs)
     */
    const tryDeleteOldFile = async (url: string | undefined) => {
        if (!url) return;
        try {
            const oldRef = ref(storage, url);
            await deleteObject(oldRef);
        } catch (e) {
            console.warn('Could not delete old storage file (non-fatal):', e);
        }
    };

    /**
     * Upload a new image as 3 WebP variants and return their URLs
     */
    const uploadVariants = async (file: File): Promise<{ fullUrl: string; cardUrl: string; thumbUrl: string }> => {
        const baseName = `${Date.now()}_${file.name.replace(/\.[^/.]+$/, '')}`;

        // Generate all 3 variants in parallel
        const blobs = await Promise.all(
            VARIANTS.map(v => generateVariant(file, v.maxDim, v.quality))
        );

        // Upload all 3 variants in parallel
        const urls = await Promise.all(
            VARIANTS.map((v, i) => {
                const filename = `${baseName}${v.suffix}.webp`;
                const storageRef = ref(storage, `${storagePath}/${filename}`);
                return uploadBytes(storageRef, blobs[i], uploadMetadata)
                    .then(() => getDownloadURL(storageRef));
            })
        );

        return { fullUrl: urls[0], cardUrl: urls[1], thumbUrl: urls[2] };
    };

    /**
     * Handle adding a brand-new image (appends to list)
     */
    const handleUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert(locale === 'ru' ? 'Пожалуйста, загрузите изображение' : 'Please upload an image file');
            return;
        }

        setUploading(true);
        try {
            const { fullUrl, cardUrl, thumbUrl } = await uploadVariants(file);

            const newImage: ProductImage = {
                url: fullUrl,
                cardUrl,
                thumbUrl,
                alt: { en: '', ru: '' },
                keywords: []
            };

            onChange([...normalizedImages, newImage]);
        } catch (error: any) {
            console.error("Upload failed", error);
            let errorMessage = locale === 'ru' ? "Ошибка загрузки!" : "Upload failed!";
            if (error.code === 'storage/unauthorized') {
                errorMessage = locale === 'ru' ? "Нет прав доступа." : "Permission denied.";
            }
            alert(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    /**
     * Handle replacing an existing image at `replacingIndex`.
     * Preserves all existing SEO metadata (alt, keywords).
     */
    const handleReplaceUpload = async (file: File) => {
        if (replacingIndex === null) return;
        if (!file.type.startsWith('image/')) {
            alert(locale === 'ru' ? 'Пожалуйста, загрузите изображение' : 'Please upload an image file');
            setReplacingIndex(null);
            return;
        }

        setUploading(true);
        const targetIndex = replacingIndex;

        try {
            const oldImage = normalizedImages[targetIndex];
            const { fullUrl, cardUrl, thumbUrl } = await uploadVariants(file);

            // Delete old Storage files (non-fatal)
            await Promise.all([
                tryDeleteOldFile(oldImage.url),
                tryDeleteOldFile(oldImage.cardUrl),
                tryDeleteOldFile(oldImage.thumbUrl),
            ]);

            // Atomically swap URL fields while preserving all SEO metadata
            const newImages = [...normalizedImages];
            newImages[targetIndex] = {
                ...oldImage,      // preserve alt, keywords, and any future fields
                url: fullUrl,
                cardUrl,
                thumbUrl,
            };

            onChange(newImages);
        } catch (error: any) {
            console.error("Replace upload failed", error);
            let errorMessage = locale === 'ru' ? "Ошибка замены файла!" : "File replacement failed!";
            if (error.code === 'storage/unauthorized') {
                errorMessage = locale === 'ru' ? "Нет прав доступа." : "Permission denied.";
            }
            alert(errorMessage);
        } finally {
            setUploading(false);
            setReplacingIndex(null);
        }
    };

    /**
     * Triggered when user picks a file via the "add new" upload zone
     */
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setFileName(file.name);
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setCroppingFile(reader.result?.toString() || null);
            });
            reader.readAsDataURL(file);
        }
    };

    /**
     * Triggered when user picks a file via the per-image "Replace" hidden input.
     * Opens ImageCropper in replace mode.
     */
    const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setFileName(file.name);
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                // croppingFile being set opens the ImageCropper modal.
                // replacingIndex is already set — onCropComplete will route to handleReplaceUpload.
                setCroppingFile(reader.result?.toString() || null);
            });
            reader.readAsDataURL(file);
        }
        // Reset so the same file can be selected again if needed
        e.target.value = '';
    };

    const handleDrop = useCallback(async (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setCroppingFile(reader.result?.toString() || null);
            });
            reader.readAsDataURL(file);
        }
    }, [normalizedImages, onChange]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    }, []);

    const removeImage = (index: number) => {
        const newImages = [...normalizedImages];
        newImages.splice(index, 1);
        onChange(newImages);
        if (expandedIndex === index) setExpandedIndex(null);
    };

    const updateImageMetadata = (index: number, updates: Partial<ProductImage>) => {
        const newImages = [...normalizedImages];
        newImages[index] = { ...newImages[index], ...updates };
        onChange(newImages);
    };

    const updateAltText = (index: number, lang: 'en' | 'ru', value: string) => {
        const newImages = [...normalizedImages];
        const currentAlt = newImages[index].alt || { en: '', ru: '' };
        newImages[index] = {
            ...newImages[index],
            alt: { ...currentAlt, [lang]: value }
        };
        onChange(newImages);
    };

    const updateKeywords = (index: number, value: string) => {
        const keywords = value.split(',').map(k => k.trim()).filter(k => k);
        updateImageMetadata(index, { keywords });
    };

    const downloadImage = async (url: string, index: number) => {
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const downloadUrl = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = downloadUrl;
                            link.download = `image-${index + 1}.webp`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(downloadUrl);
                        }
                    }, 'image/webp');
                }
            };

            img.onerror = () => window.open(url, '_blank');
            img.src = url;
        } catch (error) {
            window.open(url, '_blank');
        }
    };

    const toggleExpand = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    /**
     * Trigger the replace file picker for a given image index
     */
    const triggerReplace = (index: number) => {
        setReplacingIndex(index);
        replaceInputRef.current?.click();
    };

    return (
        <div className="space-y-4">
            {/* ImageCropper — shared for both "add" and "replace" flows */}
            {croppingFile && (
                <ImageCropper
                    imageSrc={croppingFile}
                    onCropComplete={async (croppedBlob) => {
                        const file = new File([croppedBlob], fileName, { type: 'image/webp' });
                        setCroppingFile(null);
                        if (replacingIndex !== null) {
                            // Replace flow: swap URLs, preserve metadata
                            await handleReplaceUpload(file);
                        } else {
                            // Add new flow: append to list
                            await handleUpload(file);
                        }
                    }}
                    onCancel={() => {
                        setCroppingFile(null);
                        setFileName('');
                        setReplacingIndex(null);
                    }}
                />
            )}

            {/* Hidden file input for the Replace flow */}
            <input
                ref={replaceInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReplaceFileChange}
            />

            {/* Image Grid */}
            <div className="space-y-3">
                {normalizedImages.map((image, idx) => (
                    <div key={idx} className="bg-gray-50 border rounded-lg overflow-hidden">
                        {/* Image Preview Row */}
                        <div className="flex items-center gap-3 p-3">
                            <div className="relative w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={image.url} alt={image.alt[locale as 'en' | 'ru'] || ''} className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-600 truncate">
                                    {image.alt.ru || image.alt.en || (locale === 'ru' ? 'Нет alt-текста' : 'No alt text')}
                                </div>
                                {image.keywords && image.keywords.length > 0 && (
                                    <div className="text-xs text-gray-400 mt-1">
                                        {image.keywords.slice(0, 3).join(', ')}
                                        {image.keywords.length > 3 && '...'}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                                {/* SEO Expand */}
                                <button
                                    type="button"
                                    onClick={() => toggleExpand(idx)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title={locale === 'ru' ? 'Редактировать SEO' : 'Edit SEO'}
                                >
                                    {expandedIndex === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>

                                {/* Replace File */}
                                <button
                                    type="button"
                                    onClick={() => triggerReplace(idx)}
                                    disabled={uploading}
                                    className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-40"
                                    title={locale === 'ru' ? 'Заменить файл (сохранит SEO)' : 'Replace file (preserves SEO)'}
                                >
                                    {uploading && replacingIndex === idx
                                        ? <Loader2 size={18} className="animate-spin text-amber-500" />
                                        : <RefreshCw size={18} />
                                    }
                                </button>

                                {/* Download */}
                                <button
                                    type="button"
                                    onClick={() => downloadImage(image.url, idx)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title={locale === 'ru' ? 'Скачать' : 'Download'}
                                >
                                    <Download size={18} />
                                </button>

                                {/* Delete */}
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title={locale === 'ru' ? 'Удалить' : 'Delete'}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Expanded Metadata Editor */}
                        {expandedIndex === idx && (
                            <div className="border-t bg-white p-4 space-y-3">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                    {locale === 'ru' ? 'SEO Метаданные' : 'SEO Metadata'}
                                </div>

                                {/* Alt Text RU */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Alt-текст (RU) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={image.alt.ru}
                                        onChange={(e) => updateAltText(idx, 'ru', e.target.value)}
                                        placeholder="Описание изображения для SEO и доступности"
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Alt Text EN */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Alt Text (EN)
                                    </label>
                                    <input
                                        type="text"
                                        value={image.alt.en}
                                        onChange={(e) => updateAltText(idx, 'en', e.target.value)}
                                        placeholder="Image description for SEO and accessibility"
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Keywords */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {locale === 'ru' ? 'Ключевые слова' : 'Keywords'}
                                    </label>
                                    <input
                                        type="text"
                                        value={(image.keywords || []).join(', ')}
                                        onChange={(e) => updateKeywords(idx, e.target.value)}
                                        placeholder={locale === 'ru' ? 'ручная работа, медь, элитарный (через запятую)' : 'handmade, copper, elite (comma-separated)'}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        {locale === 'ru' ? 'Разделяйте запятыми' : 'Separate with commas'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Upload Zone — add new image */}
            <label
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${dragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                    }`}
            >
                {uploading && replacingIndex === null ? (
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                ) : (
                    <>
                        <ImageIcon className={`mb-2 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} size={32} />
                        <span className="text-sm text-gray-500">
                            {dragOver
                                ? (locale === 'ru' ? 'Отпустите для загрузки' : 'Drop to upload')
                                : (locale === 'ru' ? 'Нажмите или перетащите изображение' : 'Click or drag image')}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">WebP · 3 {locale === 'ru' ? 'варианта' : 'variants'}</span>
                    </>
                )}
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
            </label>
        </div>
    );
}
