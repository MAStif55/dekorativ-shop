'use server';

import { AuthService } from '@/lib/data';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// ============================================================================
// AUTH SERVER ACTIONS
// Normalizes auth to Next.js cookies, decoupling SDKs from the UI.
// Per Playbook §4.C: secure cookie flag is dynamic based on NODE_ENV.
// ============================================================================

const AUTH_COOKIE = 'dekorativ_session';
const COOKIE_SECRET = process.env.SESSION_SECRET || 'dekorativ-default-secret-change-me';

export interface AppUser {
    uid: string;
    email: string | null;
}

/**
 * Create an HMAC signature for the cookie value to prevent tampering.
 */
function signValue(value: string): string {
    const signature = crypto
        .createHmac('sha256', COOKIE_SECRET)
        .update(value)
        .digest('base64url');
    return `${value}.${signature}`;
}

/**
 * Verify and extract the original value from a signed cookie.
 * Returns null if the signature is invalid.
 */
function verifySignedValue(signedValue: string): string | null {
    const lastDot = signedValue.lastIndexOf('.');
    if (lastDot === -1) return null;

    const value = signedValue.substring(0, lastDot);
    const signature = signedValue.substring(lastDot + 1);

    const expectedSignature = crypto
        .createHmac('sha256', COOKIE_SECRET)
        .update(value)
        .digest('base64url');

    // Timing-safe comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) return null;

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

    return value;
}

export async function login(email: string, password: string) {
    try {
        await AuthService.signIn(email, password);
        const cookieStore = await cookies();
        cookieStore.set(AUTH_COOKIE, signValue(email), {
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
    const signedValue = cookieStore.get(AUTH_COOKIE)?.value;
    if (!signedValue) return null;

    const email = verifySignedValue(signedValue);
    if (!email) {
        // Invalid signature — tampered cookie; delete it
        cookieStore.delete(AUTH_COOKIE);
        return null;
    }

    return { uid: 'admin_user', email };
}

export async function requireAuth() {
    const session = await getSession();
    if (!session) {
        throw new Error('Unauthorized');
    }
}
