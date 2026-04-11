import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { IStorageService } from '../interfaces';

// ============================================================================
// YANDEX OBJECT STORAGE (S3-COMPATIBLE)
// Per playbook: uses storage.yandexcloud.net endpoint
// ============================================================================

const BUCKET_NAME = process.env.YC_S3_BUCKET || 'dekorativ-media';
const REGION = process.env.YC_S3_REGION || 'ru-central1';
const ENDPOINT = process.env.YC_S3_ENDPOINT || 'https://storage.yandexcloud.net';

const s3Client = new S3Client({
    region: REGION,
    endpoint: ENDPOINT,
    credentials: {
        accessKeyId: process.env.YC_S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.YC_S3_SECRET_ACCESS_KEY || '',
    },
});

export class S3StorageService implements IStorageService {

    async upload(path: string, data: Blob | File | ArrayBuffer, metadata?: Record<string, string>): Promise<string> {
        const buffer = data instanceof ArrayBuffer
            ? Buffer.from(data)
            : Buffer.from(await (data as Blob).arrayBuffer());

        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: path,
            Body: buffer,
            ContentType: metadata?.contentType || (data as File)?.type || 'application/octet-stream',
        }));

        // Return the public URL (Playbook §4.B: use encodeURI for Cyrillic safety)
        return `${ENDPOINT}/${BUCKET_NAME}/${path}`;
    }

    async delete(urlOrPath: string): Promise<void> {
        try {
            let key = urlOrPath;
            if (urlOrPath.startsWith('http')) {
                const url = new URL(urlOrPath);
                key = url.pathname.startsWith(`/${BUCKET_NAME}/`)
                    ? url.pathname.slice(`/${BUCKET_NAME}/`.length)
                    : url.pathname.slice(1);
            }

            await s3Client.send(new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            }));
        } catch (error) {
            console.warn('Could not delete file from S3 (non-fatal):', error);
        }
    }

    async getUrl(path: string): Promise<string> {
        // For public bucket, just construct the URL directly
        return `${ENDPOINT}/${BUCKET_NAME}/${path}`;
    }
}
