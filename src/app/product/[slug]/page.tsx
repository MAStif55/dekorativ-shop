import type { Metadata } from 'next';
import ProductDetailsContent from './ProductDetailsContent';
import { ProductRepository } from '@/lib/data';
import { Product, getImageUrl } from '@/types/product';

// Ensure this page is statically generated
export const dynamic = 'force-static';

// Allow Next.js to dynamically generate static pages for missing params at runtime
// This is necessary since we start with an empty database but `output: export` demands paths.
export const dynamicParams = true;

export async function generateStaticParams() {
    try {
        const products = await ProductRepository.getAll();

        if (!products || products.length === 0) {
            // Next.js static export requires at least one parameter if the function is defined
            // Returning a dummy path allows the build to succeed.
            return [{ slug: 'dummy-product' }];
        }

        return products.map((product) => ({
            slug: product.slug,
        }));
    } catch (error) {
        console.error("Error generating static params:", error);
        return [];
    }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const product = await ProductRepository.getBySlug(params.slug);

    if (!product) {
        return {
            title: 'Товар не найден | Dekorativ',
            description: 'Запрашиваемый товар не найден.',
        };
    }

    // Use Russian as primary (main audience), English as fallback
    const titleRu = product.title?.ru || product.title?.en || 'Эксклюзивный декор';
    const titleEn = product.title?.en || product.title?.ru || 'Exclusive Decor';
    const descriptionRu = product.description?.ru
        ? product.description.ru.slice(0, 160).replace(/<[^>]*>/g, '').replace(/\n/g, ' ') + '...'
        : `${titleRu} — Эксклюзивный декор для вашего интерьера.`;

    return {
        title: `${titleRu} | Dekorativ Store`,
        description: descriptionRu,
        alternates: {
            canonical: `/product/${params.slug}`,
        },
        openGraph: {
            title: `${titleRu} | Dekorativ`,
            description: descriptionRu,
            images: product.images?.[0] ? [getImageUrl(product.images[0])] : [],
        },
    };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
    // Fetch product data for JSON-LD (server-side)
    // We try to fetch it here to generate the JSON-LD script. 
    // The client component will re-fetch or we could pass it down, 
    // but to keep architecture simple for now we just fetch for SEO here.
    const product = await ProductRepository.getBySlug(params.slug);

    let jsonLd = null;
    if (product) {
        const title = product.title?.en || 'Exclusive Decor';
        const description = product.description?.en
            ? product.description.en.replace(/<[^>]*>/g, '')
            : 'Premium Interior Decor';

        jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: title,
            image: product.images || [],
            description: description,
            sku: product.id,
            offers: {
                '@type': 'Offer',
                price: product.basePrice,
                priceCurrency: 'USD', // Assuming USD based on previous context, verify if needed
                availability: 'https://schema.org/InStock',
            },
        };
    }

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {/* 
              Pass the initial data to avoid double fetch.
            */}
            <ProductDetailsContent initialProduct={product} />
        </>
    );
}
