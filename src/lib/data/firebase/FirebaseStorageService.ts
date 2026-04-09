import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { IStorageService } from '../interfaces';

export class FirebaseStorageService implements IStorageService {
    async upload(path: string, data: Blob | File | ArrayBuffer, metadata?: Record<string, string>): Promise<string> {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, data, metadata);
        return await getDownloadURL(storageRef);
    }

    async delete(urlOrPath: string): Promise<void> {
        try {
            const storageRef = ref(storage, urlOrPath);
            await deleteObject(storageRef);
        } catch (e) {
            console.warn('Could not delete storage file (non-fatal):', e);
        }
    }

    async getUrl(path: string): Promise<string> {
        const storageRef = ref(storage, path);
        return await getDownloadURL(storageRef);
    }
}
