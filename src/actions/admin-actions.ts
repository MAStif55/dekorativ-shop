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

// ==========================================
// CATEGORIES & SUBCATEGORIES
// ==========================================

// ==========================================
// ORDERS
// ==========================================

export async function getOrderById(id: string) {
    await requireAuth();
    return await OrderRepository.getById(id);
}

export async function updateOrder(id: string, data: Partial<Order>) {
    await requireAuth();
    return await OrderRepository.update(id, data);
}

import { sendEmailOrderApproved } from '@/lib/mailer';

export async function approveOrderAndBill(id: string) {
    await requireAuth();
    const order = await OrderRepository.getById(id);
    if (!order) throw new Error('Order not found');
    
    // In dev or placeholder mode, we use the local mock URL. 
    // This allows the client to complete test payments.
    const domain = process.env.NEXT_PUBLIC_SITE_DOMAIN || 'localhost:3000';
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    const clientOrderUrl = `${protocol}://${domain}/orders/${order.id}`;
    const mockPaymentUrl = `/payment-mock?orderId=${order.id}&amount=${order.total}`;
    
    await OrderRepository.update(id, {
        paymentStatus: 'awaiting_transfer',
        paymentUrl: mockPaymentUrl,
    });
    
    try {
        await sendEmailOrderApproved(order.email, order.id, order.total, clientOrderUrl);
    } catch (err) {
        console.error('Failed to send order approved email:', err);
    }
}

export async function cancelInvoice(id: string) {
    await requireAuth();
    await OrderRepository.update(id, {
        paymentStatus: 'pending',
        paymentUrl: null as any,
    });
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

// ==========================================
// PORTFOLIO
// ==========================================

export async function createPortfolioPhoto(data: Omit<PortfolioPhoto, 'id' | 'createdAt'>) {
    await requireAuth();
    return await PortfolioRepository.createPhoto(data);
}

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

// ==========================================
// STORAGE
// Server Actions receive FormData because File objects can't cross the boundary.
// ==========================================

export async function uploadFile(path: string, formData: FormData): Promise<string> {
    await requireAuth();
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');
    return await StorageService.upload(path, file);
}

import fs from 'fs';
import pathModule from 'path';

export async function uploadFileBuffer(uploadPath: string, buffer: number[], contentType: string): Promise<string> {
    await requireAuth();
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
