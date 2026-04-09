'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, AuthUser } from '@/lib/data';
import { useRouter } from 'next/navigation';

/**
 * Authentication Context
 * 
 * Provider-agnostic authentication wrapper.
 * Uses AuthService from the data layer — no direct Firebase imports.
 */

interface AuthContextType {
    user: AuthUser | null;
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
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = AuthService.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email: string, pass: string) => {
        await AuthService.signIn(email, pass);
        router.push(loginRedirect);
    };

    const logout = async () => {
        await AuthService.signOut();
        router.push(logoutRedirect);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
