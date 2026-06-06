import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data/yandex/mongo-client';
import { setCustomerSession } from '@/actions/customer-auth-actions';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const redirectBase = `${protocol}://${host}`;

    if (!token) {
        return NextResponse.redirect(`${redirectBase}/cabinet?error=missing_token`);
    }

    try {
        const db = await getDb();

        // 1. Find the token document
        const tokenDoc = await db.collection('auth_tokens').findOne({ token });

        if (!tokenDoc) {
            // Token not found or expired (automatically pruned by TTL)
            return NextResponse.redirect(`${redirectBase}/cabinet?error=expired`);
        }

        // 2. Immediately delete the token to prevent reuse (single-use link)
        await db.collection('auth_tokens').deleteOne({ token });

        // 3. Check token expiration manually just in case TTL has not fired yet (1 hour limit)
        const ageInMs = Date.now() - tokenDoc.createdAt;
        if (ageInMs > 3600 * 1000) {
            return NextResponse.redirect(`${redirectBase}/cabinet?error=expired`);
        }

        // 4. Authorize customer session (sets signed secure cookie)
        await setCustomerSession(tokenDoc.email);

        // 5. Redirect to customer cabinet
        return NextResponse.redirect(`${redirectBase}/cabinet`);
    } catch (error) {
        console.error('[Auth Callback] Verification error:', error);
        return NextResponse.redirect(`${redirectBase}/cabinet?error=server_error`);
    }
}
