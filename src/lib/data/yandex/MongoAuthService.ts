import { getDb } from './mongo-client';
import { IAuthService, AuthUser } from '../interfaces';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// ============================================================================
// SELF-HOSTED AUTH (MongoDB-backed, no Firebase dependency)
//
// Uses admin_users collection with bcrypt-hashed passwords.
// Per Playbook §4.C: secure cookie flag is dynamic based on NODE_ENV.
// Per Playbook §4.D: uses window.location.href for post-auth redirect.
//
// Migration: Existing HMAC-SHA-256 hashes are auto-upgraded to bcrypt on login.
// ============================================================================

const BCRYPT_ROUNDS = 12;

/**
 * Legacy HMAC-SHA-256 hash for migration compatibility.
 * New logins always use bcrypt.
 */
function legacyHashPassword(password: string): string {
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
        const user = await db.collection('admin_users').findOne({ email });

        if (!user) {
            throw new Error('Invalid email or password');
        }

        const storedHash: string = user.passwordHash;

        // Check if the stored hash is a bcrypt hash (starts with $2b$ or $2a$)
        if (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$')) {
            // Modern bcrypt comparison
            const isValid = await bcrypt.compare(password, storedHash);
            if (!isValid) {
                throw new Error('Invalid email or password');
            }
        } else {
            // Legacy HMAC-SHA-256 comparison — auto-upgrade to bcrypt on success
            const legacyHash = legacyHashPassword(password);
            if (legacyHash !== storedHash) {
                throw new Error('Invalid email or password');
            }

            // Auto-upgrade: replace HMAC-SHA-256 hash with bcrypt
            const bcryptHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
            await db.collection('admin_users').updateOne(
                { _id: user._id },
                { $set: { passwordHash: bcryptHash } }
            );
            console.log(`[Auth] Upgraded password hash for ${email} from legacy HMAC-SHA-256 to bcrypt`);
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
