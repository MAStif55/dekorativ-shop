/**
 * COMPATIBILITY BRIDGE — DO NOT ADD FIREBASE IMPORTS HERE
 * 
 * Delegates to SettingsRepository from the Data Access Layer.
 */

import { SettingsRepository } from '@/lib/data';
import { StoreSettings } from '@/types/settings';

export async function getStoreSettings(): Promise<StoreSettings> {
    return SettingsRepository.get();
}

export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
    return SettingsRepository.update(settings);
}
