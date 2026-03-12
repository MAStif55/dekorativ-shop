export interface PortfolioCategory {
    id: string;
    name: {
        en: string;
        ru: string;
    };
    slug: string;
    description?: {
        en: string;
        ru: string;
    };
    targetPageId: string | null;
    isActive: boolean;
    order: number;
    createdAt: number;
}

export interface PhotoSEO {
    title: string;
    altText: {
        en: string;
        ru: string;
    };
    description: {
        en: string;
        ru: string;
    };
    keywords: string[];
}

export interface PortfolioPhoto {
    id: string;
    categoryId: string;
    imageUrl: string;
    order: number;
    createdAt: number;
    seo: PhotoSEO;
}
