import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/admin/',
                '/cart/',
                '/checkout/',
                '/order-success/',
                '/api/',
                '/privacy/',
                '/terms/',
                '/offer/',
            ],
        },
        sitemap: 'https://dekorativ55.ru/sitemap.xml',
    };
}

