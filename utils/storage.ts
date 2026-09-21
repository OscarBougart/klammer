/**
 * utils/storage.ts — Typed AsyncStorage helpers
 *
 * Wraps @react-native-async-storage/async-storage with:
 *   - JSON serialization/deserialization
 *   - TypeScript generics so you get proper types back
 *   - Error handling that returns null instead of throwing
 *
 * Usage:
 *   import { storage } from '@/utils/storage';
 *
 *   await storage.set('user', { name: 'Ada', xp: 500 });
 *   const user = await storage.get<{ name: string; xp: number }>('user');
 *   await storage.remove('user');
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Core typed wrapper ────────────────────────────────────────────────────────

export const storage = {
  /**
   * Persist any JSON-serialisable value under `key`.
   * Returns true on success, false on failure.
   */
  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      const json = JSON.stringify(value);
      await AsyncStorage.setItem(key, json);
      return true;
    } catch (e) {
      console.warn(`[storage.set] Failed to save "${key}":`, e);
      return false;
    }
  },

  /**
   * Retrieve a value by key, parsed as type T.
   * Returns null if the key doesn't exist or on error.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const json = await AsyncStorage.getItem(key);
      if (json === null) return null;
      return JSON.parse(json) as T;
    } catch (e) {
      console.warn(`[storage.get] Failed to read "${key}":`, e);
      return null;
    }
  },

  /**
   * Remove a single key from storage.
   * Returns true on success, false on failure.
   */
  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn(`[storage.remove] Failed to remove "${key}":`, e);
      return false;
    }
  },

  /**
   * Wipe all app data from AsyncStorage.
   * Use with caution — this clears everything, not just your keys.
   */
  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (e) {
      console.warn("[storage.clear] Failed to clear storage:", e);
      return false;
    }
  },

  /**
   * Read a value, return it, or persist + return a default if it's missing.
   * Useful for initializing settings on first launch.
   *
   * Example:
   *   const theme = await storage.getOrSet('theme', 'dark');
   */
  async getOrSet<T>(key: string, defaultValue: T): Promise<T> {
    const existing = await storage.get<T>(key);
    if (existing !== null) return existing;
    await storage.set(key, defaultValue);
    return defaultValue;
  },
};

// ─── Storage key constants ─────────────────────────────────────────────────────
// Centralise all storage keys here to avoid typos across the app.

export const STORAGE_KEYS = {
  // USER_PROFILE: 'user_profile',
  // SETTINGS: 'settings',
  // ONBOARDING_COMPLETE: 'onboarding_complete',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
