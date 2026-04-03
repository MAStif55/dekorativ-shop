'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Loader2, Film, X, Play, Pause, Scissors, Crop as CropIcon, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import Cropper, { Area } from 'react-easy-crop';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface VideoUploadProps {
    value?: string;
    onChange: (result: { videoUrl: string; videoPreviewUrl: string }) => void;
    storagePath?: string;
}

export default function VideoUpload({
    value = '',
    onChange,
    storagePath = 'videos'
}: VideoUploadProps) {
    const { locale } = useLanguage();

    // Core State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [originalVideoUrl, setOriginalVideoUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(value);
    const [dragOver, setDragOver] = useState(false);

    // Processing State
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    // Trimming State
    const [startTime, setStartTime] = useState<number>(0);
    const [endTime, setEndTime] = useState<number>(10);
    const [videoDuration, setVideoDuration] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Storyboard State
    const THUMB_COUNT = 8;
    const [thumbnails, setThumbnails] = useState<string[]>([]);

    // Cropping State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspectRatio, setAspectRatio] = useState<number>(1); // Square by default for product cards
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    // Replace State
    const [isReplacing, setIsReplacing] = useState(false);
    const replaceVideoInputRef = useRef<HTMLInputElement>(null);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const ffmpegRef = useRef(new FFmpeg());

    useEffect(() => {
        setPreviewUrl(value);
    }, [value]);

    // Generate thumbnails for the timeline
    const generateThumbnails = async (videoNode: HTMLVideoElement, duration: number) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;
        const thumbs: string[] = [];
        const interval = duration / THUMB_COUNT;

        canvas.width = 160;
        canvas.height = 90;

        const originalTime = videoNode.currentTime;
        const wasPlaying = !videoNode.paused;
        if (wasPlaying) videoNode.pause();

        for (let i = 0; i < THUMB_COUNT; i++) {
            videoNode.currentTime = i * interval;

            await new Promise<void>((resolve) => {
                const onSeeked = () => {
                    videoNode.removeEventListener('seeked', onSeeked);
                    resolve();
                };
                videoNode.addEventListener('seeked', onSeeked);
            });
            context.drawImage(videoNode, 0, 0, canvas.width, canvas.height);
            thumbs.push(canvas.toDataURL('image/jpeg', 0.5));
        }

        videoNode.currentTime = originalTime;
        if (wasPlaying) videoNode.play().catch(() => { });

        setThumbnails(thumbs);
    };

    // Handle initial video metadata load for the hidden trimming reference
    const handleLoadedMetadata = async () => {
        if (videoRef.current) {
            const vidDuration = videoRef.current.duration;
            setVideoDuration(vidDuration);
            setEndTime(Math.min(10, vidDuration)); // Default trim to max 10 seconds
            await generateThumbnails(videoRef.current, vidDuration);
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.currentTime = startTime;
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // Keep the video playing within the trimmed range (for preview)
    const handleTimeUpdate = () => {
        if (videoRef.current && isPlaying) {
            if (videoRef.current.currentTime >= endTime) {
                videoRef.current.currentTime = startTime;
            }
        }
    };

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('video/')) {
            alert(locale === 'ru' ? 'Пожалуйста, выберите видео' : 'Please select a video file');
            return;
        }

        // Limit to 50MB
        if (file.size > 50 * 1024 * 1024) {
            alert(locale === 'ru' ? 'Файл слишком большой (макс 50МБ)' : 'File too large (max 50MB)');
            return;
        }

        setSelectedFile(file);
        const objectUrl = URL.createObjectURL(file);
        setOriginalVideoUrl(objectUrl);
        setStartTime(0);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
        setThumbnails([]);
    };

    // Load FFmpeg WebAssembly
    const loadFFmpeg = async () => {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        const ffmpeg = ffmpegRef.current;

        if (ffmpeg.loaded) return;

        ffmpeg.on('progress', ({ progress: p }) => {
            setProgress(Math.round(p * 100));
        });

        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    };

    const processAndUpload = async () => {
        if (!selectedFile || !originalVideoUrl) return;

        const duration = endTime - startTime;
        if (duration <= 0 || duration > 30) {
            alert(locale === 'ru' ? 'Недопустимая длительность. Макс 30 сек.' : 'Invalid duration. Max 30s allowed.');
            return;
        }

        setProcessing(true);
        setUploading(true);
        setProgress(0);

        try {
            await loadFFmpeg();
            const ffmpeg = ffmpegRef.current;

            // Generate valid input extension
            const ext = selectedFile.name.split('.').pop()?.toLowerCase() || 'mp4';
            const inputName = `input.${ext}`;

            // Write file to in-memory filesystem
            await ffmpeg.writeFile(inputName, await fetchFile(selectedFile));

            // Build base filter chain
            const baseFilters: string[] = [];
            if (croppedAreaPixels) {
                const { width, height, x, y } = croppedAreaPixels;
                const w = Math.round(width);
                const h = Math.round(height);
                const cx = Math.max(0, Math.round(x));
                const cy = Math.max(0, Math.round(y));
                baseFilters.push(`crop=${w}:${h}:${cx}:${cy}`);
            }

            const videoMetadata = {
                contentType: 'video/mp4',
                cacheControl: 'public, max-age=31536000, immutable',
            };

            // --- Variant 1: Preview (480p, CRF 30, for card hover) ---
            const previewFilters = [...baseFilters, `scale='min(854,iw)':'min(480,ih)':force_original_aspect_ratio=decrease`];
            const previewArgs = [
                '-ss', startTime.toString(),
                '-i', inputName,
                '-t', duration.toString(),
                '-vf', previewFilters.join(','),
                '-c:v', 'libx264', '-crf', '30', '-preset', 'fast',
                '-an', '-movflags', '+faststart',
                '-y', 'preview.mp4'
            ];
            await ffmpeg.exec(previewArgs);

            // --- Variant 2: Full (720p, CRF 24, for PDP) ---
            const fullFilters = [...baseFilters, `scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease`];
            const fullArgs = [
                '-ss', startTime.toString(),
                '-i', inputName,
                '-t', duration.toString(),
                '-vf', fullFilters.join(','),
                '-c:v', 'libx264', '-crf', '24', '-preset', 'fast',
                '-an', '-movflags', '+faststart',
                '-y', 'full.mp4'
            ];
            await ffmpeg.exec(fullArgs);

            // Read both outputs
            const previewData = await ffmpeg.readFile('preview.mp4');
            const fullData = await ffmpeg.readFile('full.mp4');
            const previewBlob = new Blob([previewData as any], { type: 'video/mp4' });
            const fullBlob = new Blob([fullData as any], { type: 'video/mp4' });

            // Clean up in-memory files
            await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile('preview.mp4');
            await ffmpeg.deleteFile('full.mp4');

            // Upload both variants
            const timestamp = Date.now();
            const previewRef = ref(storage, `${storagePath}/${timestamp}_preview.mp4`);
            const fullRef = ref(storage, `${storagePath}/${timestamp}_full.mp4`);

            await Promise.all([
                uploadBytes(previewRef, previewBlob, videoMetadata),
                uploadBytes(fullRef, fullBlob, videoMetadata),
            ]);

            const [videoPreviewUrl, videoUrl] = await Promise.all([
                getDownloadURL(previewRef),
                getDownloadURL(fullRef),
            ]);

            // Delete previous video from Storage if replacing
            if (previewUrl) {
                try {
                    const prevRef = ref(storage, previewUrl);
                    await deleteObject(prevRef);
                } catch (e) {
                    console.warn('Could not delete previous video:', e);
                }
            }

            // Update UI/Form with both URLs
            setPreviewUrl(videoPreviewUrl);
            onChange({ videoUrl, videoPreviewUrl });

            // Reset Editor
            URL.revokeObjectURL(originalVideoUrl);
            setOriginalVideoUrl(null);
            setSelectedFile(null);

        } catch (error: any) {
            console.error("FFmpeg Processing error:", error);
            alert((locale === 'ru' ? 'Ошибка обработки: ' : 'Processing error: ') + error.message);
        } finally {
            setProcessing(false);
            setUploading(false);
            setProgress(0);
        }
    };

    const clearVideo = async () => {
        // Delete video from Firebase Storage
        if (previewUrl) {
            try {
                const prevRef = ref(storage, previewUrl);
                await deleteObject(prevRef);
            } catch (e) {
                console.warn('Could not delete video from storage:', e);
            }
        }
        if (originalVideoUrl) {
            URL.revokeObjectURL(originalVideoUrl);
        }
        setOriginalVideoUrl(null);
        setSelectedFile(null);
        setPreviewUrl('');
        onChange({ videoUrl: '', videoPreviewUrl: '' });
        setStartTime(0);
        setEndTime(10);
        setZoom(1);
        setThumbnails([]);
    };

    const cancelEditing = () => {
        if (originalVideoUrl) {
            URL.revokeObjectURL(originalVideoUrl);
        }
        setOriginalVideoUrl(null);
        setSelectedFile(null);
        setStartTime(0);
        setEndTime(10);
        setZoom(1);
        setThumbnails([]);
    }

    return (
        <div className="space-y-4">
            {/* Display Final Processed Video */}
            {previewUrl && !originalVideoUrl && (
                <div className="relative bg-gray-50 border border-gray-200 rounded-lg overflow-hidden p-4 flex flex-col items-center">
                    <div className="w-full max-w-sm aspect-square bg-black rounded-lg overflow-hidden relative shadow-md">
                        <video
                            src={previewUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="mt-4 flex items-center justify-between w-full">
                        <div className="text-sm font-medium text-green-600 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            {locale === 'ru' ? 'Live-видео готово (Выбрано)' : 'Live Video ready (Selected)'}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Replace Video — opens file picker, keeps trim/crop editor */}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsReplacing(true);
                                    replaceVideoInputRef.current?.click();
                                }}
                                className="px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded transition-colors flex items-center gap-1"
                                title={locale === 'ru' ? 'Заменить видео' : 'Replace video'}
                            >
                                <RefreshCw size={16} />
                                {locale === 'ru' ? 'Заменить' : 'Replace'}
                            </button>
                            <button
                                type="button"
                                onClick={clearVideo}
                                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
                            >
                                <X size={16} />
                                {locale === 'ru' ? 'Удалить' : 'Remove'}
                            </button>
                        </div>
                    </div>

                    {/* Hidden file input for replace flow */}
                    <input
                        ref={replaceVideoInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                handleFileSelect(e.target.files[0]);
                            }
                            e.target.value = '';
                            setIsReplacing(false);
                        }}
                    />
                </div>
            )}

            {/* Editing / Trimming / Cropping Interface */}
            {originalVideoUrl && (
                <div className="bg-gray-50 border rounded-lg overflow-hidden p-6 space-y-6">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                            <CropIcon size={20} className="text-blue-600" />
                            {locale === 'ru' ? 'Кадрирование и обрезка' : 'Crop & Trim Video'}
                        </h4>
                        <button type="button" onClick={cancelEditing} className="text-gray-400 hover:text-red-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="w-full max-w-md mx-auto aspect-square bg-black rounded-lg overflow-hidden relative shadow-inner">
                        <Cropper
                            video={originalVideoUrl}
                            crop={crop}
                            zoom={zoom}
                            aspect={aspectRatio}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={(_croppedArea, pixels) => setCroppedAreaPixels(pixels)}
                            showGrid={false}
                        />
                        {/* Hidden video purely for seeking and playing the file since Cropper manages its own element */}
                        <video
                            ref={videoRef}
                            src={originalVideoUrl}
                            onLoadedMetadata={handleLoadedMetadata}
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={() => setIsPlaying(false)}
                            className="hidden"
                            muted
                            playsInline
                        />
                        {/* Play Overlay over crop area */}
                        <button
                            type="button"
                            onClick={togglePlay}
                            className="absolute bottom-4 left-4 z-50 w-10 h-10 rounded-full bg-white/90 shadow-lg text-gray-900 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                        >
                            {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-0.5" />}
                        </button>
                    </div>

                    <div className="space-y-4 max-w-lg mx-auto bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-gray-700 w-16">{locale === 'ru' ? 'Масштаб' : 'Zoom'}</label>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        {/* Timeline Storyboard Slider */}
                        <div className="mt-6 space-y-2">
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                {locale === 'ru' ? 'Временная шкала обрезки' : 'Trim Timeline'}
                            </label>

                            <div className="relative rounded-lg overflow-hidden border border-gray-200">
                                {/* 1. Underlying Filmstrip Background */}
                                <div className="flex w-full h-12 bg-black">
                                    {thumbnails.map((thumb, idx) => (
                                        <div
                                            key={idx}
                                            className="flex-1 h-full bg-cover bg-center border-r border-[#ffffff20]"
                                            style={{ backgroundImage: `url(${thumb})` }}
                                        />
                                    ))}
                                    {thumbnails.length === 0 && (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                                            {locale === 'ru' ? 'Загрузка раскадровки...' : 'Loading storyboard...'}
                                        </div>
                                    )}
                                </div>

                                {/* 2. RC Slider Overlay */}
                                <div className="absolute inset-x-0 bottom-0 h-full flex items-center px-1">
                                    <Slider
                                        range
                                        min={0}
                                        max={videoDuration || 10}
                                        step={0.1}
                                        value={[startTime, endTime]}
                                        onChange={(val) => {
                                            const [newStart, newEnd] = val as number[];
                                            setStartTime(newStart);
                                            setEndTime(newEnd);

                                            // Live scrub the main preview video
                                            if (videoRef.current) {
                                                if (Math.abs(newStart - startTime) > 0.05) videoRef.current.currentTime = newStart;
                                                else if (Math.abs(newEnd - endTime) > 0.05) videoRef.current.currentTime = newEnd;
                                            }
                                        }}
                                        trackStyle={[{ backgroundColor: 'transparent' }]}
                                        handleStyle={[
                                            { backgroundColor: '#3b82f6', borderColor: '#2563eb', opacity: 1 },
                                            { backgroundColor: '#3b82f6', borderColor: '#2563eb', opacity: 1 }
                                        ]}
                                        railStyle={{ backgroundColor: 'transparent' }}
                                    />

                                    {/* 3. Shadowed Unselected Bounds */}
                                    {videoDuration > 0 && (
                                        <>
                                            <div className="absolute top-0 bottom-0 left-0 bg-black/60 pointer-events-none z-0" style={{ width: `${(startTime / videoDuration) * 100}%` }} />
                                            <div className="absolute top-0 bottom-0 right-0 bg-black/60 pointer-events-none z-0" style={{ width: `${(1 - endTime / videoDuration) * 100}%` }} />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-gray-500 flex items-center justify-between">
                            <span>{locale === 'ru' ? 'Длительность видео:' : 'Video Duration:'} {videoDuration.toFixed(1)}s</span>
                            <span className="font-semibold text-blue-600">
                                {locale === 'ru' ? 'Выбрано:' : 'Selected:'} {(endTime - startTime).toFixed(1)}s
                            </span>
                        </div>

                        <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg flex items-start gap-2 mt-4">
                            <Scissors size={18} className="mt-0.5 flex-shrink-0" />
                            <p>
                                {locale === 'ru'
                                    ? `Браузер кадрирует и обрежет видео до ${(endTime - startTime).toFixed(1)} сек, затем сожмет и подготовит для веба перед загрузкой.`
                                    : `Browser will crop & trim the video to ${(endTime - startTime).toFixed(1)}s, then compress for web automatically before uploading.`}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={processAndUpload}
                            disabled={processing}
                            className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 relative overflow-hidden"
                        >
                            {processing ? (
                                <>
                                    <div
                                        className="absolute inset-0 bg-blue-800/20 transition-all duration-300 pointer-events-none"
                                        style={{ width: `${progress}%` }}
                                    />
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>
                                        {locale === 'ru' ? 'Обработка' : 'Processing'} {progress > 0 ? `(${progress}%)` : '...'}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <CropIcon size={20} />
                                    <span>{locale === 'ru' ? 'Кадрировать и Загрузить' : 'Crop and Upload'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Upload Zone */}
            {!previewUrl && !originalVideoUrl && (
                <label
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
                    }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    className={`flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                        }`}
                >
                    <Film className={`mb-2 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} size={32} />
                    <span className="text-sm text-gray-500 font-medium text-center px-4">
                        {dragOver
                            ? (locale === 'ru' ? 'Отпустите для загрузки' : 'Drop to upload')
                            : (locale === 'ru' ? 'Загрузить Live-видео (до 50МБ)' : 'Upload Live Video (up to 50MB)')}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                        {locale === 'ru' ? 'Выберите видео для кадрирования' : 'Select a video to crop & trim'}
                    </span>
                    <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                            e.target.value = ''; // Reset input to allow re-selection
                        }}
                    />
                </label>
            )}
        </div>
    );
}
