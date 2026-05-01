'use server';

import { requireAuth } from './auth-actions';

import {
    ProductRepository,
    CategoryRepository,
    OrderRepository,
    ReviewRepository,
    SettingsRepository,
    PortfolioRepository,
    FontRepository,
    VariationsRepository,
    StorageService,
} from '@/lib/data';
import { Product, VariationGroup } from '@/types/product';
import { Order } from '@/types/order';
import { Review } from '@/types/review';
import { StoreSettings } from '@/types/settings';
import { SubCategory } from '@/types/category';
import { PortfolioCategory, PortfolioPhoto } from '@/types/portfolio';
import { FontModel } from '@/types/font';

// ==========================================
// PRODUCTS
// ==========================================

export async function createProduct(data: Partial<Product>) {
    await requireAuth();
    return await ProductRepository.create(data as any);
}

export async function updateProduct(id: string, data: Partial<Product>) {
    await requireAuth();
    return await ProductRepository.update(id, data);
}

export async function deleteProduct(id: string) {
    await requireAuth();
    return await ProductRepository.delete(id);
}

export async function bulkUpdatePrices(ids: string[], price: number) {
    await requireAuth();
    return await ProductRepository.bulkUpdatePrices(ids, price);
}

export async function bulkUpdateProductOrder(updates: { id: string; order: number }[]) {
    await requireAuth();
    return await ProductRepository.bulkUpdateOrder(updates);
}

// ==========================================
// CATEGORIES & SUBCATEGORIES
// ==========================================

export async function createCategory(data: any) {
    await requireAuth();
    return await CategoryRepository.create(data);
}

export async function updateCategory(id: string, data: any) {
    await requireAuth();
    return await CategoryRepository.update(id, data);
}

export async function deleteCategory(id: string) {
    await requireAuth();
    return await CategoryRepository.delete(id);
}

export async function createSubcategory(data: Omit<SubCategory, 'id'>) {
    await requireAuth();
    return await CategoryRepository.createSubcategory(data);
}

export async function updateSubcategory(id: string, data: Partial<SubCategory>) {
    await requireAuth();
    return await CategoryRepository.updateSubcategory(id, data);
}

export async function deleteSubcategory(id: string) {
    await requireAuth();
    return await CategoryRepository.deleteSubcategory(id);
}

export async function bulkUpdateCategoryOrder(collectionName: string, updates: { id: string; order: number }[]) {
    await requireAuth();
    return await CategoryRepository.bulkUpdateOrder(collectionName, updates);
}

// ==========================================
// ORDERS
// ==========================================

export async function getAllOrders() {
    await requireAuth();
    return await OrderRepository.getAll();
}

export async function getOrderById(id: string) {
    await requireAuth();
    return await OrderRepository.getById(id);
}

export async function updateOrder(id: string, data: Partial<Order>) {
    await requireAuth();
    return await OrderRepository.update(id, data);
}

// ==========================================
// REVIEWS
// ==========================================

export async function createReview(data: Omit<Review, 'id' | 'createdAt'>) {
    await requireAuth();
    return await ReviewRepository.create(data);
}

export async function updateReview(id: string, data: Partial<Review>) {
    await requireAuth();
    return await ReviewRepository.update(id, data);
}

export async function deleteReview(id: string) {
    await requireAuth();
    return await ReviewRepository.delete(id);
}

// ==========================================
// SETTINGS
// ==========================================

export async function updateSettings(data: Partial<StoreSettings>) {
    await requireAuth();
    return await SettingsRepository.update(data);
}

// ==========================================
// PORTFOLIO
// ==========================================

export async function createPortfolioCategory(data: Omit<PortfolioCategory, 'id' | 'createdAt'>) {
    await requireAuth();
    return await PortfolioRepository.createCategory(data);
}

export async function updatePortfolioCategory(id: string, data: Partial<PortfolioCategory>) {
    await requireAuth();
    return await PortfolioRepository.updateCategory(id, data);
}

export async function deletePortfolioCategory(id: string) {
    await requireAuth();
    return await PortfolioRepository.deleteCategory(id);
}

export async function createPortfolioPhoto(data: Omit<PortfolioPhoto, 'id' | 'createdAt'>) {
    await requireAuth();
    return await PortfolioRepository.createPhoto(data);
}

export async function updatePortfolioPhoto(id: string, data: Partial<PortfolioPhoto>) {
    await requireAuth();
    return await PortfolioRepository.updatePhoto(id, data);
}

export async function deletePortfolioPhoto(id: string) {
    await requireAuth();
    return await PortfolioRepository.deletePhoto(id);
}

// ==========================================
// FONTS
// ==========================================

export async function createFont(data: Omit<FontModel, 'id' | 'createdAt'>) {
    await requireAuth();
    return await FontRepository.create(data);
}

export async function updateFont(id: string, data: Partial<FontModel>) {
    await requireAuth();
    return await FontRepository.update(id, data);
}

export async function deleteFont(id: string) {
    await requireAuth();
    return await FontRepository.delete(id);
}

// ==========================================
// VARIATIONS
// ==========================================

export async function saveCategoryVariations(categorySlug: string, variations: VariationGroup[]) {
    await requireAuth();
    return await VariationsRepository.saveCategoryVariations(categorySlug, variations);
}

// ==========================================
// STORAGE
// Server Actions receive FormData because File objects can't cross the boundary.
// ==========================================

export async function uploadFile(path: string, formData: FormData): Promise<string> {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');
    return await StorageService.upload(path, file);
}

import fs from 'fs';
import pathModule from 'path';

export async function uploadFileBuffer(uploadPath: string, buffer: number[], contentType: string): Promise<string> {
    const uint8 = new Uint8Array(buffer);
    
    // Intercept fonts to automatically build the WOFF2 optimizations and organize in `/fonts/all/`
    if (uploadPath.startsWith('fonts/')) {
        const filename = uploadPath.split('/').pop() || 'font.ttf';
        const newPath = `fonts/all/${filename}`;
        
        // 1. Save original TTF/OTF as fallback
        const finalUrl = await StorageService.upload(newPath, uint8.buffer as ArrayBuffer, { contentType });
        
        // 2. Automatically generate and save WOFF2 compression
        if (filename.match(/\.(ttf|otf)$/i)) {
            try {
                const ttf2woff2 = require('ttf2woff2').default;
                const bufferData = Buffer.from(uint8.buffer as ArrayBuffer);
                const woff2Buffer = ttf2woff2(bufferData);
                const woff2Filename = filename.replace(/\.(ttf|otf)$/i, '.woff2');
                const woff2Path = `fonts/all/${woff2Filename}`;
                
                await StorageService.upload(woff2Path, woff2Buffer, { contentType: 'font/woff2' });
                
                // 3. Register the new WOFF2 inside the native JSON manifest
                const manifestPath = pathModule.join(process.cwd(), 'public', 'fonts', 'woff2-manifest.json');
                if (fs.existsSync(manifestPath)) {
                    const manifestStr = fs.readFileSync(manifestPath, 'utf8');
                    const manifest = JSON.parse(manifestStr);
                    const baseName = filename.replace(/\.(ttf|otf)$/i, '');
                    if (!manifest.woff2_files.includes(baseName)) {
                        manifest.woff2_files.push(baseName);
                        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
                    }
                }
            } catch (err) {
                console.warn('WOFF2 server conversion failed for', filename, '-', err);
            }
        }
        
        return finalUrl;
    }

    return await StorageService.upload(uploadPath, uint8.buffer as ArrayBuffer, { contentType });
}

export async function deleteFile(urlOrPath: string) {
    await requireAuth();
    return await StorageService.delete(urlOrPath);
}
