/**
 * The zone-unlock moment — E5.2.
 *
 * design.md §7: "Advancement is announced as a new zone appearing on the
 * board, with a 30-second explanation of what that zone does."
 *
 * Not a trophy, not confetti, not "Level 3!". The reward for getting good at
 * German word order is *more German word order* — a new field on the board and
 * a short account of what it is for. If that is not rewarding, the app has no
 * business existing.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FieldZone from '@/board/FieldZone';
import { boardFields, type Tier } from '@/board/fields';
import { DragProvider } from '@/board/dragContext';
import {
  a11y,
  explanation,
  gloss,
  heading,
  palette,
  radius,
  space,
} from '@/theme';

/** What each tier opens up, in both languages. */
const TIER_LESSON: Record<number, { name: string; de: string; en: string }> = {
  2: {
    name: 'Die Klammer',
    de: 'Das Verb teilt sich. Der finite Teil steht an zweiter Stelle, der Rest ganz am Ende — dazwischen liegt das Mittelfeld. Das ist die Satzklammer, und sie erklärt die halbe deutsche Wortstellung.',
    en: 'The verb splits in two. The finite part stays second, the rest goes to the very end, and everything else sits between them. This is the bracket — once you see it, half of German word order stops being arbitrary.',
  },
  3: {
    name: 'Das Mittelfeld',
    de: 'Das Mittelfeld hat eine eigene Ordnung: Pronomen zuerst, dann Angaben nach Zeit – Grund – Art – Ort, und die Negation direkt vor der rechten Klammer.',
    en: 'The middle field has its own internal order: pronouns first, then adverbials by time – reason – manner – place, with negation pressed against the right bracket.',
  },
  4: {
    name: 'Der Nebensatz',
    de: 'Im Nebensatz übernimmt die Konjunktion die linke Klammer, und das finite Verb rutscht ans Ende. Kein Vorfeld mehr — der Nebensatz fängt direkt mit „dass" oder „weil" an.',
    en: 'In a subordinate clause the conjunction takes the left bracket and the finite verb moves to the end. There is no Vorfeld at all — the clause begins directly with "dass" or "weil".',
  },
  5: {
    name: 'Das Nachfeld',
    de: 'Manches darf hinter die rechte Klammer rutschen: Vergleiche mit „als" und ganze Nebensätze. Das Nachfeld ist der einzige Platz außerhalb der Klammer.',
    en: 'Some things may slide out past the right bracket: comparisons with "als", and whole subordinate clauses. The Nachfeld is the one position outside the bracket.',
  },
};

export default function UnlockScreen() {
  const router = useRouter();
  const { tier: tierParam } = useLocalSearchParams<{ tier?: string }>();

  const tier = Number(tierParam ?? 2) as Tier;
  const lesson = TIER_LESSON[tier];

  const fields = boardFields(tier);
  // The zone that was not there before — the thing being announced.
  const previous = new Set(boardFields((tier - 1) as Tier).map((f) => f.id));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Stufe {tier}</Text>
        <Text style={styles.title}>{lesson?.name ?? ''}</Text>
      </View>

      {/* The board as it now stands, with the new zone highlighted. Showing
          the real component rather than a picture means this can never drift
          out of step with the board the learner is about to play on. */}
      <DragProvider>
        <View style={styles.board}>
          {fields.map((field) => (
            <View
              key={field.id}
              style={[styles.zoneWrap, !previous.has(field.id) && styles.zoneNew]}
            >
              <FieldZone field={field} count={0} />
            </View>
          ))}
        </View>
      </DragProvider>

      <View style={styles.lesson}>
        <Text style={styles.german}>{lesson?.de ?? ''}</Text>
        <Text style={styles.english}>{lesson?.en ?? ''}</Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.replace('/')}
          accessibilityRole="button"
          accessibilityLabel="Weiter"
          style={styles.action}
        >
          <Text style={styles.actionLabel}>Weiter</Text>
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
    gap: space.xs,
  },
  eyebrow: gloss,
  title: heading,
  board: {
    paddingHorizontal: space.lg,
    gap: space.sm,
  },
  zoneWrap: {
    opacity: 0.45,
  },
  zoneNew: {
    // The new zone is the only one at full strength — the eye goes to it
    // without needing an arrow or a label saying "new".
    opacity: 1,
  },
  lesson: {
    padding: space.lg,
    gap: space.sm,
  },
  german: explanation,
  english: gloss,
  footer: {
    padding: space.lg,
  },
  action: {
    backgroundColor: palette.messing,
    borderRadius: radius.tile,
    minHeight: a11y.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...explanation,
    color: palette.schiefer,
  },
});
