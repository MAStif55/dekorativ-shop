'use client';

import { useState } from 'react';
import { Rocket, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AuthService } from '@/lib/data';

type DeployStatus = 'idle' | 'loading' | 'success' | 'error';

export default function DeployButton() {
    const [status, setStatus] = useState<DeployStatus>('idle');
    const [message, setMessage] = useState('');
    const [cooldown, setCooldown] = useState(false);

    const triggerDeploy = async () => {
        if (cooldown) return;

        setStatus('loading');
        setMessage('');

        try {
            const idToken = await AuthService.getIdToken();
            if (!idToken) {
                setStatus('error');
                setMessage('Not authenticated');
                return;
            }

            const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
            const functionUrl = `https://us-central1-${projectId}.cloudfunctions.net/triggerDeploy`;

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                setStatus('success');
                setMessage('Deployment triggered! Check GitHub Actions for progress.');
                setCooldown(true);
                setTimeout(() => {
                    setCooldown(false);
                    setStatus('idle');
                    setMessage('');
                }, 30000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to trigger deployment');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Network error. Please try again.');
            console.error('Deploy trigger error:', err);
        }
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
            label: 'Triggered!',
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
                disabled={status === 'loading' || cooldown}
                className={`flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-xl font-medium transition-all ${config.bg} ${config.text} ${(status === 'loading' || cooldown) ? 'opacity-60 cursor-not-allowed' : ''}`}
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
