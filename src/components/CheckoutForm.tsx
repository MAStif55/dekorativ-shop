'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCartStore } from '@/store/cart-store';
import { getLocalizedSchema, CheckoutFormData } from '@/lib/checkout-schema';
import { AddressAutocomplete } from './AddressAutocomplete';
import { formatPrice } from '@/utils/currency';
import { API } from '@/lib/config';

interface UploadingFile {
    name: string;
    progress: number;
    url?: string;
    error?: string;
}

declare global {
    interface Window {
        onloadTurnstileCallback?: () => void;
        turnstile?: {
            render: (container: string | HTMLElement, options: any) => string;
            remove: (widgetId: string) => void;
            reset: (widgetId: string) => void;
        };
    }
}

export default function CheckoutForm() {
    const { locale, t } = useLanguage();
    const router = useRouter();
    const { items, clearCart, getFinalPrice } = useCartStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Draft Order ID to keep uploads grouped in S3
    const [tempId] = useState(() => Math.random().toString(36).substring(2, 11) + Date.now().toString(36));

    // S3 Attachments State
    const [attachments, setAttachments] = useState<UploadingFile[]>([]);
    const [uploadingCount, setUploadingCount] = useState(0);

    // Turnstile CAPTCHA State
    const [captchaToken, setCaptchaToken] = useState<string>('');
    const turnstileRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    const schema = getLocalizedSchema(locale);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CheckoutFormData>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            paymentMethod: 'post_payment',
        }
    });

    const addressValue = watch('address') || '';

    const handleAddressChange = (value: string) => {
        setValue('address', value, { shouldValidate: true });
    };

    const handleAddressSelect = (suggestion: any) => {
        setValue('addressDetails', suggestion.data);
    };

    // Load Turnstile script dynamically
    useEffect(() => {
        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'; // Demo key fallback
        const scriptId = 'cf-turnstile-script';
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        const initializeTurnstile = () => {
            if (window.turnstile && turnstileRef.current && !widgetIdRef.current) {
                try {
                    widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
                        sitekey: siteKey,
                        callback: (token: string) => {
                            setCaptchaToken(token);
                        },
                        'error-callback': (err: any) => {
                            console.error('Turnstile error:', err);
                        }
                    });
                } catch (e) {
                    console.error('Failed to render Turnstile:', e);
                }
            }
        };

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);

            window.onloadTurnstileCallback = () => {
                initializeTurnstile();
            };
        } else if (window.turnstile) {
            initializeTurnstile();
        }

        return () => {
            if (window.turnstile && widgetIdRef.current) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                    widgetIdRef.current = null;
                } catch (e) {}
            }
        };
    }, []);

    // File Upload Handler (Direct S3 uploads via Presigned URLs)
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const allowedExtensions = ['.cdr', '.dxf', '.ai', '.pdf', '.eps', '.png', '.jpg', '.jpeg'];
        const maxSizeBytes = 50 * 1024 * 1024; // 50MB

        const fileList = Array.from(files);

        for (const file of fileList) {
            const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            if (!allowedExtensions.includes(ext)) {
                alert(
                    locale === 'ru'
                        ? `Неподдерживаемый формат файла: ${file.name}. Разрешены только: ${allowedExtensions.join(', ')}`
                        : `Unsupported file format: ${file.name}. Only: ${allowedExtensions.join(', ')} are allowed.`
                );
                continue;
            }

            if (file.size > maxSizeBytes) {
                alert(
                    locale === 'ru'
                        ? `Файл ${file.name} слишком большой. Максимальный размер: 50 МБ`
                        : `File ${file.name} is too large. Max size is 50MB`
                );
                continue;
            }

            // Add to state
            const newFile: UploadingFile = { name: file.name, progress: 0 };
            setAttachments(prev => [...prev, newFile]);
            setUploadingCount(prev => prev + 1);

            try {
                // 1. Get Presigned URL from backend
                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileType: file.type,
                        tempId,
                    }),
                });

                const uploadData = await uploadResponse.json();
                if (!uploadResponse.ok || !uploadData.success) {
                    throw new Error(uploadData.error || 'Failed to get upload URL');
                }

                const { uploadUrl, publicUrl } = uploadData;

                // 2. Upload file directly to Yandex Object Storage (S3) via XMLHttpRequest for progress tracking
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl);
                xhr.setRequestHeader('Content-Type', file.type);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        setAttachments(prev =>
                            prev.map(item => item.name === file.name ? { ...item, progress: percent } : item)
                        );
                    }
                };

                xhr.onload = () => {
                    setUploadingCount(prev => Math.max(0, prev - 1));
                    if (xhr.status === 200) {
                        setAttachments(prev =>
                            prev.map(item => item.name === file.name ? { ...item, url: publicUrl, progress: 100 } : item)
                        );
                    } else {
                        setAttachments(prev =>
                            prev.map(item => item.name === file.name ? { ...item, error: 'Upload failed', progress: 0 } : item)
                        );
                    }
                };

                xhr.onerror = () => {
                    setUploadingCount(prev => Math.max(0, prev - 1));
                    setAttachments(prev =>
                        prev.map(item => item.name === file.name ? { ...item, error: 'Network error', progress: 0 } : item)
                    );
                };

                xhr.send(file);
            } catch (err: any) {
                console.error('File upload error:', err);
                setUploadingCount(prev => Math.max(0, prev - 1));
                setAttachments(prev =>
                    prev.map(item => item.name === file.name ? { ...item, error: err.message || 'Upload failed', progress: 0 } : item)
                );
            }
        }
    };

    const removeAttachment = (fileName: string) => {
        setAttachments(prev => prev.filter(item => item.name !== fileName));
    };

    const onSubmit = async (data: CheckoutFormData) => {
        if (uploadingCount > 0) {
            alert(
                locale === 'ru'
                    ? 'Пожалуйста, дождитесь окончания загрузки всех файлов.'
                    : 'Please wait until all files are uploaded.'
            );
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const uploadedUrls = attachments.filter(a => a.url).map(a => a.url as string);

            const payload = {
                cartItems: items,
                customerInfo: {
                    ...data,
                    attachments: uploadedUrls,
                    captchaToken,
                    paymentMethod: 'post_payment',
                },
                locale,
            };

            const response = await fetch(API.CREATE_ORDER, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                // Reset captcha on failure to let them try again
                if (window.turnstile && widgetIdRef.current) {
                    window.turnstile.reset(widgetIdRef.current);
                }
                throw new Error(result.error || 'Failed to submit order');
            }

            if (result.success) {
                clearCart();
                router.push(`/order-success?orderId=${result.orderId}`);
            }
        } catch (error: any) {
            console.error('Checkout error:', error);
            setSubmitError(error.message || (
                locale === 'ru'
                    ? 'Произошла ошибка при оформлении заказа. Попробуйте позже.'
                    : 'An error occurred while placing your order. Please try again later.'
            ));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Name */}
            <div>
                <label className="block text-sm font-medium text-slate-dark mb-2">
                    {locale === 'ru' ? 'Ваше имя' : 'Your Name'}
                </label>
                <input
                    type="text"
                    {...register('customerName')}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate placeholder-slate-400 focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] transition-colors shadow-sm"
                    placeholder={locale === 'ru' ? 'Иван Иванов' : 'John Doe'}
                />
                {errors.customerName && (
                    <p className="text-red-400 text-sm mt-1">{errors.customerName.message}</p>
                )}
            </div>

            {/* Email */}
            <div>
                <label className="block text-sm font-medium text-slate-dark mb-2">
                    Email
                </label>
                <input
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate placeholder-slate-400 focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] transition-colors shadow-sm"
                    placeholder="example@mail.com"
                />
                {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                )}
            </div>

            {/* Phone */}
            <div>
                <label className="block text-sm font-medium text-slate-dark mb-2">
                    {locale === 'ru' ? 'Телефон' : 'Phone'}
                </label>
                <input
                    type="tel"
                    {...register('phone')}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate placeholder-slate-400 focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] transition-colors shadow-sm"
                    placeholder="+7 999 000-00-00"
                />
                {errors.phone && (
                    <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
                )}
            </div>

            {/* Address */}
            <div>
                <label className="block text-sm font-medium text-slate-dark mb-2">
                    {locale === 'ru' ? 'Адрес доставки' : 'Delivery Address'}
                </label>
                <AddressAutocomplete
                    value={addressValue}
                    onChange={handleAddressChange}
                    onSelect={handleAddressSelect}
                    error={errors.address?.message}
                    locale={locale}
                    placeholder={locale === 'ru' ? 'г. Москва, ул. Пушкина, д. 1, кв. 10' : '123 Main St, New York, NY'}
                />
            </div>

            {/* Telegram (Optional) */}
            <div>
                <label className="block text-sm font-medium text-slate-dark mb-2">
                    Telegram <span className="text-slate-light font-normal">({locale === 'ru' ? 'необязательно' : 'optional'})</span>
                </label>
                <input
                    type="text"
                    {...register('telegram')}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate placeholder-slate-400 focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] transition-colors shadow-sm"
                    placeholder="@username"
                />
                {errors.telegram && (
                    <p className="text-red-400 text-sm mt-1">{errors.telegram.message}</p>
                )}
            </div>

            {/* Layout Attachment Upload Field */}
            <div>
                <label className="block text-sm font-medium text-slate-dark mb-2">
                    {locale === 'ru' ? 'Макеты для гравировки / Референсы' : 'Engraving Layouts / References'}
                </label>
                <div className="w-full border-2 border-dashed border-slate-200 rounded-lg bg-white/50 p-6 text-center hover:border-[#C5A059] hover:bg-white transition-colors relative shadow-sm">
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".cdr,.dxf,.ai,.pdf,.eps,.png,.jpg,.jpeg"
                    />
                    <div className="space-y-1 pointer-events-none">
                        <span className="text-3xl">📁</span>
                        <p className="text-slate-dark font-medium">
                            {locale === 'ru' ? 'Выберите или перетащите файлы' : 'Choose or drag files here'}
                        </p>
                        <p className="text-xs text-slate-light">
                            {locale === 'ru' ? 'Разрешены: .cdr, .dxf, .ai, .pdf, .eps, .png, .jpg (до 50 МБ)' : 'Allowed: .cdr, .dxf, .ai, .pdf, .eps, .png, .jpg (up to 50MB)'}
                        </p>
                    </div>
                </div>

                {/* Uploading Progress & Files List */}
                {attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {attachments.map((file, idx) => (
                            <div key={file.name + idx} className="flex items-center justify-between p-3 bg-white/80 border border-slate-100 rounded-lg shadow-sm backdrop-blur-sm animate-fade-in">
                                <div className="flex-1 mr-4">
                                    <div className="flex justify-between items-center text-sm font-semibold text-slate-dark mb-1">
                                        <span className="truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                                        <span className="text-xs font-mono text-[#C5A059]">
                                            {file.error ? (
                                                <span className="text-red-500">{file.error}</span>
                                            ) : (
                                                `${file.progress}%`
                                            )}
                                        </span>
                                    </div>
                                    {!file.error && file.progress < 100 && (
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-[#C5A059] to-[#A08044] h-full transition-all duration-300"
                                                style={{ width: `${file.progress}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeAttachment(file.name)}
                                    className="text-red-500/80 hover:text-red-500 text-sm p-1 ml-2 transition-colors"
                                >
                                    ❌
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Notes / Specifications */}
            <div>
                <label className="block text-sm font-medium text-slate-dark mb-2">
                    {locale === 'ru' ? 'Комментарий к макету и ТЗ' : 'Engraving Specifications'} <span className="text-slate-light font-normal">({locale === 'ru' ? 'необязательно' : 'optional'})</span>
                </label>
                <textarea
                    {...register('notes')}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate placeholder-slate-400 focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] transition-colors resize-none shadow-sm"
                    placeholder={locale === 'ru' ? 'Напишите текст для гравировки, расположение, выбор шрифта...' : 'Write text, placement, font preferences...'}
                />
                {errors.notes && (
                    <p className="text-red-400 text-sm mt-1">{errors.notes.message}</p>
                )}
            </div>

            {/* Process Info Box */}
            <div className="p-4 bg-white/40 border border-slate-200/60 rounded-xl space-y-2 shadow-sm">
                <div className="flex items-center gap-2 text-slate-dark font-semibold text-sm">
                    <span>💡</span>
                    <span>{locale === 'ru' ? 'Как происходит заказ:' : 'How it works:'}</span>
                </div>
                <p className="text-xs text-slate leading-relaxed">
                    {locale === 'ru'
                        ? 'Вы отправляете заявку. Наш мастер проверит ваши макеты, откроет обсуждение в чате Личного Кабинета и утвердит цену. Оплатить заказ можно будет картой через ЮKassa в вашем личном кабинете после согласования макета.'
                        : 'Submit your request. Our master will verify your layouts, discuss them with you in the client cabinet chat, and confirm the price. You can pay securely via YooKassa in your cabinet after the layout is approved.'}
                </p>
            </div>

            {/* Turnstile Captcha Container */}
            <div className="flex justify-center my-4">
                <div ref={turnstileRef} id="cf-turnstile-container"></div>
            </div>

            {/* Error Message */}
            {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm shadow-sm">
                    {submitError}
                </div>
            )}

            {/* Estimated Total Display */}
            <div className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                <span className="text-slate text-sm">
                    {locale === 'ru' ? 'Предварительная стоимость:' : 'Estimated total:'}
                </span>
                <span className="text-xl font-bold text-[#C5A059] font-ornamental">
                    {formatPrice(getFinalPrice())}
                </span>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting || items.length === 0 || uploadingCount > 0}
                className="w-full bg-[#C5A059] text-white py-4 rounded-xl font-bold hover:bg-[#A08044] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
                {isSubmitting
                    ? (locale === 'ru' ? 'Отправка заявки...' : 'Submitting Request...')
                    : (locale === 'ru' ? 'Отправить на проверку мастеру' : 'Submit for Master Verification')}
            </button>
        </form>
    );
}
