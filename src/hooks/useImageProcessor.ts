import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { app } from '@/lib/firebase';

const storage = getStorage(app);

export function useImageProcessor() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const compressImage = async (file: File, maxSizeMB: number = 0.5): Promise<File> => {
        try {
            const options = {
                maxSizeMB,
                maxWidthOrHeight: 1920,
                useWebWorker: false, // Web Workers can silently fail and hang in Next.js static exports
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
    };

    const uploadImage = async (file: File, path: string): Promise<string> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const fullPath = `${path}/${fileName}`;
            const storageRef = ref(storage, fullPath);

            await uploadBytes(storageRef, file);
            return await getDownloadURL(storageRef);
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    };

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
    }, []);

    return {
        processAndUpload,
        isProcessing,
        progress,
        compressImage // Exported separately in case manual cropping intercepts upload
    };
}
