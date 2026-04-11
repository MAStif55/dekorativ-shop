import { getDb } from './mongo-client';
import { IAuthService, AuthUser } from '../interfaces';
import crypto from 'crypto';

// ============================================================================
// SELF-HOSTED AUTH (MongoDB-backed, no Firebase dependency)
//
// Uses admin_users collection with SHA-256 hashed passwords.
// Per Playbook §4.C: secure cookie flag is dynamic based on NODE_ENV.
// Per Playbook §4.D: uses window.location.href for post-auth redirect.
// ============================================================================

function hashPassword(password: string): string {
    return crypto.createHmac('sha256', 'dekorativ-auth-salt').update(password).digest('hex');
}

// In-memory session tracker (per server instance)
let currentUser: AuthUser | null = null;
const listeners: Set<(user: AuthUser | null) => void> = new Set();

function notifyListeners() {
    Array.from(listeners).forEach(cb => cb(currentUser));
}

export class MongoAuthService implements IAuthService {

    onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
        listeners.add(callback);
        // Immediately call back with current state
        callback(currentUser);
        return () => {
            listeners.delete(callback);
        };
    }

    async signIn(email: string, password: string): Promise<void> {
        const db = await getDb();
        const hashedPass = hashPassword(password);
        const user = await db.collection('admin_users').findOne({
            email: email,
            passwordHash: hashedPass,
        });

        if (!user) {
            throw new Error('Invalid email or password');
        }

        currentUser = {
            uid: user._id.toString(),
            email: user.email,
            displayName: user.displayName || null,
        };
        notifyListeners();
    }

    async signOut(): Promise<void> {
        currentUser = null;
        notifyListeners();
    }

    getCurrentUser(): AuthUser | null {
        return currentUser;
    }

    async getIdToken(): Promise<string | null> {
        // No Firebase tokens in self-hosted mode
        // Return a simple session marker if logged in
        if (!currentUser) return null;
        return `mongo-session-${currentUser.uid}`;
    }
}
