import { auth } from '@/lib/firebase';
import {
    onAuthStateChanged as firebaseOnAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import { IAuthService, AuthUser } from '../interfaces';

function mapUser(user: any): AuthUser | null {
    if (!user) return null;
    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
    };
}

export class FirebaseAuthService implements IAuthService {
    onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
        if (!auth) {
            console.error('Auth instance is missing. Firebase initialization failed?');
            callback(null);
            return () => {};
        }
        return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
            callback(mapUser(firebaseUser));
        });
    }

    async signIn(email: string, password: string): Promise<void> {
        await signInWithEmailAndPassword(auth, email, password);
    }

    async signOut(): Promise<void> {
        await firebaseSignOut(auth);
    }

    getCurrentUser(): AuthUser | null {
        return mapUser(auth?.currentUser);
    }

    async getIdToken(): Promise<string | null> {
        const user = auth?.currentUser;
        if (!user) return null;
        return await user.getIdToken();
    }
}
