'use client';

import { useState, useRef } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useTranslation } from '@/contexts/LanguageContext';
import { useImageProcessor } from '@/hooks/useImageProcessor';
import { Upload, X, Check, FileImage } from 'lucide-react';
import { createPortfolioPhoto } from '@/lib/firestore-utils';

interface PortfolioPhotoUploaderProps {
    categoryId: string;
    onUploadSuccess: () => void;
}

export default function PortfolioPhotoUploader({ categoryId, onUploadSuccess }: PortfolioPhotoUploaderProps) {
    const { locale } = useTranslation();
    const { processAndUpload, compressImage, isProcessing, progress } = useImageProcessor();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [src, setSrc] = useState('');
    const [crop, setCrop] = useState<Crop>({
        unit: '%',
        width: 100,
        height: 100,
        x: 0,
        y: 0
    });
    const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [originalFile, setOriginalFile] = useState<File | null>(null);

    // SEO Data State (collected before/during upload)
    const [showSeoForm, setShowSeoForm] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState('');
    const [seoData, setSeoData] = useState({
        title: '',
        altText: { en: '', ru: '' },
        description: { en: '', ru: '' },
        keywords: ''
    });
    const [savingDb, setSavingDb] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // 1. Handle File Selection
    const processFile = (file: File) => {
        setUploadError(null);
        setOriginalFile(file);
        const reader = new FileReader();
        reader.addEventListener('load', () => setSrc(reader.result?.toString() || ''));
        reader.readAsDataURL(file);
    };

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    // Drag and Drop handlers
    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    // 2. Extract Cropped Image using Canvas
    const getCroppedImg = async (image: HTMLImageElement, crop: Crop, fileName: string): Promise<File> => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('No 2d context');

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width * scaleX,
            crop.height * scaleY
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob(blob => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                const file = new File([blob], fileName, { type: 'image/jpeg' });
                resolve(file);
            }, 'image/jpeg', 0.95);
        });
    };

    // 3. Confirm Crop & Upload
    const handleCropConfirm = async () => {
        if (!imgRef.current || !originalFile) {
            setUploadError('Ошибка инициализации изображения.');
            return;
        }

        // If user hasn't interacted with crop, use full image dimensions
        const cropToUse: Crop = completedCrop?.width ? completedCrop : {
            unit: 'px',
            x: 0,
            y: 0,
            width: imgRef.current.width,
            height: imgRef.current.height
        };

        setUploadError(null);
        try {
            // Get cropped version
            const croppedFile = await getCroppedImg(imgRef.current, cropToUse, originalFile.name);
            // Upload directly (processAndUpload handles compression internally)
            const url = await processAndUpload(croppedFile, `portfolio/${categoryId}`);

            // Move to SEO step
            setUploadedUrl(url);
            setSrc(''); // Close cropper
            setShowSeoForm(true);
        } catch (error: any) {
            console.error('Crop/Upload failed', error);
            setUploadError(error.message || 'Ошибка обработки изображения. Попробуйте другой файл или формат.');
            setSrc(''); // Reset on hard fail
        }
    };

    // 4. Save to Firestore with SEO
    const handleSaveDatabaseRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingDb(true);
        try {
            await createPortfolioPhoto({
                categoryId,
                imageUrl: uploadedUrl,
                order: 0,
                seo: {
                    title: seoData.title,
                    altText: seoData.altText,
                    description: seoData.description,
                    keywords: seoData.keywords.split(',').map(k => k.trim()).filter(k => k)
                }
            });

            // Reset state
            setShowSeoForm(false);
            setUploadedUrl('');
            setSeoData({ title: '', altText: { en: '', ru: '' }, description: { en: '', ru: '' }, keywords: '' });
            onUploadSuccess();
        } catch (error) {
            console.error('DB Save error', error);
            setUploadError('Ошибка сохранения записи. Попробуйте снова.');
        } finally {
            setSavingDb(false);
        }
    };


    return (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm mb-8">
            <h3 className="text-lg font-bold text-slate-dark mb-4">
                {locale === 'ru' ? 'Загрузить новое фото' : 'Upload New Photo'}
            </h3>

            {uploadError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-medium">
                    {uploadError}
                </div>
            )}

            {/* Step 1: Select File (Drag and Drop) */}
            {!src && !showSeoForm && (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-slate-300 hover:border-primary hover:bg-slate-50'
                        }`}
                >
                    <Upload className={`w-10 h-10 mb-3 transition-colors ${isDragging ? 'text-primary' : 'text-slate-400'}`} />
                    <p className="text-slate-600 font-medium text-center">
                        {locale === 'ru' ? 'Перетащите изображение сюда или ' : 'Drag image here or '}
                        <span className="text-primary underline decoration-primary/30 underline-offset-4">{locale === 'ru' ? 'выберите файл' : 'browse'}</span>
                    </p>
                    <p className="text-sm text-slate-400 mt-2">JPEG, PNG, WebP</p>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={onSelectFile}
                    />
                </div>
            )}

            {/* Step 2: Crop */}
            {src && !isProcessing && (
                <div className="space-y-4">
                    <div className="bg-slate-900 rounded-xl overflow-hidden flex justify-center p-4">
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={undefined} // Free crop, change to e.g. 1 / 1 for square
                        >
                            <img ref={imgRef} src={src} alt="Crop preview" className="max-h-[60vh] object-contain" />
                        </ReactCrop>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setSrc('')}
                            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                        >
                            {locale === 'ru' ? 'Отмена' : 'Cancel'}
                        </button>
                        <button
                            onClick={handleCropConfirm}
                            className="px-4 py-2 bg-primary text-slate-900 font-semibold rounded-lg hover:bg-primary-dark flex items-center gap-2"
                        >
                            <Check size={18} />
                            {locale === 'ru' ? 'Обрезать и загрузить' : 'Crop & Upload'}
                        </button>
                    </div>
                </div>
            )}

            {/* Processing State */}
            {isProcessing && (
                <div className="py-6 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-600 font-medium">
                        {locale === 'ru' ? 'Оптимизация и загрузка...' : 'Optimizing and uploading...'}
                    </p>
                    <div className="w-full max-w-xs bg-slate-100 rounded-full h-2 mt-4">
                        <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}

            {/* Step 3: SEO Data Entry */}
            {showSeoForm && (
                <form onSubmit={handleSaveDatabaseRecord} className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-100">
                        <FileImage className="w-5 h-5" />
                        <span className="font-medium text-sm">
                            {locale === 'ru' ? 'Изображение успешно загружено! Заполните SEO данные.' : 'Image uploaded successfully! Fill in SEO data.'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <img src={uploadedUrl} alt="Preview" className="h-32 rounded-lg object-cover border border-slate-200" />
                        </div>

                        {/* Title */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                {locale === 'ru' ? 'Админ. название (Внутреннее)' : 'Admin Title (Internal)'}
                            </label>
                            <input
                                type="text"
                                required
                                value={seoData.title}
                                onChange={e => setSeoData({ ...seoData, title: e.target.value })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-primary focus:outline-none text-sm"
                            />
                        </div>

                        {/* Alt Text */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Alt Text (RU) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={seoData.altText.ru}
                                onChange={e => setSeoData({ ...seoData, altText: { ...seoData.altText, ru: e.target.value } })}
                                placeholder="Краткое описание того, что на фото"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-primary focus:outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Alt Text (EN) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={seoData.altText.en}
                                onChange={e => setSeoData({ ...seoData, altText: { ...seoData.altText, en: e.target.value } })}
                                placeholder="Brief description of the photo"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-primary focus:outline-none text-sm"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Подпись / Описание (RU)
                            </label>
                            <textarea
                                value={seoData.description.ru}
                                onChange={e => setSeoData({ ...seoData, description: { ...seoData.description, ru: e.target.value } })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-primary focus:outline-none text-sm h-20 resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Caption / Description (EN)
                            </label>
                            <textarea
                                value={seoData.description.en}
                                onChange={e => setSeoData({ ...seoData, description: { ...seoData.description, en: e.target.value } })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-primary focus:outline-none text-sm h-20 resize-none"
                            />
                        </div>

                        {/* Keywords */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                {locale === 'ru' ? 'Ключевые слова (через запятую)' : 'Keywords (comma separated)'}
                            </label>
                            <input
                                type="text"
                                value={seoData.keywords}
                                onChange={e => setSeoData({ ...seoData, keywords: e.target.value })}
                                placeholder="laptop, engraving, macbook keyboard"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-primary focus:outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={savingDb}
                            className="px-6 py-2.5 bg-primary text-slate-900 font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {savingDb ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Check size={18} />
                            )}
                            {locale === 'ru' ? 'Сохранить фото' : 'Save Photo'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
