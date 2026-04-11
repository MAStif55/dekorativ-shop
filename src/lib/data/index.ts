/**
 * Dependency Injection Hub — SERVER-ONLY
 * 
 * ⚠️ CRITICAL: This file must NEVER be imported from a 'use client' component.
 * All client components must access data through Server Actions in src/actions/.
 * 
 * Provider toggle via NEXT_PUBLIC_DATA_PROVIDER:
 *   'firebase' (default) — Firebase SDK
 *   'yandex'             — MongoDB + Yandex Object Storage
 */

// ============================================================================
// Firebase Implementations
// ============================================================================
import { FirebaseProductRepository } from './firebase/FirebaseProductRepository';
import { FirebaseOrderRepository } from './firebase/FirebaseOrderRepository';
import { FirebaseCategoryRepository } from './firebase/FirebaseCategoryRepository';
import { FirebasePortfolioRepository } from './firebase/FirebasePortfolioRepository';
import { FirebaseReviewRepository } from './firebase/FirebaseReviewRepository';
import { FirebaseSettingsRepository } from './firebase/FirebaseSettingsRepository';
import { FirebaseFontRepository } from './firebase/FirebaseFontRepository';
import { FirebaseVariationsRepository } from './firebase/FirebaseVariationsRepository';
import { FirebaseStorageService } from './firebase/FirebaseStorageService';
import { FirebaseAuthService } from './firebase/FirebaseAuthService';

// ============================================================================
// Yandex (MongoDB + S3) Implementations
// ============================================================================
import { MongoProductRepository } from './yandex/MongoProductRepository';
import { MongoOrderRepository } from './yandex/MongoOrderRepository';
import { MongoCategoryRepository } from './yandex/MongoCategoryRepository';
import { MongoPortfolioRepository } from './yandex/MongoPortfolioRepository';
import { MongoReviewRepository } from './yandex/MongoReviewRepository';
import { MongoSettingsRepository } from './yandex/MongoSettingsRepository';
import { MongoFontRepository } from './yandex/MongoFontRepository';
import { MongoVariationsRepository } from './yandex/MongoVariationsRepository';
import { S3StorageService } from './yandex/S3StorageService';
import { MongoAuthService } from './yandex/MongoAuthService';

// Re-export interfaces for type-only imports
export type {
    IProductRepository,
    IOrderRepository,
    ICategoryRepository,
    IPortfolioRepository,
    IReviewRepository,
    ISettingsRepository,
    IFontRepository,
    IVariationsRepository,
    IStorageService,
    IAuthService,
    AuthUser,
    ICustomerService,
} from './interfaces';

// ============================================================================
// FACTORY
// ============================================================================

const provider = process.env.NEXT_PUBLIC_DATA_PROVIDER || 'firebase';

function createRepositories() {
    if (provider === 'yandex') {
        console.log('[DataLayer] Using Yandex (MongoDB + S3) provider');
        return {
            ProductRepository: new MongoProductRepository(),
            OrderRepository: new MongoOrderRepository(),
            CategoryRepository: new MongoCategoryRepository(),
            PortfolioRepository: new MongoPortfolioRepository(),
            ReviewRepository: new MongoReviewRepository(),
            SettingsRepository: new MongoSettingsRepository(),
            FontRepository: new MongoFontRepository(),
            VariationsRepository: new MongoVariationsRepository(),
            StorageService: new S3StorageService(),
            AuthService: new MongoAuthService(),
        };
    }

    return {
        ProductRepository: new FirebaseProductRepository(),
        OrderRepository: new FirebaseOrderRepository(),
        CategoryRepository: new FirebaseCategoryRepository(),
        PortfolioRepository: new FirebasePortfolioRepository(),
        ReviewRepository: new FirebaseReviewRepository(),
        SettingsRepository: new FirebaseSettingsRepository(),
        FontRepository: new FirebaseFontRepository(),
        VariationsRepository: new FirebaseVariationsRepository(),
        StorageService: new FirebaseStorageService(),
        AuthService: new FirebaseAuthService(),
    };
}

const repos = createRepositories();

export const ProductRepository = repos.ProductRepository;
export const OrderRepository = repos.OrderRepository;
export const CategoryRepository = repos.CategoryRepository;
export const PortfolioRepository = repos.PortfolioRepository;
export const ReviewRepository = repos.ReviewRepository;
export const SettingsRepository = repos.SettingsRepository;
export const FontRepository = repos.FontRepository;
export const VariationsRepository = repos.VariationsRepository;
export const StorageService = repos.StorageService;
export const AuthService = repos.AuthService;
