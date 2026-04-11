'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login as serverLogin, logout as serverLogout, getSession, AppUser } from '@/actions/auth-actions';

/**
 * Authentication Context
 * 
 * Provider-agnostic authentication wrapper.
 * Uses Server Actions for auth — no direct Firebase/MongoDB imports.
 */

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: React.ReactNode;
    loginRedirect?: string;
    logoutRedirect?: string;
}

export const AuthProvider = ({
    children,
    loginRedirect = '/admin',
    logoutRedirect = '/admin/login'
}: AuthProviderProps) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check session on mount (cookie-based)
        getSession().then((session) => {
            setUser(session);
            setLoading(false);
        });
    }, []);

    const login = async (email: string, pass: string) => {
        const result = await serverLogin(email, pass);
        if (!result.success) throw new Error(result.error || 'Login failed');
        setUser({ uid: 'admin_user', email });
        router.push(loginRedirect);
    };

    const logout = async () => {
        await serverLogout();
        setUser(null);
        router.push(logoutRedirect);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
