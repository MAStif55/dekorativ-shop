import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { uploadFile } from '@/actions/admin-actions';
import { v4 as uuidv4 } from 'uuid';
import { IMAGE_CONFIG } from '@/config/image';

export function useImageProcessor() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const compressImage = useCallback(async (file: File): Promise<File> => {
        try {
            const options = {
                maxSizeMB: IMAGE_CONFIG.maxSizeMB,
                maxWidthOrHeight: IMAGE_CONFIG.maxWidthOrHeight,
                useWebWorker: IMAGE_CONFIG.useWebWorker,
                onProgress: (p: number) => setProgress(p),
            };

            // Add a timeout fallback in case compression still hangs
            const compressionPromise = imageCompression(file, options);
            const timeoutPromise = new Promise<File>((_, reject) => {
                setTimeout(() => reject(new Error('Image compression timed out (15s)')), 15000);
            });

            return await Promise.race([compressionPromise, timeoutPromise]);
        } catch (error) {
            console.error('Error compressing image:', error);
            throw error;
        }
    }, []);

    const uploadImage = useCallback(async (file: File, path: string): Promise<string> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const fullPath = `${path}/${fileName}`;

            const formData = new FormData();
            formData.append('file', file);
            return await uploadFile(fullPath, formData);
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }, []);

    const processAndUpload = useCallback(async (file: File, path: string = 'portfolio'): Promise<string> => {
        setIsProcessing(true);
        setProgress(0);
        try {
            // Compress
            const compressedFile = await compressImage(file);
            // Upload
            const url = await uploadImage(compressedFile, path);
            return url;
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    }, [compressImage, uploadImage]);

    return {
        processAndUpload,
        isProcessing,
        progress,
        compressImage // Exported separately in case manual cropping intercepts upload
    };
}
