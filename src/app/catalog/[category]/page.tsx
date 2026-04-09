import type { Metadata } from 'next';
import { Category, CategorySlug } from '@/types/category';
import { CategoryRepository } from '@/lib/data';
import CategoryPageContent from './CategoryPageContent';
import { notFound } from 'next/navigation';

// Required for static export with dynamic routes
export async function generateStaticParams() {
    const categories = await CategoryRepository.getAll();
    return categories.map((category) => ({
        category: category.slug,
    }));
}

interface PageProps {
    params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { category } = await params;
    const categories = await CategoryRepository.getAll();
    const cat = categories.find(c => c.slug === category);
    
    if (!cat) {
        return { title: 'Категория не найдена' };
    }
    
    return {
        title: `${cat.title?.ru || ''} — ${cat.title?.en || ''}`,
        description: cat.description?.ru || '',
        alternates: {
            canonical: `/catalog/${category}`,
        },
        openGraph: {
            title: `${cat.title?.ru || ''} | Somanatha`,
            description: cat.description?.en || '',
        },
    };
}

export default async function CategoryPage({ params }: PageProps) {
    const { category } = await params;
    
    // Server-side validation
    const categories = await CategoryRepository.getAll();
    const catExists = categories.some(c => c.slug === category);
    
    if (!catExists) {
        notFound();
    }
    
    return <CategoryPageContent categorySlug={category as CategorySlug} />;
}
