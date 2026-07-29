import { MetadataRoute } from 'next';
import { ProductRepository, CategoryRepository } from '@/lib/data';
import { Product } from '@/types/product';
import { Category } from '@/types/category';

const BASE_URL = 'https://dekorativ55.ru';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    let productUrls: MetadataRoute.Sitemap = [];
    let categoryUrls: MetadataRoute.Sitemap = [];

    try {
        const products = await ProductRepository.getAll();
        if (products && Array.isArray(products)) {
            productUrls = products.map((product) => ({
                url: `${BASE_URL}/product/${product.slug}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.8,
            }));
        }
    } catch (error) {
        console.warn("sitemap: ProductRepository fetch failed, omitting dynamic products", error);
    }

    try {
        const categories = await CategoryRepository.getAll();
        if (categories && Array.isArray(categories)) {
            categoryUrls = categories.map((cat) => ({
                url: `${BASE_URL}/catalog/${cat.slug}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.85,
            }));
        }
    } catch (error) {
        console.warn("sitemap: CategoryRepository fetch failed, omitting dynamic categories", error);
    }

    return [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${BASE_URL}/catalog`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/shipping`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/faq`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/keyboard-engraving`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/tablichki`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        ...categoryUrls,
        ...productUrls,
    ];
}
