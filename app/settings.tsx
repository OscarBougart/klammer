/**
 * Settings — E5.5.
 *
 * Three switches and nothing else: a light theme, haptics, and a hideable
 * gloss. Sound and a daily reminder were dropped rather than left as switches
 * that did nothing; a reminder would also need a notification permission.
 */
import { useRouter } from 'expo-router';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import { useSettingsStore } from '@/store/settings';
import { a11y, border, makeStyles, space, useTheme } from '@/theme';

type Row = {
  key: 'theme' | 'haptics' | 'showGloss';
  de: string;
  en: string;
};

const ROWS: Row[] = [
  { key: 'theme', de: 'Helles Design', en: 'Light theme' },
  { key: 'haptics', de: 'Vibration', en: 'Haptics' },
  { key: 'showGloss', de: 'Englische Übersetzung', en: 'English gloss' },
];

export default function SettingsScreen() {
  const styles = useStyles();
  const { palette } = useTheme();
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
              accessibilityLabel={row.de}
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

        <Button
          variant="secondary"
          label="Übungssatz wiederholen"
          accessibilityHint="Zeigt die Einführung mit einem Übungssatz noch einmal."
          onPress={() => router.push('/(game)/intro')}
        />

        <Button label="Zurück" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

const useStyles = makeStyles(({ palette, type }) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: palette.schiefer,
      justifyContent: 'space-between',
    },
    header: {
      padding: space.lg,
    },
    title: type.heading,
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
    german: type.explanation,
    english: type.gloss,
    footer: {
      padding: space.lg,
      gap: space.md,
    },
    privacy: type.gloss,
  }),
);
