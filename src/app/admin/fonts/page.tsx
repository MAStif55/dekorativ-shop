'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { StorageService, FontRepository } from '@/lib/data';
import { FontModel } from '@/types/font';
import {
    Upload,
    Trash2,
    Edit2,
    Tag,
    Plus,
    FileType2,
    Check,
    X,
    FolderOpen,
    Search
} from 'lucide-react';
import * as opentype from 'opentype.js';

const CATEGORIES = [
    { id: 'all', label: { en: 'All', ru: 'Обычные' } },
    { id: 'bold_and_striking', label: { en: 'Bold', ru: 'Акцентные' } },
    { id: 'decorative_and_unusual', label: { en: 'Decorative', ru: 'Декоративные' } },
    { id: 'handwritten_and_calligraphic', label: { en: 'Handwritten', ru: 'Рукописные' } },
    { id: 'simple_and_clear', label: { en: 'Simple', ru: 'Строгие' } },
    { id: 'thematic', label: { en: 'Thematic', ru: 'Тематические' } }
];

const DEFAULT_TAGS = [
    'Армейский / Трафаретный',
    'Готический',
    'Детский',
    'Для инициалов',
    'Жирный',
    'Каллиграфический',
    'Классический',
    'Неформальный / Забавный',
    'Округлый',
    'Популярный',
    'Праздничный',
    'Простой',
    'Ретро / Винтажный',
    'Ровный',
    'Романтичный',
    'Рукописный',
    'С завитушками / Узорный',
    'Славянский / Старорусский',
    'Современный',
    'Строгий / Деловой',
    'Тонкий',
    'Угловатый',
    'Узкий',
    'Широкий',
    'Элегантный / Изящный',
];

export default function AdminFontsPage() {
    const { locale } = useTranslation();
    const [fonts, setFonts] = useState<FontModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [allTags, setAllTags] = useState<string[]>(DEFAULT_TAGS);
    const [fontPage, setFontPage] = useState(1);
    const FONTS_PER_PAGE = 15;

    // Upload State
    const [file, setFile] = useState<File | null>(null);
    const [sanitizedBuffer, setSanitizedBuffer] = useState<ArrayBuffer | null>(null);
    const [fontName, setFontName] = useState('');
    const [category, setCategory] = useState(CATEGORIES[1].id);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [newTagInput, setNewTagInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewFontFamily, setPreviewFontFamily] = useState<string | null>(null);
    const [previewText, setPreviewText] = useState('С любовью, Dekorativ');

    // Batch Upload State
    const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');
    const [batchFiles, setBatchFiles] = useState<File[]>([]);
    const [batchMetadataText, setBatchMetadataText] = useState('');
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, status: '' });
    const batchFileInputRef = useRef<HTMLInputElement>(null);

    // Edit State
    const [editingFontId, setEditingFontId] = useState<string | null>(null);

    // UI State
    const [isListExpanded, setIsListExpanded] = useState(false);
    const [isDraggingSingle, setIsDraggingSingle] = useState(false);
    const [isDraggingBatch, setIsDraggingBatch] = useState(false);
    const [expandedFontId, setExpandedFontId] = useState<string | null>(null);

    // Sorted & paginated fonts: unverified first, then by createdAt desc
    const sortedFonts = useMemo(() => {
        return [...fonts].sort((a, b) => {
            const aVerified = a.isVerified ? 1 : 0;
            const bVerified = b.isVerified ? 1 : 0;
            if (aVerified !== bVerified) return aVerified - bVerified;
            return (b.createdAt || 0) - (a.createdAt || 0);
        });
    }, [fonts]);

    const totalFontPages = Math.max(1, Math.ceil(sortedFonts.length / FONTS_PER_PAGE));
    const paginatedFonts = sortedFonts.slice((fontPage - 1) * FONTS_PER_PAGE, fontPage * FONTS_PER_PAGE);

    // Clamp fontPage when fonts change
    useEffect(() => {
        if (fontPage > totalFontPages) setFontPage(totalFontPages);
    }, [totalFontPages, fontPage]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const fetchedFonts = await FontRepository.getAll();
            setFonts(fetchedFonts);

            // Extract unique tags globally, merged with defaults
            const tags = new Set<string>(DEFAULT_TAGS);
            fetchedFonts.forEach(f => {
                if (f.tags) f.tags.forEach(t => tags.add(t));
            });
            setAllTags(Array.from(tags).sort());
        } catch (error) {
            console.error('Error loading fonts:', error);
        } finally {
            setLoading(false);
        }
    };

    const processSingleFile = async (selected: File) => {
        const name = selected.name.toLowerCase();
        if (name.endsWith('.ttf') || name.endsWith('.otf')) {
            setFile(selected);
            setFontName(selected.name.replace(/\.(ttf|otf)$/i, ''));
            setUploadError('');

            const familyName = `preview-upload-${Date.now()}`;
            try {
                const buffer = await selected.arrayBuffer();

                let finalBuffer = buffer;

                // Extract actual font name from metadata using opentype.js
                try {
                    const parsedFont = opentype.parse(buffer);
                    // @ts-ignore - opentype names object definition
                    if (parsedFont && parsedFont.names && parsedFont.names.fontFamily) {
                        // @ts-ignore
                        const names = parsedFont.names.fontFamily;
                        const metadataName = names.en || names.ru || Object.values(names)[0];
                        if (metadataName && typeof metadataName === 'string') {
                            setFontName(metadataName);
                        }
                    }

                    // Sanitize archaic/broken fonts by fully recompiling their tables
                    if (parsedFont) {
                        try {
                            const sanitizedBuffer = parsedFont.toArrayBuffer();
                            if (sanitizedBuffer) {
                                finalBuffer = sanitizedBuffer;
                                console.log('Font tables sanitized and rebuilt by opentype.js');
                            }
                        } catch (e) {
                            console.warn('opentype.js could not recompile font, using original buffer instead', e);
                        }
                    }
                } catch (parseErr) {
                    console.warn('opentype.js failed to parse font metadata:', parseErr);
                }

                const fontFace = new FontFace(familyName, finalBuffer);
                await fontFace.load();
                document.fonts.add(fontFace);
                setPreviewFontFamily(familyName);
                setSanitizedBuffer(finalBuffer);
            } catch (err) {
                console.warn('Failed to load font locally with FontFace API, falling back to Blob:', err);
                const blobUrl = URL.createObjectURL(selected);
                const style = document.createElement('style');
                style.id = 'upload-preview-font';
                document.getElementById('upload-preview-font')?.remove();
                // Omit the format() hint so the browser doesn't strictly reject it if it mismatches
                style.innerHTML = `@font-face { font-family: '${familyName}'; src: url('${blobUrl}'); font-display: swap; }`;
                document.head.appendChild(style);
                setPreviewFontFamily(familyName);
            }
        } else {
            setUploadError(locale === 'ru' ? 'Только файлы .ttf или .otf' : 'Only .ttf or .otf files allowed');
            setFile(null);
            setPreviewFontFamily(null);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await processSingleFile(e.target.files[0]);
        }
    };

    // --- Drag and Drop Handlers ---
    const handleDragOverSingle = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingSingle(true);
    };

    const handleDragLeaveSingle = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingSingle(false);
    };

    const handleDropSingle = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingSingle(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processSingleFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOverBatch = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingBatch(true);
    };

    const handleDragLeaveBatch = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingBatch(false);
    };

    const handleDropBatch = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingBatch(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files).filter(file =>
                file.name.toLowerCase().endsWith('.ttf') || file.name.toLowerCase().endsWith('.otf')
            );
            if (newFiles.length > 0) {
                setBatchFiles(prev => {
                    const existingNames = new Set(prev.map(f => f.name));
                    const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
                    return [...prev, ...uniqueNewFiles];
                });
            }
        }
    };

    const handleAddTag = () => {
        const tag = newTagInput.trim().toLowerCase();
        if (tag && !selectedTags.includes(tag)) {
            setSelectedTags([...selectedTags, tag]);
            setNewTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setSelectedTags(selectedTags.filter(t => t !== tagToRemove));
    };

    const toggleExistingTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            handleRemoveTag(tag);
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        // In edit mode, file is optional. In create mode, file is required.
        if (!editingFontId && !file) return;
        if (!fontName || !category) return;

        setIsUploading(true);
        setUploadError('');
        setUploadProgress(10);

        try {
            if (editingFontId) {
                // UPDATE MODE
                let newUrl: string | undefined = undefined;
                let newFile: string | undefined = undefined;

                if (file) {
                    // Upload new file
                    const isOtf = file.name.toLowerCase().endsWith('.otf');
                    const contentType = isOtf ? 'font/otf' : 'font/ttf';
                    const storagePath = `fonts/${category}/${file.name.replace(/\s+/g, '_')}`;

                    setUploadProgress(40);
                    newUrl = await StorageService.upload(storagePath, sanitizedBuffer || file, { contentType });
                    newFile = file.name;
                }

                setUploadProgress(90);
                const updates: Partial<FontModel> = {
                    name: fontName,
                    category,
                    tags: selectedTags
                };
                if (newUrl && newFile) {
                    updates.url = newUrl;
                    updates.file = newFile;
                }

                await FontRepository.update(editingFontId, updates);

            } else {
                // CREATE MODE (file is guaranteed here)
                const isOtf = file!.name.toLowerCase().endsWith('.otf');
                const contentType = isOtf ? 'font/otf' : 'font/ttf';
                const storagePath = `fonts/${category}/${file!.name.replace(/\s+/g, '_')}`;

                setUploadProgress(40);
                const url = await StorageService.upload(storagePath, sanitizedBuffer || file!, { contentType });

                // Save to Firestore
                setUploadProgress(90);
                await FontRepository.create({
                    name: fontName,
                    category,
                    file: file!.name,
                    url,
                    tags: selectedTags
                });
            }

            // Reset & Reload
            setUploadProgress(100);
            resetForm();

            await loadData();
        } catch (error: any) {
            console.error('Upload/Update failed', error);
            setUploadError(error.message || 'Operation failed');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const resetForm = () => {
        setFile(null);
        setSanitizedBuffer(null);
        setFontName('');
        setSelectedTags([]);
        setEditingFontId(null);
        setCategory(CATEGORIES[1].id);
        setPreviewFontFamily(null);
        document.getElementById('upload-preview-font')?.remove();
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Reset Batch Mode
        setBatchFiles([]);
        setBatchMetadataText('');
        setBatchProgress({ current: 0, total: 0, status: '' });
        if (batchFileInputRef.current) batchFileInputRef.current.value = '';
    };

    const handleBatchUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (batchFiles.length === 0 || !batchMetadataText.trim()) {
            setUploadError(locale === 'ru' ? 'Выберите файлы шрифтов и вставьте JSON метаданные.' : 'Select font files and paste JSON metadata.');
            return;
        }

        setIsUploading(true);
        setUploadError('');
        setBatchProgress({ current: 0, total: batchFiles.length, status: locale === 'ru' ? 'Чтение метаданных...' : 'Reading metadata...' });

        try {
            // 1. Read and parse JSON metadata
            const metadataArray = JSON.parse(batchMetadataText);

            if (!Array.isArray(metadataArray)) {
                throw new Error("Metadata JSON must be an array of objects.");
            }

            // 2. Iterate and upload
            let successCount = 0;
            for (let i = 0; i < batchFiles.length; i++) {
                const currentFile = batchFiles[i];
                setBatchProgress({ current: i + 1, total: batchFiles.length, status: `Обработка ${currentFile.name}...` });

                const meta = metadataArray.find(m => m.filename.toLowerCase() === currentFile.name.toLowerCase());
                if (!meta) {
                    console.warn(`Skipping ${currentFile.name} - no metadata found in JSON.`);
                    continue;
                }

                // Sanitize font just like single upload
                const buffer = await currentFile.arrayBuffer();
                let finalBuffer = buffer;

                try {
                    const parsedFont = opentype.parse(buffer);
                    if (parsedFont && parsedFont.names && parsedFont.names.fontFamily) {
                        const names = parsedFont.names.fontFamily as any;
                        const extractedName = names.en || names.ru || Object.values(names)[0];
                        if (extractedName && typeof extractedName === 'string') {
                            meta.name = extractedName; // Auto-correct name from metadata if not explicitly provided
                        }
                    }
                    if (parsedFont) {
                        const sanitizedBuffer = parsedFont.toArrayBuffer();
                        if (sanitizedBuffer) finalBuffer = sanitizedBuffer;
                    }
                } catch (err) {
                    console.warn(`opentype.js failed to parse ${currentFile.name}:`, err);
                }

                const fontName = meta.name || currentFile.name.replace(/\.(ttf|otf)$/i, '');
                const category = meta.category || CATEGORIES[1].id;
                const tags = meta.tags || [];

                const isOtf = currentFile.name.toLowerCase().endsWith('.otf');
                const contentType = isOtf ? 'font/otf' : 'font/ttf';
                const storagePath = `fonts/${category}/${currentFile.name.replace(/\s+/g, '_')}`;

                setBatchProgress({ current: i + 1, total: batchFiles.length, status: `Загрузка ${currentFile.name}...` });
                const url = await StorageService.upload(storagePath, finalBuffer, { contentType });

                await FontRepository.create({
                    name: fontName,
                    category,
                    file: currentFile.name,
                    url,
                    tags
                });

                successCount++;
            }

            setBatchProgress({ current: batchFiles.length, total: batchFiles.length, status: locale === 'ru' ? `Успешно загружено: ${successCount}` : `Successfully uploaded: ${successCount}` });
            setTimeout(() => {
                resetForm();
                loadData();
            }, 2000);

        } catch (error: any) {
            console.error('Batch upload failed', error);
            setUploadError(error.message || 'Batch upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleEdit = (font: FontModel) => {
        setEditingFontId(font.id!);
        setFontName(font.name);
        setCategory(font.category);
        setSelectedTags(font.tags || []);
        setFile(null);
        setPreviewFontFamily(null); // Optional: we could load the preview from URL here, but keeping it simple for now
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (font: FontModel) => {
        if (!confirm(locale === 'ru' ? `Удалить шрифт ${font.name}?` : `Delete font ${font.name}?`)) return;

        try {
            // Delete from Firestore
            if (font.id) await FontRepository.delete(font.id);

            // Try to delete from Storage
            try {
                await StorageService.delete(`fonts/${font.category}/${font.file}`);
            } catch (storageErr) {
                console.warn("Could not delete from storage, might not exist:", storageErr);
            }

            await loadData();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete font');
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 font-ornamental">
                        {locale === 'ru' ? 'Менеджер Шрифтов' : 'Font Manager'}
                    </h1>
                    <p className="text-slate-500 mt-2">
                        {locale === 'ru'
                            ? 'Загружайте шрифты, назначайте категории и добавляйте теги'
                            : 'Upload fonts, assign categories, and add tags'}
                    </p>
                </div>
            </div>

            <div className="space-y-8">
                {/* UPLOAD FORM (Full Width) */}
                <div>
                    <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
                        <button
                            type="button"
                            onClick={() => setUploadMode('single')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${uploadMode === 'single' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {locale === 'ru' ? 'Одиночная загрузка' : 'Single Upload'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setUploadMode('batch');
                                setEditingFontId(null);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${uploadMode === 'batch' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {locale === 'ru' ? 'Массовая загрузка (JSON)' : 'Batch Upload (JSON)'}
                        </button>
                    </div>

                    {uploadMode === 'single' ? (
                        <form onSubmit={handleUpload} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    {editingFontId ? <Edit2 className="w-5 h-5 text-turquoise" /> : <Upload className="w-5 h-5 text-turquoise" />}
                                    {locale === 'ru'
                                        ? (editingFontId ? 'Редактировать Шрифт' : 'Загрузить Шрифт')
                                        : (editingFontId ? 'Edit Font' : 'Upload Font')}
                                </h2>
                                {editingFontId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                    >
                                        {locale === 'ru' ? 'Отмена' : 'Cancel'}
                                    </button>
                                )}
                            </div>

                            {uploadError && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-100">
                                    {uploadError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: File + Meta */}
                                <div className="space-y-5">
                                    {/* File Selector */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            {locale === 'ru' ? 'Файл шрифта (.ttf, .otf)' : 'Font File (.ttf, .otf)'}
                                            {editingFontId && <span className="ml-2 text-xs font-normal text-slate-400">({locale === 'ru' ? 'Необязательно при ред.' : 'Optional for edit'})</span>}
                                        </label>
                                        <div
                                            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${isDraggingSingle ? 'border-turquoise bg-turquoise/10 scale-[1.02]' :
                                                file ? 'border-turquoise bg-turquoise/5' : 'border-slate-200 hover:border-turquoise hover:bg-slate-50'
                                                }`}
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={handleDragOverSingle}
                                            onDragLeave={handleDragLeaveSingle}
                                            onDrop={handleDropSingle}
                                        >
                                            {file ? (
                                                <div className="flex items-center justify-center gap-2 text-turquoise-dark font-medium">
                                                    <FileType2 className="w-5 h-5" />
                                                    <span className="truncate max-w-[200px]">{file.name}</span>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-slate-500 flex flex-col items-center">
                                                    <Upload className="w-6 h-6 mb-2 text-slate-400" />
                                                    {locale === 'ru' ? 'Нажмите для выбора' : 'Click to select'}
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept=".ttf,.otf"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </div>

                                    {/* Font Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            {locale === 'ru' ? 'Название шрифта' : 'Font Name'}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={fontName}
                                            onChange={(e) => setFontName(e.target.value)}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-turquoise focus:border-transparent outline-none"
                                        />
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                            <FolderOpen className="w-4 h-4 text-slate-400" />
                                            {locale === 'ru' ? 'Категория' : 'Category'}
                                        </label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-turquoise outline-none"
                                        >
                                            {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {locale === 'ru' ? c.label.ru : c.label.en}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Live Preview */}
                                    {previewFontFamily && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                                                {locale === 'ru' ? 'Предпросмотр' : 'Preview'}
                                            </label>
                                            <input
                                                type="text"
                                                value={previewText}
                                                onChange={(e) => setPreviewText(e.target.value)}
                                                className="w-full p-0 mb-3 bg-transparent border-none text-xs text-slate-400 focus:outline-none"
                                                placeholder={locale === 'ru' ? 'Введите текст...' : 'Type text...'}
                                            />
                                            <div
                                                className="text-slate-800 break-words text-center"
                                                style={{ fontFamily: `'${previewFontFamily}', sans-serif`, fontSize: '32px', lineHeight: 1.4 }}
                                            >
                                                {previewText || fontName}
                                            </div>
                                            <div
                                                className="mt-3 pt-3 border-t border-slate-200 text-slate-600 break-words text-center"
                                                style={{ fontFamily: `'${previewFontFamily}', sans-serif`, fontSize: '14px', lineHeight: 1.6 }}
                                            >
                                                АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвг<br />
                                                ABCDEFGHIJKLMNOPQRSTUVWXYZabcd<br />
                                                0123456789 .,!?@#$%&*()
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Tags */}
                                <div className="pt-4 md:pt-0 md:pl-6 md:border-l border-slate-100">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-slate-400" />
                                        {locale === 'ru' ? 'Теги (Свойства)' : 'Tags'}
                                    </label>

                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={newTagInput}
                                            onChange={(e) => setNewTagInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                            placeholder={locale === 'ru' ? 'Свадебный, тонкий...' : 'Wedding, elegant...'}
                                            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-turquoise outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddTag}
                                            className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Selected Tags */}
                                    {selectedTags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {selectedTags.map(tag => (
                                                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-turquoise-light text-turquoise-dark rounded-full text-xs font-semibold">
                                                    {tag}
                                                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Existing Tags Pool */}
                                    {allTags.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
                                                {locale === 'ru' ? 'Быстрый выбор:' : 'Quick Select:'}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {allTags.map(tag => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => toggleExistingTag(tag)}
                                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${selectedTags.includes(tag)
                                                            ? 'border-turquoise bg-turquoise/10 text-turquoise-dark font-medium'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit Row */}
                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                                {editingFontId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        disabled={isUploading}
                                        className="w-full md:w-auto px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                                    >
                                        {locale === 'ru' ? 'Отмена' : 'Cancel'}
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={isUploading || (!editingFontId && !file)}
                                    className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {uploadProgress}%
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            {locale === 'ru'
                                                ? (editingFontId ? 'Обновить Шрифт' : 'Сохранить Шрифт')
                                                : (editingFontId ? 'Update Font' : 'Save Font')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleBatchUpload} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-turquoise" />
                                    {locale === 'ru' ? 'Массовая загрузка из JSON' : 'Batch Upload from JSON'}
                                </h2>
                            </div>

                            {uploadError && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-100">
                                    {uploadError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        1. {locale === 'ru' ? 'Файлы шрифтов (выберите несколько)' : 'Font Files (select multiple)'}
                                    </label>
                                    <div
                                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors h-full flex flex-col items-center justify-center ${isDraggingBatch ? 'border-turquoise bg-turquoise/10 scale-[1.02]' :
                                            batchFiles.length > 0 ? 'border-turquoise bg-turquoise/5' : 'border-slate-200 hover:border-turquoise hover:bg-slate-50'
                                            }`}
                                        onClick={() => batchFileInputRef.current?.click()}
                                        onDragOver={handleDragOverBatch}
                                        onDragLeave={handleDragLeaveBatch}
                                        onDrop={handleDropBatch}
                                    >
                                        {batchFiles.length > 0 ? (
                                            <div className="flex flex-col items-center justify-center gap-1 text-turquoise-dark font-medium">
                                                <FileType2 className="w-5 h-5 mb-1" />
                                                <span className="text-sm">
                                                    {locale === 'ru' ? `Выбрано файлов: ${batchFiles.length}` : `${batchFiles.length} files selected`}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-slate-500 flex flex-col items-center">
                                                <Upload className="w-6 h-6 mb-2 text-slate-400" />
                                                {locale === 'ru' ? 'Нажмите для выбора' : 'Click to select'}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept=".ttf,.otf"
                                        multiple
                                        ref={batchFileInputRef}
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                const newFiles = Array.from(e.target.files);
                                                setBatchFiles(prev => {
                                                    const existingNames = new Set(prev.map(f => f.name));
                                                    const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
                                                    return [...prev, ...uniqueNewFiles];
                                                });
                                            }
                                        }}
                                        className="hidden"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        2. {locale === 'ru' ? 'JSON метаданные' : 'JSON Metadata'}
                                    </label>
                                    <textarea
                                        value={batchMetadataText}
                                        onChange={(e) => setBatchMetadataText(e.target.value)}
                                        placeholder={locale === 'ru' ? '[\n  { "filename": "font.ttf", "category": "accent", "tags": ["wedding"] }\n]' : '[\n  { "filename": "font.ttf", "category": "accent", "tags": ["wedding"] }\n]'}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-turquoise outline-none font-mono text-xs h-[160px] resize-y"
                                    />
                                </div>
                            </div>

                            {/* Batch Submit Row */}
                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                                {isUploading && batchProgress.total > 0 && (
                                    <div className="flex-1 flex items-center pr-4">
                                        <div className="w-full">
                                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                <span>{batchProgress.status}</span>
                                                <span>{batchProgress.current} / {batchProgress.total}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-turquoise h-full transition-all duration-300"
                                                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={isUploading || batchFiles.length === 0 || !batchMetadataText.trim()}
                                    className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {locale === 'ru' ? 'Загрузка...' : 'Uploading...'}
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            {locale === 'ru' ? 'Запустить массовую загрузку' : 'Start Batch Upload'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* FONT LIST - Collapsible */}
                <div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setIsListExpanded(!isListExpanded)}
                            className="w-full p-6 text-left flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
                        >
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                {locale === 'ru' ? 'Установленные шрифты' : 'Installed Fonts'}
                                <span className="text-sm font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                    {fonts.length}
                                </span>
                            </h2>
                            <span className="text-sm font-medium text-slate-500 flex flex-col items-center">
                                {isListExpanded ? (
                                    <>
                                        <X className="w-5 h-5 mb-1" />
                                        {locale === 'ru' ? 'Скрыть список' : 'Hide List'}
                                    </>
                                ) : (
                                    <>
                                        <FolderOpen className="w-5 h-5 mb-1 text-turquoise" />
                                        {locale === 'ru' ? 'Показать список' : 'Show List'}
                                    </>
                                )}
                            </span>
                        </button>

                        {isListExpanded && (
                            <div className="border-t border-slate-100">

                                {loading ? (
                                    <div className="p-12 flex justify-center">
                                        <div className="w-8 h-8 border-4 border-turquoise border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : fonts.length === 0 ? (
                                    <div className="p-12 text-center text-slate-500">
                                        <FileType2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p>{locale === 'ru' ? 'Нет загруженных шрифтов.' : 'No fonts uploaded yet.'}</p>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-100">
                                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-nowrap">Шрифт</th>
                                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Предпросмотр</th>
                                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-nowrap">Категория</th>
                                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Теги</th>
                                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Действия</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {paginatedFonts.map(font => (
                                                        <FontTableRow
                                                            key={font.id}
                                                            font={font}
                                                            categories={CATEGORIES}
                                                            allTags={allTags}
                                                            locale={locale}
                                                            isExpanded={expandedFontId === font.id}
                                                            onToggleExpand={() => setExpandedFontId(prev => prev === font.id ? null : font.id!)}
                                                            onCollapse={() => setExpandedFontId(null)}
                                                            onUpdate={(updatedFont) => {
                                                                setFonts(prev => prev.map(f => f.id === updatedFont.id ? updatedFont : f));
                                                            }}
                                                            onDelete={() => handleDelete(font)}
                                                            onEdit={() => handleEdit(font)}
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {/* Pagination Controls */}
                                        {totalFontPages > 1 && (
                                            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                                                <span className="text-xs text-slate-500">
                                                    {locale === 'ru'
                                                        ? `Показано ${(fontPage - 1) * FONTS_PER_PAGE + 1}–${Math.min(fontPage * FONTS_PER_PAGE, sortedFonts.length)} из ${sortedFonts.length}`
                                                        : `Showing ${(fontPage - 1) * FONTS_PER_PAGE + 1}–${Math.min(fontPage * FONTS_PER_PAGE, sortedFonts.length)} of ${sortedFonts.length}`
                                                    }
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => { setFontPage(p => Math.max(1, p - 1)); setExpandedFontId(null); }}
                                                        disabled={fontPage === 1}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        ←
                                                    </button>
                                                    {Array.from({ length: totalFontPages }, (_, i) => i + 1).map(page => (
                                                        <button
                                                            key={page}
                                                            onClick={() => { setFontPage(page); setExpandedFontId(null); }}
                                                            className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors ${page === fontPage
                                                                ? 'bg-turquoise text-white shadow-sm'
                                                                : 'text-slate-500 hover:bg-white hover:text-slate-800 border border-transparent hover:border-slate-200'
                                                                }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => { setFontPage(p => Math.min(totalFontPages, p + 1)); setExpandedFontId(null); }}
                                                        disabled={fontPage === totalFontPages}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        →
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// INTERACTIVE ROW COMPONENT
// ----------------------------------------------------------------------
function FontTableRow({
    font,
    categories,
    allTags,
    locale,
    isExpanded,
    onToggleExpand,
    onCollapse,
    onUpdate,
    onDelete,
    onEdit
}: {
    font: FontModel;
    categories: typeof CATEGORIES;
    allTags: string[];
    locale: "en" | "ru";
    isExpanded: boolean;
    onToggleExpand: () => void;
    onCollapse: () => void;
    onUpdate: (font: FontModel) => void;
    onDelete: () => void;
    onEdit: () => void;
}) {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCategory = e.target.value;
        if (newCategory === font.category) return;

        setIsUpdating(true);
        try {
            await FontRepository.update(font.id!, { category: newCategory });
            onUpdate({ ...font, category: newCategory });
        } catch (err) {
            console.error("Failed to update category:", err);
        } finally {
            setIsUpdating(false);
        }
    };

    const toggleTag = async (tag: string) => {
        setIsUpdating(true);
        try {
            const currentTags = font.tags || [];
            let newTags: string[];

            if (currentTags.includes(tag)) {
                newTags = currentTags.filter(t => t !== tag);
            } else {
                newTags = [...currentTags, tag];
            }

            await FontRepository.update(font.id!, { tags: newTags });
            onUpdate({ ...font, tags: newTags });
        } catch (err) {
            console.error("Failed to toggle tag:", err);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleVerifyToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const newVerified = !font.isVerified;
        setIsUpdating(true);
        try {
            await FontRepository.update(font.id!, { isVerified: newVerified });
            onUpdate({ ...font, isVerified: newVerified });
            // If marking as verified, auto-collapse after a brief delay
            if (newVerified) {
                setTimeout(() => onCollapse(), 400);
            }
        } catch (err) {
            console.error("Failed to toggle verified:", err);
        } finally {
            setIsUpdating(false);
        }
    };

    const isVerified = font.isVerified || false;

    return (
        <tr
            className={`transition-all duration-300 border-b border-slate-100 ${isUpdating ? 'opacity-70' : ''
                } ${isVerified && !isExpanded ? 'bg-emerald-50/60 hover:bg-emerald-50' : isExpanded ? 'bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] relative z-10' : 'hover:bg-slate-50/50'
                }`}
        >
            <td colSpan={5} className="p-0">
                {/* COLLAPSED VIEW - Compact and clickable */}
                <div
                    onClick={onToggleExpand}
                    className={`flex items-center px-6 py-4 cursor-pointer transition-all duration-300 ${isExpanded ? 'pb-2' : ''}`}
                >
                    {/* 1. Checkbox + Name & File (Deemphasized) */}
                    <div className="w-[20%] pr-4 flex items-center gap-3">
                        <button
                            onClick={handleVerifyToggle}
                            disabled={isUpdating}
                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${isVerified
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                : 'border-slate-300 hover:border-emerald-400 text-transparent'
                                } disabled:opacity-50`}
                            title={locale === 'ru' ? (isVerified ? 'Снять отметку' : 'Отметить как готовый') : (isVerified ? 'Unverify' : 'Mark as verified')}
                        >
                            {isVerified && (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                        <div className="min-w-0">
                            <div className={`font-semibold transition-colors ${isExpanded ? 'text-turquoise' : isVerified ? 'text-emerald-700' : 'text-slate-800'} flex items-center gap-2 text-sm`}>
                                <span className="truncate">{font.name}</span>
                                {isUpdating && <div className="w-3 h-3 border-2 border-turquoise border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5" title={font.file}>
                                {font.file}
                            </div>
                        </div>
                        {/* Inline Category Dropdown (expanded only) */}
                        {isExpanded && (
                            <select
                                value={font.category}
                                onChange={handleCategoryChange}
                                disabled={isUpdating}
                                onClick={(e) => e.stopPropagation()}
                                className="ml-2 bg-white text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-turquoise/30 hover:border-turquoise/50 cursor-pointer shadow-sm transition-all flex-shrink-0"
                            >
                                {categories.filter(c => c.id !== 'all').map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.label.ru}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* 2. Small Preview (if collapsed) */}
                    <div className="w-[30%] px-4 border-l border-slate-100">
                        {!isExpanded && <FontTablePreview font={font} size="small" />}
                    </div>

                    {/* 3. Category Chip (if collapsed) */}
                    <div className="w-[15%] px-4 border-l border-slate-100">
                        {!isExpanded && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100/50 text-slate-500 whitespace-nowrap">
                                {categories.find(c => c.id === font.category)?.label.ru || font.category}
                            </span>
                        )}
                    </div>

                    {/* 4. Tags Summary (if collapsed) */}
                    <div className="w-[25%] px-4 flex flex-wrap gap-1 border-l border-slate-100">
                        {!isExpanded && (
                            <>
                                {(font.tags || []).slice(0, 3).map(tag => (
                                    <span key={tag} className="px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded text-[10px] font-medium">
                                        {tag}
                                    </span>
                                ))}
                                {(font.tags || []).length > 3 && (
                                    <span className="px-1.5 py-0.5 text-slate-400 text-[10px] font-medium">
                                        +{(font.tags || []).length - 3}
                                    </span>
                                )}
                            </>
                        )}
                    </div>

                    {/* 5. Actions */}
                    <div className="w-[10%] text-right flex justify-end gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            disabled={isUpdating}
                            className="p-1.5 text-slate-300 hover:text-turquoise hover:bg-turquoise/5 rounded-md transition-colors disabled:opacity-50"
                            title="Полное редактирование"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            disabled={isUpdating}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            title="Удалить"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* EXPANDED VIEW - The Workstation */}
                {isExpanded && (
                    <div className="px-6 pb-6 pt-2 bg-gradient-to-b from-white to-slate-50/30 rounded-b-xl border-t border-slate-50 mx-2 mb-2">

                        {/* Huge Primary Preview */}
                        <div className="mb-6 p-6 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-center min-h-[120px]">
                            <FontTablePreview font={font} size="large" />
                        </div>

                        {/* Full-Width Tag Grid */}
                        <div>
                            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                Теги (нажмите для переключения)
                            </label>
                            <div className="flex flex-wrap gap-2.5">
                                {allTags.map(tag => {
                                    const isAssigned = (font.tags || []).includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            disabled={isUpdating}
                                            onClick={(e) => { e.stopPropagation(); toggleTag(tag); }}
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${isAssigned
                                                ? 'bg-teal-600 text-white border-teal-600 shadow-[0_2px_8px_rgba(13,148,136,0.35)] scale-105'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50'
                                                } disabled:opacity-50 disabled:scale-100`}
                                        >
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Close button at bottom */}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={onToggleExpand}
                                className="text-xs font-semibold text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
                            >
                                <span className="rotate-180 mb-0.5">▾</span> {locale === 'ru' ? 'Свернуть карточку' : 'Collapse Card'}
                            </button>
                        </div>
                    </div>
                )}
            </td>
        </tr>
    );
}

// ----------------------------------------------------------------------
// RENDER HELPERS
// ----------------------------------------------------------------------
function FontTablePreview({ font, size = "small" }: { font: FontModel, size?: "small" | "large" }) {
    const [loaded, setLoaded] = useState(false);
    const familyName = `table-preview-${(font.id || '').replace(/[^a-zA-Z0-9]/g, '-')}`;
    const cellRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!cellRef.current) return;
        const observer = new IntersectionObserver(async (entries) => {
            if (entries[0].isIntersecting && !loaded) {
                const styleId = `style-table-${familyName}`;
                if (!document.getElementById(styleId)) {
                    try {
                        // Fetch the font as an ArrayBuffer and use the robust FontFace API
                        const response = await fetch(font.url);
                        if (!response.ok) throw new Error('Fetch failed');
                        const buffer = await response.arrayBuffer();

                        let finalBuffer = buffer;
                        try {
                            const parsedFont = opentype.parse(buffer);
                            if (parsedFont) {
                                const sanitizedBuffer = parsedFont.toArrayBuffer();
                                if (sanitizedBuffer) finalBuffer = sanitizedBuffer;
                            }
                        } catch (e) {
                            // Silently ignore parse errors and proceed with original buffer
                        }

                        try {
                            const fontFace = new FontFace(familyName, finalBuffer);
                            await fontFace.load();
                            document.fonts.add(fontFace);
                            setLoaded(true);
                        } catch (err) {
                            console.warn('FontTablePreview: FontFace load failed, falling back to blob injection', err);
                            const blobUrl = URL.createObjectURL(new Blob([finalBuffer]));
                            const style = document.createElement('style');
                            style.id = styleId;
                            // Omit the format() hint
                            style.innerHTML = `@font-face { font-family: '${familyName}'; src: url('${blobUrl}'); font-display: swap; }`;
                            document.head.appendChild(style);
                            setLoaded(true);
                        }
                    } catch (error) {
                        console.error('Failed to load font preview:', error);
                    }
                } else {
                    setLoaded(true);
                }
                observer.disconnect();
            }
        }, { rootMargin: '100px' });
        observer.observe(cellRef.current);
        return () => observer.disconnect();
    }, [font, familyName, loaded]);

    return (
        <div ref={cellRef} className={`transition-all duration-300 ${size === 'large' ? 'w-full text-center' : 'min-w-[140px]'}`}>
            {loaded ? (
                <span
                    className={`text-slate-800 ${size === 'large' ? 'text-5xl md:text-6xl tracking-tight leading-tight' : 'text-lg'}`}
                    style={{ fontFamily: `'${familyName}', sans-serif` }}
                >
                    {size === 'large' ? font.name : 'Пример Abc'}
                </span>
            ) : (
                <span className={`text-slate-400 italic ${size === 'large' ? 'text-xl' : 'text-xs'}`}>…</span>
            )}
        </div>
    );
}

