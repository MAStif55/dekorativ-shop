'use client';

import { useEffect, useState } from 'react';
import { useToastStore, Toast } from '@/store/toast-store';
import { Check, X, ShoppingBag, Info, AlertCircle } from 'lucide-react';

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    const [isExiting, setIsExiting] = useState(false);
    const [isEntering, setIsEntering] = useState(true);

    useEffect(() => {
        // Entry animation
        const enterTimer = setTimeout(() => setIsEntering(false), 50);

        // Exit animation before removal
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, (toast.duration || 3000) - 300);

        return () => {
            clearTimeout(enterTimer);
            clearTimeout(exitTimer);
        };
    }, [toast.duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onRemove, 300);
    };

    const icons = {
        success: <ShoppingBag className="w-5 h-5" />,
        error: <AlertCircle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />,
    };

    const colors = {
        success: 'from-white/95 to-white/95 border-emerald-100 text-slate-dark',
        error: 'from-white/95 to-white/95 border-red-100 text-slate-dark',
        info: 'from-white/95 to-white/95 border-blue-100 text-slate-dark',
    };

    const iconBg = {
        success: 'bg-emerald-50 text-emerald-600',
        error: 'bg-red-50 text-red-600',
        info: 'bg-blue-50 text-blue-600',
    };

    return (
        <div
            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg
                bg-gradient-to-r ${colors[toast.type]}
                transform transition-all duration-300 ease-out
                ${isEntering ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
                ${isExiting ? 'translate-x-full opacity-0' : ''}
            `}
        >
            {/* Icon */}
            <div className={`p-2 rounded-lg ${iconBg[toast.type]}`}>
                {toast.type === 'success' ? <Check className="w-5 h-5" /> : icons[toast.type]}
            </div>

            {/* Message */}
            <p className="font-medium text-sm flex-1 pr-2 text-slate-dark">{toast.message}</p>

            {/* Close Button */}
            <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors opacity-60 hover:opacity-100 text-slate"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export default function ToastContainer() {
    const { toasts, removeToast } = useToastStore();
    const [mounted, setMounted] = useState(false);

    // Only render on client to prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
                </div>
            ))}
        </div>
    );
}
