'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const { locale } = useLanguage();
    const [status, setStatus] = useState<'verifying' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('missing_token');
            router.push('/cabinet?error=missing_token');
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch('/api/auth/callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    router.push('/cabinet');
                } else {
                    setStatus('error');
                    setErrorMessage(data.error || 'expired');
                    router.push(`/cabinet?error=${data.error || 'expired'}`);
                }
            } catch (err) {
                console.error('Error verifying token:', err);
                setStatus('error');
                setErrorMessage('server_error');
                router.push('/cabinet?error=server_error');
            }
        };

        verifyToken();
    }, [token, router]);

    return (
        <main className="min-h-screen flex flex-col">
            <Header />

            <section className="flex-1 flex items-center justify-center py-16 px-6">
                <div className="max-w-md w-full text-center">
                    <div className="bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-8 shadow-sm space-y-6">
                        {status === 'verifying' ? (
                            <>
                                {/* Gold Spinner */}
                                <div className="w-16 h-16 mx-auto border-4 border-slate-200 border-t-[#C5A059] rounded-full animate-spin" />
                                <h1 className="text-2xl font-ornamental text-slate-dark">
                                    {locale === 'ru' ? 'Выполняется вход...' : 'Verifying link...'}
                                </h1>
                                <p className="text-slate text-sm">
                                    {locale === 'ru' 
                                        ? 'Пожалуйста, подождите. Мы подтверждаем вашу ссылку для входа.' 
                                        : 'Please wait. We are validating your sign-in link.'}
                                </p>
                            </>
                        ) : (
                            <>
                                {/* Error Icon */}
                                <div className="w-16 h-16 mx-auto bg-red-50 border border-red-200 rounded-full flex items-center justify-center text-red-600 text-2xl font-bold">
                                    ✕
                                </div>
                                <h1 className="text-2xl font-ornamental text-red-600">
                                    {locale === 'ru' ? 'Ошибка входа' : 'Verification Failed'}
                                </h1>
                                <p className="text-slate text-sm">
                                    {locale === 'ru'
                                        ? 'Ссылка недействительна или срок её действия истёк. Перенаправляем на страницу входа...'
                                        : 'The link is invalid or has expired. Redirecting to login page...'}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}

export default function CabinetVerifyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate">Loading...</div>}>
            <VerifyContent />
        </Suspense>
    );
}
