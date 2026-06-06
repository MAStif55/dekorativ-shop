'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoginForm() {
    const { locale } = useLanguage();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setStatus('error');
            setMessage(locale === 'ru' ? 'Введите корректный email' : 'Please enter a valid email');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch('/api/auth/magic-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setStatus('success');
                setMessage(
                    locale === 'ru'
                        ? 'Ссылка для входа отправлена на вашу почту! Проверьте спам, если письмо не пришло.'
                        : 'Login link has been sent to your email! Check spam folder if you do not see it.'
                );
            } else {
                setStatus('error');
                setMessage(result.error || (locale === 'ru' ? 'Произошла ошибка. Попробуйте позже.' : 'An error occurred. Please try again.'));
            }
        } catch (err) {
            console.error('Magic link request error:', err);
            setStatus('error');
            setMessage(locale === 'ru' ? 'Сетевая ошибка. Проверьте интернет.' : 'Network error. Please try again.');
        }
    };

    return (
        <div className="max-w-md w-full mx-auto bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#C5A059]/5 rounded-full blur-2xl pointer-events-none"></div>

            <h2 className="text-2xl font-ornamental text-slate-dark mb-2 text-center">
                {locale === 'ru' ? 'Вход в Личный Кабинет' : 'Client Cabinet Login'}
            </h2>
            <p className="text-sm text-slate-light mb-6 text-center">
                {locale === 'ru'
                    ? 'Введите email, указанный при оформлении заказа. Пароль не требуется.'
                    : 'Enter the email you used during checkout. No password required.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate placeholder-slate-400 focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] transition-colors shadow-sm"
                        placeholder="your-email@example.com"
                        disabled={status === 'loading' || status === 'success'}
                    />
                </div>

                {message && (
                    <div
                        className={`p-3 rounded-lg text-sm border ${status === 'success'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-600'
                            }`}
                    >
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={status === 'loading' || status === 'success'}
                    className="w-full bg-[#C5A059] text-white py-3.5 rounded-lg font-bold hover:bg-[#A08044] transition-all disabled:opacity-50 transform hover:-translate-y-0.5 shadow-md"
                >
                    {status === 'loading'
                        ? (locale === 'ru' ? 'Отправка...' : 'Sending...')
                        : status === 'success'
                            ? (locale === 'ru' ? 'Отправлено' : 'Sent')
                            : (locale === 'ru' ? 'Получить ссылку для входа' : 'Get Magic Link')}
                </button>
            </form>
        </div>
    );
}
