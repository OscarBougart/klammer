/**
 * The four verdict presentations — E3.3 / E3.6 / E3.7.
 *
 * design.md §4 and §5:
 *
 *   kanonisch     bracket closes, brass
 *   auch richtig  bracket closes + a line on what shifted
 *   ungewöhnlich  bracket closes in a dimmer brass + a note
 *   falsch        bracket stays open, the broken rule is named
 *
 * German first, English underneath in the muted tone, always. No screen flash
 * on a wrong answer and no failure sound — failing should be quiet.
 */
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useSettingsStore } from '@/store/settings';
import type { Explanation } from '@/engine/rules';
import type { Verdict } from '@/engine/validate';
import { explanation, explanationStrong, gloss, palette, space } from '@/theme';

export type VerdictPanelProps = {
  verdict: Verdict;
  /** The line to show: the rule for falsch, the note for an alternative. */
  message: Explanation;
  /** The constituent to set in the bold face, if any. */
  emphasis?: string;
};

/** The heading for each verdict. Sentence case, never all-caps. */
const HEADING: Record<Verdict, { de: string; en: string }> = {
  kanonisch: { de: 'Richtig.', en: 'Correct.' },
  gueltig: { de: 'Auch richtig.', en: 'Also correct.' },
  ungewoehnlich: { de: 'Möglich, aber ungewöhnlich.', en: 'Possible, but unusual.' },
  falsch: { de: 'So nicht.', en: 'Not like that.' },
};

function VerdictPanelComponent({ verdict, message, emphasis }: VerdictPanelProps) {
  const heading = HEADING[verdict];
  // A learner who can read the German alone should be able to turn the crutch
  // off, rather than training themselves to skip a line that is always there.
  const showGloss = useSettingsStore((s) => s.showGloss);

  return (
    <View
      style={styles.panel}
      accessibilityLiveRegion="polite"
      accessibilityRole="summary"
      // One sentence, not three fragments read in whatever order the tree
      // happens to produce.
      //
      // German, matching what is on screen and what the learner is here for.
      // Reading the English aloud while the German is displayed first would
      // make a screen reader switch language mid-verdict, and would read out a
      // gloss the learner may have deliberately switched off.
      accessible
      accessibilityLabel={`${heading.de} ${message.de}`}
    >
      <Text
        style={[
          styles.heading,
          verdict === 'falsch' && styles.headingWrong,
          verdict === 'ungewoehnlich' && styles.headingMarked,
        ]}
      >
        {heading.de}
      </Text>

      <Text style={styles.german}>
        {emphasis ? renderWithEmphasis(message.de, emphasis) : message.de}
      </Text>

      {showGloss ? <Text style={styles.english}>{message.en}</Text> : null}
    </View>
  );
}

/**
 * Sets the fronted constituent in the bold face inside the German line.
 * design.md §5 shows it emphasised: *Mit **morgen** im Vorfeld …*
 */
function renderWithEmphasis(text: string, emphasis: string) {
  const at = text.indexOf(emphasis);
  if (at === -1) return text;

  return (
    <>
      {text.slice(0, at)}
      <Text style={styles.emphasis}>{emphasis}</Text>
      {text.slice(at + emphasis.length)}
    </>
  );
}

export default memo(VerdictPanelComponent);

const styles = StyleSheet.create({
  panel: {
    gap: space.xs,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  heading: {
    ...explanation,
    color: palette.messing,
  },
  headingMarked: {
    // The dimmer tone that matches the dimmer arc.
    color: palette.grau,
  },
  headingWrong: {
    // `ziegel` is the error state and appears nowhere else; it never shares a
    // screen with `messing`.
    color: palette.ziegel,
  },
  german: explanation,
  english: gloss,
  // Atkinson's real bold, named in the theme — never a font string here.
  emphasis: explanationStrong,
});
