/**
 * Centralized image compression configuration.
 * Used by ImageUpload and useImageProcessor for consistent optimization.
 */
export const IMAGE_CONFIG = {
    /** Maximum file size after compression (MB) */
    maxSizeMB: 1,
    /** Maximum width or height in pixels */
    maxWidthOrHeight: 1920,
    /** Use Web Workers for non-blocking compression */
    useWebWorker: true,
} as const;
