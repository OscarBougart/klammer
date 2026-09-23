/**
 * Settings — E5.5.
 *
 * Five switches and nothing else. Every one of them is something design.md
 * promised: a light theme, sound off by default, haptics, a hideable gloss,
 * and one reminder that can be declined forever.
 */
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSettingsStore } from '@/store/settings';
import {
  a11y,
  border,
  explanation,
  gloss,
  heading,
  palette,
  radius,
  space,
} from '@/theme';

type Row = {
  key: 'theme' | 'sound' | 'haptics' | 'showGloss' | 'reminder';
  de: string;
  en: string;
};

const ROWS: Row[] = [
  { key: 'theme', de: 'Helles Design', en: 'Light theme' },
  { key: 'sound', de: 'Ton', en: 'Sound' },
  { key: 'haptics', de: 'Vibration', en: 'Haptics' },
  { key: 'showGloss', de: 'Englische Übersetzung', en: 'English gloss' },
  { key: 'reminder', de: 'Tägliche Erinnerung', en: 'Daily reminder' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useSettingsStore();

  const valueOf = (key: Row['key']): boolean =>
    key === 'theme' ? settings.theme === 'light' : settings[key];

  const toggle = (key: Row['key'], next: boolean) => {
    if (key === 'theme') {
      settings.set('theme', next ? 'light' : 'dark');
      return;
    }
    settings.set(key, next);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Einstellungen</Text>
      </View>

      <View style={styles.list}>
        {ROWS.map((row) => (
          <View key={row.key} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.german}>{row.de}</Text>
              <Text style={styles.english}>{row.en}</Text>
            </View>

            <Switch
              value={valueOf(row.key)}
              onValueChange={(next) => toggle(row.key, next)}
              accessibilityLabel={row.en}
              trackColor={{ false: palette.kante, true: palette.messing }}
              thumbColor={palette.kreide}
            />
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.privacy}>
          Klammer speichert alles nur auf diesem Gerät. Keine Konten, keine
          Werbung, keine Datenübertragung.
        </Text>

        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Zurück"
          style={styles.action}
        >
          <Text style={styles.actionLabel}>Zurück</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.schiefer,
    justifyContent: 'space-between',
  },
  header: {
    padding: space.lg,
  },
  title: heading,
  list: {
    paddingHorizontal: space.lg,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: a11y.minTouchTarget,
    paddingVertical: space.sm,
    borderBottomWidth: border.hairline,
    borderBottomColor: palette.kante,
    gap: space.md,
  },
  rowText: {
    flex: 1,
    gap: space.xs,
  },
  german: explanation,
  english: gloss,
  footer: {
    padding: space.lg,
    gap: space.md,
  },
  privacy: gloss,
  action: {
    backgroundColor: palette.feld,
    borderRadius: radius.tile,
    minHeight: a11y.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: explanation,
});
