/**
 * COMPATIBILITY BRIDGE — DO NOT ADD FIREBASE IMPORTS HERE
 * 
 * This file re-exports repository methods under their original function names
 * so that call sites across the app continue to work during the migration.
 * All actual data access is delegated to the Repository layer in @/lib/data.
 * 
 * ZERO Firebase SDK imports in this file — enforced by the Zero-Import Policy.
 */

import {
    ProductRepository,
    OrderRepository,
    CategoryRepository,
    PortfolioRepository,
    FontRepository,
} from '@/lib/data';

import { Product } from '@/types/product';
import { Order } from '@/types/order';
import { Category, SubCategory } from '@/types/category';
import { PortfolioCategory, PortfolioPhoto } from '@/types/portfolio';
import { FontModel } from '@/types/font';

// ── Re-export types ────────────────────────────────────────────
export type { FontModel } from '@/types/font';

// ── Products ───────────────────────────────────────────────────

export async function getAllProducts<T = Product>(): Promise<T[]> {
    return ProductRepository.getAll() as Promise<T[]>;
}

export async function getProductById<T = Product>(id: string): Promise<T | null> {
    return ProductRepository.getById(id) as Promise<T | null>;
}

export async function getProductBySlug<T = Product>(slug: string): Promise<T | null> {
    return ProductRepository.getBySlug(slug) as Promise<T | null>;
}

export async function getProductsByCategory<T = Product>(categorySlug: string): Promise<T[]> {
    return ProductRepository.getByCategory(categorySlug) as Promise<T[]>;
}

export async function getNewestProducts<T = Product>(count?: number): Promise<T[]> {
    return ProductRepository.getNewest(count) as Promise<T[]>;
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<string> {
    return ProductRepository.create(data);
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
    return ProductRepository.update(id, data);
}

export async function deleteProduct(id: string): Promise<void> {
    return ProductRepository.delete(id);
}

export async function bulkUpdateProductPrices(ids: string[], price: number): Promise<void> {
    return ProductRepository.bulkUpdatePrices(ids, price);
}

// ── Orders ─────────────────────────────────────────────────────

export async function getAllOrders<T = Order>(): Promise<T[]> {
    return OrderRepository.getAll() as Promise<T[]>;
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<void> {
    return OrderRepository.update(id, data);
}

// ── Categories ─────────────────────────────────────────────────

export async function getCategories<T = Category>(): Promise<T[]> {
    return CategoryRepository.getAll() as Promise<T[]>;
}

export async function createMainCategory(data: Omit<Category, 'id'>): Promise<string> {
    return CategoryRepository.create(data);
}

export async function updateMainCategory(id: string, data: Partial<Category>): Promise<void> {
    return CategoryRepository.update(id, data);
}

export async function deleteMainCategory(id: string): Promise<void> {
    return CategoryRepository.delete(id);
}

export async function getSubcategories(categorySlug: string): Promise<SubCategory[]> {
    return CategoryRepository.getSubcategories(categorySlug);
}

export async function createSubcategory(data: Omit<SubCategory, 'id'>): Promise<string> {
    return CategoryRepository.createSubcategory(data);
}

export async function deleteSubcategory(id: string): Promise<void> {
    return CategoryRepository.deleteSubcategory(id);
}

export async function updateDocument(collectionName: string, id: string, data: any): Promise<void> {
    // Route to appropriate repository based on collection name
    if (collectionName === 'subcategories') {
        return CategoryRepository.updateSubcategory(id, data);
    }
    if (collectionName === 'categories') {
        return CategoryRepository.update(id, data);
    }
    // Fallback — for any other collections, delegate to category repository's generic method
    return CategoryRepository.update(id, data);
}

export async function bulkUpdateOrder(collectionName: string, updates: { id: string; order: number }[]): Promise<void> {
    // Products use ProductRepository, everything else uses CategoryRepository
    if (collectionName === 'products') {
        return ProductRepository.bulkUpdateOrder(updates);
    }
    return CategoryRepository.bulkUpdateOrder(collectionName, updates);
}

// ── Portfolio ──────────────────────────────────────────────────

export async function getPortfolioCategories(): Promise<PortfolioCategory[]> {
    return PortfolioRepository.getCategories();
}

export async function getPortfolioCategoriesByPage(targetPageId: string): Promise<PortfolioCategory[]> {
    return PortfolioRepository.getCategoriesByPage(targetPageId);
}

export async function getPortfolioCategory(id: string): Promise<PortfolioCategory | null> {
    return PortfolioRepository.getCategory(id);
}

export async function createPortfolioCategory(data: Omit<PortfolioCategory, 'id' | 'createdAt'>): Promise<string> {
    return PortfolioRepository.createCategory(data);
}

export async function updatePortfolioCategory(id: string, data: Partial<PortfolioCategory>): Promise<void> {
    return PortfolioRepository.updateCategory(id, data);
}

export async function deletePortfolioCategory(id: string): Promise<void> {
    return PortfolioRepository.deleteCategory(id);
}

export async function getPortfolioPhotosByCategory(categoryId: string): Promise<PortfolioPhoto[]> {
    return PortfolioRepository.getPhotosByCategory(categoryId);
}

export async function getNewestPortfolioPhotos(count?: number): Promise<PortfolioPhoto[]> {
    return PortfolioRepository.getNewestPhotos(count);
}

export async function createPortfolioPhoto(data: Omit<PortfolioPhoto, 'id' | 'createdAt'>): Promise<string> {
    return PortfolioRepository.createPhoto(data);
}

export async function updatePortfolioPhoto(id: string, data: Partial<PortfolioPhoto>): Promise<void> {
    return PortfolioRepository.updatePhoto(id, data);
}

export async function deletePortfolioPhoto(id: string): Promise<void> {
    return PortfolioRepository.deletePhoto(id);
}

// ── Fonts ──────────────────────────────────────────────────────

export async function getFonts(): Promise<FontModel[]> {
    return FontRepository.getAll();
}

export async function createFont(data: Omit<FontModel, 'id' | 'createdAt'>): Promise<string> {
    return FontRepository.create(data);
}

export async function updateFont(id: string, data: Partial<FontModel>): Promise<void> {
    return FontRepository.update(id, data);
}

export async function deleteFontDoc(id: string): Promise<void> {
    return FontRepository.delete(id);
}
