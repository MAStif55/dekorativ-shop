'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/utils/currency';

function PaymentMockContent() {
    const { locale } = useLanguage();
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('orderId');
    const amountStr = searchParams.get('amount');
    
    const [amount, setAmount] = useState(0);
    const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (amountStr) {
            setAmount(Number(amountStr));
        }
    }, [amountStr]);

    const triggerWebhook = async (event: 'payment.succeeded' | 'payment.canceled') => {
        if (!orderId) {
            setError('Missing orderId parameter');
            return;
        }

        setStatus('processing');
        setError(null);

        try {
            const mockPayload = {
                event,
                type: 'notification',
                object: {
                    id: `mock-pay-${Math.random().toString(36).substring(2, 11)}`,
                    status: event === 'payment.succeeded' ? 'succeeded' : 'canceled',
                    amount: {
                        value: amount.toString(),
                        currency: 'RUB',
                    },
                    metadata: {
                        order_id: orderId,
                        is_mock: true,
                    },
                },
            };

            const response = await fetch('/api/webhook/yookassa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mockPayload),
            });

            if (!response.ok) {
                throw new Error('Failed to send webhook');
            }

            setStatus('done');
            
            // Redirect to the payment result page to verify the state
            router.push(`/payment-result?orderId=${orderId}`);
        } catch (err: any) {
            console.error('Mock webhook failed:', err);
            setError(locale === 'ru' ? 'Ошибка отправки тестового платежа' : 'Error sending mock payment');
            setStatus('idle');
        }
    };

    if (!orderId) {
        return (
            <div className="min-h-screen bg-ivory flex items-center justify-center text-red-600 font-semibold">
                Ошибка: Отсутствует параметр orderId.
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-ivory flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden space-y-6">
                {/* Visual Glow */}
                <div className="absolute -top-12 -left-12 w-24 h-24 bg-[#C5A059]/5 rounded-full blur-2xl pointer-events-none"></div>

                {/* YooKassa Logo Mockup */}
                <div className="flex flex-col items-center border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">💳</span>
                        <span className="font-bold text-slate-dark tracking-wider font-ornamental text-xl">ЮKassa</span>
                        <span className="text-[9px] uppercase bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">MOCK TEST</span>
                    </div>
                    <p className="text-xs text-slate/50">Тестовый шлюз для мастерской гравировки</p>
                </div>

                {/* Order Details */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs text-slate">
                        <span>Номер заказа:</span>
                        <span className="font-mono text-slate-dark font-semibold">#{orderId.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate">
                        <span>Описание:</span>
                        <span className="text-right truncate max-w-[200px] text-slate-dark">Гравировка изделий</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                        <span className="text-sm font-semibold text-slate-dark">Сумма к оплате:</span>
                        <span className="text-lg font-bold text-[#C5A059] font-mono">{formatPrice(amount)}</span>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center shadow-sm">
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                    <button
                        onClick={() => triggerWebhook('payment.succeeded')}
                        disabled={status === 'processing' || status === 'done'}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all disabled:opacity-50 text-sm transform hover:-translate-y-0.5"
                    >
                        {status === 'processing' 
                            ? (locale === 'ru' ? 'Обработка...' : 'Processing...') 
                            : (locale === 'ru' ? 'Имитировать успешную оплату (Success)' : 'Simulate Success')}
                    </button>

                    <button
                        onClick={() => triggerWebhook('payment.canceled')}
                        disabled={status === 'processing' || status === 'done'}
                        className="w-full border border-red-200 text-red-600 hover:bg-red-50 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 text-sm transform hover:-translate-y-0.5 shadow-sm"
                    >
                        {locale === 'ru' ? 'Имитировать отмену оплаты (Cancel)' : 'Simulate Cancel'}
                    </button>
                </div>

                <div className="text-[10px] text-slate/40 text-center leading-relaxed">
                    Данный шлюз предназначен исключительно для демонстрации работы.
                    Нажатие на кнопки эмулирует получение вебхука со стороны YooKassa и обновит статус вашего заказа в базе.
                </div>
            </div>
        </main>
    );
}

export default function PaymentMockPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-ivory flex items-center justify-center text-slate">Loading...</div>}>
            <PaymentMockContent />
        </Suspense>
    );
}
