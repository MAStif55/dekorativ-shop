import type { Metadata } from 'next';
import { Category, CategorySlug } from '@/types/category';
import { CategoryRepository } from '@/lib/data';
import CategoryPageContent from './CategoryPageContent';
import { notFound } from 'next/navigation';

// Required for static export with dynamic routes
export async function generateStaticParams() {
    try {
        const categories = await CategoryRepository.getAll();
        if (!categories || categories.length === 0) {
            return [{ category: 'all' }];
        }
        return categories.map((category) => ({
            category: category.slug,
        }));
    } catch (error) {
        console.error("Error generating static params for catalog:", error);
        return [{ category: 'all' }];
    }
}

interface PageProps {
    params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    try {
        const { category } = await params;
        const categories = await CategoryRepository.getAll();
        const cat = categories?.find(c => c.slug === category);
        
        if (!cat) {
            return { title: 'Категория не найдена | Dekorativ' };
        }
        
        return {
            title: `${cat.title?.ru || cat.title?.en || 'Категория'} | Dekorativ`,
            description: cat.description?.ru || cat.description?.en || '',
            alternates: {
                canonical: `/catalog/${category}`,
            },
            openGraph: {
                title: `${cat.title?.ru || cat.title?.en || ''} | Dekorativ`,
                description: cat.description?.ru || cat.description?.en || '',
            },
        };
    } catch (error) {
        return {
            title: 'Каталог товаров | Dekorativ',
            description: 'Каталог гравировки и декоративной продукции Dekorativ',
        };
    }
}

export default async function CategoryPage({ params }: PageProps) {
    const { category } = await params;
    
    try {
        const categories = await CategoryRepository.getAll();
        const catExists = categories?.some(c => c.slug === category);
        
        if (categories && categories.length > 0 && !catExists) {
            notFound();
        }
    } catch (error) {
        console.warn("CategoryPage DB fetch error (proceeding to client-side rendering):", error);
    }
    
    return <CategoryPageContent categorySlug={category as CategorySlug} />;
}
