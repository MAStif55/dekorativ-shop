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
        console.error("Error generating static params for products:", error);
        return [{ slug: 'dummy-product' }];
    }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    try {
        const product = await ProductRepository.getBySlug(params.slug);

        if (!product) {
            return {
                title: 'Товар не найден | Dekorativ',
                description: 'Запрашиваемый товар не найден.',
            };
        }

        // Use Russian as primary (main audience), English as fallback
        const titleRu = product.title?.ru || product.title?.en || 'Эксклюзивный декор';
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
    } catch (error) {
        return {
            title: 'Товар | Dekorativ',
            description: 'Мастерская по гравировке и изготовлению декоративной продукции Dekorativ',
        };
    }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
    let product = null;
    let jsonLd = null;

    try {
        product = await ProductRepository.getBySlug(params.slug);

        if (product) {
            const title = product.title?.ru || product.title?.en || 'Эксклюзивный декор';
            const description = product.description?.ru
                ? product.description.ru.replace(/<[^>]*>/g, '')
                : 'Премиум декор и гравировка';

            jsonLd = {
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: title,
                image: product.images?.map(img => getImageUrl(img)) || [],
                description: description,
                sku: product.id,
                brand: {
                    '@type': 'Brand',
                    name: 'Dekorativ',
                },
                offers: {
                    '@type': 'Offer',
                    price: product.basePrice,
                    priceCurrency: 'RUB',
                    availability: product.status !== 'OUT_OF_STOCK' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                    url: `https://dekorativ55.ru/product/${params.slug}`,
                },
            };
        }
    } catch (error) {
        console.warn("ProductPage server fetch error (proceeding to client component):", error);
    }

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <ProductDetailsContent initialProduct={product} />
        </>
    );
}
