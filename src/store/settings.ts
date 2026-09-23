/**
 * Settings — E5.5.
 *
 * design.md §6 and §9: sound is off by default, the gloss can be hidden for
 * learners who want German only, and the daily reminder is optional and
 * declinable forever.
 *
 * Stored in AsyncStorage rather than SQLite: these are per-device preferences,
 * not learner history, and they should survive a database migration without
 * being part of one.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const STORAGE_KEY = 'klammer.settings.v1';

export type Settings = {
  /** design.md §6: dark is the shipping default, and deliberately so. */
  theme: 'dark' | 'light';
  /** Off by default. Failing should be quiet; succeeding should be optional. */
  sound: boolean;
  haptics: boolean;
  /**
   * Whether to show the English gloss. A learner who can read the German alone
   * should be able to turn the crutch off rather than train themselves to
   * skip it.
   */
  showGloss: boolean;
  /** One optional daily reminder, declinable forever. */
  reminder: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  sound: false,
  haptics: true,
  showGloss: true,
  reminder: false,
};

type SettingsState = Settings & {
  loaded: boolean;
  hydrate: () => Promise<void>;
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
};

export const useSettingsStore = create<SettingsState>((setState, getState) => ({
  ...DEFAULT_SETTINGS,
  loaded: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Partial<Settings>;
        // Spread over the defaults so a settings key added in a later version
        // has a value rather than being undefined.
        setState({ ...DEFAULT_SETTINGS, ...stored, loaded: true });
        return;
      }
    } catch {
      // Unreadable or corrupt storage is not worth failing a launch over —
      // the defaults are all reasonable.
    }
    setState({ loaded: true });
  },

  set: (key, value) => {
    setState({ [key]: value } as Pick<SettingsState, typeof key>);

    const { theme, sound, haptics, showGloss, reminder } = getState();
    void AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theme, sound, haptics, showGloss, reminder }),
    );
  },
}));
