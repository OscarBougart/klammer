/**
 * Root layout.
 *
 * Holds the splash until the typefaces are ready and the database is up to
 * date. A board rendered in a fallback face measures tiles at the wrong width
 * and reflows when the real face lands; a board rendered before hydration has
 * no sentences to deal.
 */
import '../global.css';

import { Stack } from 'expo-router';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { hydrateIfNeeded } from '@/content/hydrate';
import { useSettingsStore } from '@/store/settings';
import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { explanation, palette, space, useAppFonts } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();
  const { success: migrated, error: migrationError } = useMigrations(db, migrations);

  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const settingsLoaded = useSettingsStore((s) => s.loaded);

  const [hydrated, setHydrated] = useState(false);
  const [hydrationError, setHydrationError] = useState<Error | null>(null);

  useEffect(() => {
    if (!migrated) return;

    hydrateIfNeeded()
      .then(() => setHydrated(true))
      .catch((error: unknown) => {
        setHydrationError(
          error instanceof Error ? error : new Error(String(error)),
        );
      });
  }, [migrated]);

  useEffect(() => {
    void hydrateSettings();
  }, [hydrateSettings]);

  const fontsReady = fontsLoaded || fontError !== null;
  const ready = fontsReady && hydrated && settingsLoaded;
  const failure = migrationError ?? hydrationError;

  useEffect(() => {
    if (ready || failure) SplashScreen.hideAsync();
  }, [ready, failure]);

  if (failure) {
    // A database that will not open is not something a learner can act on, but
    // silently showing an empty board is worse than saying so.
    return (
      <View style={styles.failure}>
        <Text style={styles.failureText}>
          Die Datenbank konnte nicht geöffnet werden.
        </Text>
        <Text style={styles.failureText}>{failure.message}</Text>
      </View>
    );
  }

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.schiefer },
        }}
      />
    </GestureHandlerRootView>
  );
}

const styles = {
  root: { flex: 1, backgroundColor: palette.schiefer },
  failure: {
    flex: 1,
    backgroundColor: palette.schiefer,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: space.lg,
    gap: space.sm,
  },
  failureText: explanation,
};
