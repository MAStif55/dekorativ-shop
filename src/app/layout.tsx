import type { Metadata } from 'next';
import { Lora, Inter } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import ToastContainer from '@/components/Toast';
import CartDrawer from '@/components/CartDrawer';
import { LiveVideoProvider } from '@/contexts/LiveVideoContext';

const lora = Lora({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin', 'cyrillic'],
    display: 'swap',
    variable: '--font-lora',
});

const inter = Inter({
    subsets: ['latin', 'cyrillic'],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata: Metadata = {
    metadataBase: new URL('https://dekorativ.ru'),
    title: {
        default: 'Dekorativ | Декоратив — Интернет-магазин',
        template: '%s | Dekorativ',
    },
    description:
        'Эксклюзивные товары и декор — Exclusive goods and decor.',
    openGraph: {
        type: 'website',
        locale: 'ru_RU',
        siteName: 'Dekorativ — Online Store',
        images: [{ url: '/og-default.png', width: 1200, height: 630 }],
    },
    alternates: {
        canonical: '/',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru" className={`${lora.variable} ${inter.variable}`}>
            <body className={inter.className}>
                <LanguageProvider>
                    <LiveVideoProvider>
                        {children}
                        <CartDrawer />
                        <ToastContainer />
                    </LiveVideoProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}
