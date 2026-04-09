import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ISettingsRepository } from '../interfaces';
import { StoreSettings, defaultSettings } from '@/types/settings';

const SETTINGS_COLLECTION = 'settings';
const GENERAL_DOC_ID = 'general';

export class FirebaseSettingsRepository implements ISettingsRepository {
    async get(): Promise<StoreSettings> {
        try {
            const ref = doc(db, SETTINGS_COLLECTION, GENERAL_DOC_ID);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                return { ...defaultSettings, ...snap.data() } as StoreSettings;
            } else {
                await setDoc(ref, defaultSettings);
                return defaultSettings;
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            return defaultSettings;
        }
    }

    async update(settings: Partial<StoreSettings>): Promise<void> {
        try {
            const ref = doc(db, SETTINGS_COLLECTION, GENERAL_DOC_ID);
            await setDoc(ref, settings, { merge: true });
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }
}
