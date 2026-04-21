import { IStorageService } from '../interfaces';
import fs from 'fs';
import path from 'path';

// ============================================================================
// LOCAL STORAGE SERVICE (Fallback when S3 is inactive)
// Writes files directly to `public/` natively so they are served by Next.js
// ============================================================================

export class LocalStorageService implements IStorageService {
    async upload(filePath: string, data: Blob | File | ArrayBuffer, metadata?: Record<string, string>): Promise<string> {
        const buffer = data instanceof ArrayBuffer
            ? Buffer.from(data)
            : Buffer.from(await (data as Blob).arrayBuffer());

        const absolutePath = path.join(process.cwd(), 'public', filePath);
        const dir = path.dirname(absolutePath);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(absolutePath, buffer);

        // Natively return the absolute URL path that Next.js serves
        return filePath.startsWith('/') ? filePath : `/${filePath}`;
    }

    async delete(urlOrPath: string): Promise<void> {
        try {
            // Strip leading slashes to cleanly map to public/
            let cleanPath = urlOrPath;
            if (cleanPath.startsWith('http')) {
                const url = new URL(cleanPath);
                cleanPath = url.pathname;
            }
            if (cleanPath.startsWith('/')) {
                cleanPath = cleanPath.slice(1);
            }
            
            const absolutePath = path.join(process.cwd(), 'public', cleanPath);
            
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
            }
        } catch (error) {
            console.warn('Could not delete file locally (non-fatal):', error);
        }
    }

    async getUrl(filePath: string): Promise<string> {
        return filePath.startsWith('/') ? filePath : `/${filePath}`;
    }
}
