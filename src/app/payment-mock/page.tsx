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
            <div className="min-h-screen bg-[#0D0A0B] flex items-center justify-center text-red-400">
                Ошибка: Отсутствует параметр orderId.
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0D0A0B] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#1A1517] border-2 border-[#C9A227]/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
                {/* Visual Glow */}
                <div className="absolute -top-12 -left-12 w-24 h-24 bg-[#C9A227]/10 rounded-full blur-2xl pointer-events-none"></div>

                {/* YooKassa Logo Mockup */}
                <div className="flex flex-col items-center border-b border-[#C9A227]/20 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">💳</span>
                        <span className="font-bold text-[#E8D48B] tracking-wider font-ornamental text-xl">ЮKassa</span>
                        <span className="text-[9px] uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded font-mono font-bold">MOCK TEST</span>
                    </div>
                    <p className="text-xs text-[#F5ECD7]/40">Тестовый шлюз для мастерской гравировки</p>
                </div>

                {/* Order Details */}
                <div className="bg-[#0D0A0B] border border-[#C9A227]/20 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs text-[#F5ECD7]/60">
                        <span>Номер заказа:</span>
                        <span className="font-mono text-[#E8D48B]">#{orderId.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-[#F5ECD7]/60">
                        <span>Описание:</span>
                        <span className="text-right truncate max-w-[200px] text-[#F5ECD7]">Гравировка изделий</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[#C9A227]/10">
                        <span className="text-sm font-semibold text-[#F5ECD7]/80">Сумма к оплате:</span>
                        <span className="text-lg font-bold text-[#C9A227] font-mono">{formatPrice(amount)}</span>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg text-center">
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                    <button
                        onClick={() => triggerWebhook('payment.succeeded')}
                        disabled={status === 'processing' || status === 'done'}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-green-500/10 transition-all disabled:opacity-50 text-sm transform hover:-translate-y-0.5"
                    >
                        {status === 'processing' 
                            ? (locale === 'ru' ? 'Обработка...' : 'Processing...') 
                            : (locale === 'ru' ? 'Имитировать успешную оплату (Success)' : 'Simulate Success')}
                    </button>

                    <button
                        onClick={() => triggerWebhook('payment.canceled')}
                        disabled={status === 'processing' || status === 'done'}
                        className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 text-sm transform hover:-translate-y-0.5"
                    >
                        {locale === 'ru' ? 'Имитировать отмену оплаты (Cancel)' : 'Simulate Cancel'}
                    </button>
                </div>

                <div className="text-[10px] text-[#F5ECD7]/40 text-center leading-relaxed">
                    Данный шлюз предназначен исключительно для демонстрации работы.
                    Нажатие на кнопки эмулирует получение вебхука со стороны YooKassa и обновит статус вашего заказа в базе.
                </div>
            </div>
        </main>
    );
}

export default function PaymentMockPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0D0A0B] flex items-center justify-center text-[#C9A227]">Loading...</div>}>
            <PaymentMockContent />
        </Suspense>
    );
}
