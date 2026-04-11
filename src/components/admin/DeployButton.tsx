'use client';

import { useState } from 'react';
import { Rocket, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type DeployStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Deploy Button
 * 
 * On Yandex Cloud, deployment is automatic via `git push`.
 * This button shows a reminder message instead of triggering a Cloud Function.
 */
export default function DeployButton() {
    const [status, setStatus] = useState<DeployStatus>('idle');
    const [message, setMessage] = useState('');

    const triggerDeploy = async () => {
        setStatus('success');
        setMessage('Deployment is automatic via git push. Push to the main branch to deploy.');

        setTimeout(() => {
            setStatus('idle');
            setMessage('');
        }, 10000);
    };

    const statusConfig = {
        idle: {
            bg: 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50',
            text: 'text-slate-600 hover:text-indigo-700',
            icon: <Rocket className="w-5 h-5" />,
            label: 'Deploy Site',
        },
        loading: {
            bg: 'border-amber-300 bg-amber-50/50 cursor-wait',
            text: 'text-amber-700',
            icon: <Loader2 className="w-5 h-5 animate-spin" />,
            label: 'Deploying...',
        },
        success: {
            bg: 'border-emerald-300 bg-emerald-50/50',
            text: 'text-emerald-700',
            icon: <CheckCircle className="w-5 h-5" />,
            label: 'Info',
        },
        error: {
            bg: 'border-red-300 bg-red-50/50',
            text: 'text-red-700',
            icon: <AlertCircle className="w-5 h-5" />,
            label: 'Failed',
        },
    };

    const config = statusConfig[status];

    return (
        <div className="flex flex-col items-center">
            <button
                onClick={triggerDeploy}
                disabled={status === 'loading'}
                className={`flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-xl font-medium transition-all ${config.bg} ${config.text} ${status === 'loading' ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
                {config.icon}
                {config.label}
            </button>
            {message && (
                <p className={`text-xs mt-2 text-center ${status === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
