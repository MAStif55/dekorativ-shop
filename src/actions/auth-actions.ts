'use server';

import { AuthService } from '@/lib/data';
import { cookies } from 'next/headers';

// ============================================================================
// AUTH SERVER ACTIONS
// Normalizes auth to Next.js cookies, decoupling SDKs from the UI.
// Per Playbook §4.C: secure cookie flag is dynamic based on NODE_ENV.
// ============================================================================

const AUTH_COOKIE = 'dekorativ_session';

export interface AppUser {
    uid: string;
    email: string | null;
}

export async function login(email: string, password: string) {
    try {
        await AuthService.signIn(email, password);
        const cookieStore = await cookies();
        cookieStore.set(AUTH_COOKIE, email, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function logout() {
    await AuthService.signOut();
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE);
    return { success: true };
}

export async function getSession(): Promise<AppUser | null> {
    const cookieStore = await cookies();
    const sessionEmail = cookieStore.get(AUTH_COOKIE)?.value;
    if (sessionEmail) {
        return { uid: 'admin_user', email: sessionEmail };
    }
    return null;
}
