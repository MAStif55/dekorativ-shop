import { Product, ProductImage } from '@/types/product';
import { Order, OrderItem } from '@/types/order';
import { Category, SubCategory } from '@/types/category';
import { PortfolioCategory, PortfolioPhoto } from '@/types/portfolio';
import { Review } from '@/types/review';
import { StoreSettings } from '@/types/settings';
import { FontModel } from '@/types/font';
import { VariationGroup } from '@/types/product';
import { Customer } from '@/types/customer';

/**
 * Provider-Agnostic Data Access Interfaces
 * 
 * These interfaces define the contract for all data operations.
 * They must NOT import any Firebase types.
 * Concrete implementations live in ./firebase/
 */

// ============================================================================
// PRODUCT REPOSITORY
// ============================================================================

export interface IProductRepository {
    getAll(): Promise<Product[]>;
    getById(id: string): Promise<Product | null>;
    getBySlug(slug: string): Promise<Product | null>;
    getByCategory(categorySlug: string): Promise<Product[]>;
    getNewest(count?: number): Promise<Product[]>;
    create(product: Omit<Product, 'id' | 'createdAt'>): Promise<string>;
    update(id: string, data: Partial<Product>): Promise<void>;
    delete(id: string): Promise<void>;
    bulkUpdatePrices(ids: string[], price: number): Promise<void>;
    bulkUpdateOrder(updates: { id: string; order: number }[]): Promise<void>;
}

// ============================================================================
// ORDER REPOSITORY
// ============================================================================

export interface IOrderRepository {
    getAll(): Promise<Order[]>;
    getById(id: string): Promise<Order | null>;
    create(order: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<string>;
    update(id: string, data: Partial<Order>): Promise<void>;
}

// ============================================================================
// CATEGORY REPOSITORY
// ============================================================================

export interface ICategoryRepository {
    getAll(): Promise<Category[]>;
    create(data: Omit<Category, 'id'>): Promise<string>;
    update(id: string, data: Partial<Category>): Promise<void>;
    delete(id: string): Promise<void>;
    getSubcategories(categorySlug: string): Promise<SubCategory[]>;
    createSubcategory(data: Omit<SubCategory, 'id'>): Promise<string>;
    deleteSubcategory(id: string): Promise<void>;
    updateSubcategory(id: string, data: Partial<SubCategory>): Promise<void>;
    bulkUpdateOrder(collectionName: string, updates: { id: string; order: number }[]): Promise<void>;
}

// ============================================================================
// PORTFOLIO REPOSITORY
// ============================================================================

export interface IPortfolioRepository {
    // Categories
    getCategories(): Promise<PortfolioCategory[]>;
    getCategoriesByPage(targetPageId: string): Promise<PortfolioCategory[]>;
    getCategory(id: string): Promise<PortfolioCategory | null>;
    createCategory(data: Omit<PortfolioCategory, 'id' | 'createdAt'>): Promise<string>;
    updateCategory(id: string, data: Partial<PortfolioCategory>): Promise<void>;
    deleteCategory(id: string): Promise<void>;

    // Photos
    getPhotosByCategory(categoryId: string): Promise<PortfolioPhoto[]>;
    getNewestPhotos(count?: number): Promise<PortfolioPhoto[]>;
    getPhotos(targetPageId?: string): Promise<PortfolioPhoto[]>;
    createPhoto(data: Omit<PortfolioPhoto, 'id' | 'createdAt'>): Promise<string>;
    updatePhoto(id: string, data: Partial<PortfolioPhoto>): Promise<void>;
    deletePhoto(id: string): Promise<void>;
}

// ============================================================================
// REVIEW REPOSITORY
// ============================================================================

export interface IReviewRepository {
    getLatest(count: number): Promise<Review[]>;
    create(data: Omit<Review, 'id' | 'createdAt'>): Promise<string>;
    update(id: string, data: Partial<Review>): Promise<void>;
    delete(id: string): Promise<void>;
    subscribe(callback: (reviews: Review[]) => void): () => void;
}

// ============================================================================
// SETTINGS REPOSITORY
// ============================================================================

export interface ISettingsRepository {
    get(): Promise<StoreSettings>;
    update(settings: Partial<StoreSettings>): Promise<void>;
}

// ============================================================================
// FONT REPOSITORY
// ============================================================================

export interface IFontRepository {
    getAll(): Promise<FontModel[]>;
    create(data: Omit<FontModel, 'id' | 'createdAt'>): Promise<string>;
    update(id: string, data: Partial<FontModel>): Promise<void>;
    delete(id: string): Promise<void>;
}

// ============================================================================
// VARIATIONS REPOSITORY
// ============================================================================

export interface IVariationsRepository {
    getCategoryVariations(categorySlug: string): Promise<VariationGroup[]>;
    saveCategoryVariations(categorySlug: string, variations: VariationGroup[]): Promise<void>;
    getAllCategoryVariations(): Promise<Record<string, VariationGroup[]>>;
}

// ============================================================================
// STORAGE SERVICE
// ============================================================================

export interface IStorageService {
    upload(path: string, data: Blob | File | ArrayBuffer, metadata?: Record<string, string>): Promise<string>;
    delete(urlOrPath: string): Promise<void>;
    getUrl(path: string): Promise<string>;
}

// ============================================================================
// AUTH SERVICE
// ============================================================================

export interface IAuthService {
    onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
    signIn(email: string, password: string): Promise<void>;
    signOut(): Promise<void>;
    getCurrentUser(): AuthUser | null;
    getIdToken(): Promise<string | null>;
}

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
}

// ============================================================================
// CUSTOMER SERVICE
// ============================================================================

export interface ICustomerService {
    getCustomers(): Promise<Customer[]>;
    getCustomerOrders(identifier: string): Promise<Order[]>;
}
