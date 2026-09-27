/**
 * The five Stufen, as a path — Home.
 *
 * Shows what exists, where the learner is, and what it takes to move on, so
 * the app's shape is visible from the first screen. It is a syllabus, not a
 * trophy shelf: a passed Stufe gets a check, the current one says what it
 * trains and how many good rounds are in hand, and the rest are named but
 * closed. A Stufe with no sentences yet says so ("bald") instead of pretending
 * to be one more level away.
 *
 * Passed Stufen can be tapped to practise; the current one is selected by
 * default. Locked rows are not buttons.
 */
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ADVANCE_SESSIONS } from '@/content/progression';
import { TIERS } from '@/content/tiers';
import { a11y, border, explanation, gloss, levelName, palette, radius, space } from '@/theme';

export type LevelPathProps = {
  /** The learner's Stufe. */
  current: number;
  /** The Stufe the play button will start. */
  selected: number;
  /** The highest Stufe with sentences; anything above is "bald". */
  highestPlayable: number;
  /** Good rounds in a row toward the next Stufe. */
  goodRounds: number;
  /** Whether the English gloss is shown under the German. */
  showGloss: boolean;
  onSelect: (tier: number) => void;
};

type RowState = 'done' | 'current' | 'locked' | 'soon';

/** The rail's dots: a little larger than body text, so the path reads first. */
const DOT = space.lg + space.xs;

function LevelPathComponent({
  current,
  selected,
  highestPlayable,
  goodRounds,
  showGloss,
  onSelect,
}: LevelPathProps) {
  return (
    <View style={styles.list} accessibilityRole="list">
      {TIERS.map((info, i) => {
        const state: RowState =
          info.tier < current
            ? 'done'
            : info.tier === current
              ? 'current'
              : info.tier > highestPlayable
                ? 'soon'
                : 'locked';
        const pressable = state === 'done' || state === 'current';
        const isSelected = info.tier === selected;
        const isLast = i === TIERS.length - 1;
        // The last Stufe with content has nothing to advance into.
        const showProgress = state === 'current' && current < highestPlayable;

        const status =
          state === 'done' ? 'geschafft' : state === 'soon' ? 'bald' : state === 'locked' ? 'gesperrt' : '';

        return (
          <Pressable
            key={info.tier}
            onPress={pressable ? () => onSelect(info.tier) : undefined}
            disabled={!pressable}
            accessibilityRole={pressable ? 'button' : undefined}
            accessibilityState={{ selected: isSelected, disabled: !pressable }}
            accessibilityLabel={`Stufe ${info.tier}, ${info.name}${status ? `, ${status}` : ''}${
              showProgress ? `, ${goodRounds} von ${ADVANCE_SESSIONS} guten Runden` : ''
            }`}
            style={[styles.row, isSelected && styles.rowSelected]}
          >
            {/* The rail: a dot per Stufe, joined by a line. */}
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  state === 'done' && styles.dotDone,
                  state === 'current' && styles.dotCurrent,
                ]}
              >
                {state === 'done' ? <Text style={styles.check}>✓</Text> : null}
              </View>
              {isLast ? null : (
                <View style={[styles.line, state === 'done' && styles.lineDone]} />
              )}
            </View>

            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text
                  style={[styles.name, !pressable && styles.muted]}
                  maxFontSizeMultiplier={a11y.maxDynamicTypeScale}
                >
                  <Text style={styles.number}>{info.tier}  </Text>
                  {info.name}
                </Text>
                {status ? <Text style={styles.status}>{status}</Text> : null}
              </View>

              {isSelected ? (
                <View style={styles.detail}>
                  <Text style={styles.rule}>{info.de}</Text>
                  {showGloss ? <Text style={styles.gloss}>{info.en}</Text> : null}
                  {showProgress ? (
                    <View style={styles.progress}>
                      <View style={styles.bars}>
                        {Array.from({ length: ADVANCE_SESSIONS }, (_, n) => (
                          <View key={n} style={[styles.bar, n < goodRounds && styles.barOn]} />
                        ))}
                      </View>
                      <Text style={styles.gloss}>
                        {goodRounds} von {ADVANCE_SESSIONS} guten Runden
                      </Text>
                    </View>
                  ) : null}
                  {showProgress && showGloss ? (
                    <Text style={styles.gloss}>A good round is 8 of 10 right.</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default memo(LevelPathComponent);

const styles = StyleSheet.create({
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    gap: space.md,
    minHeight: a11y.minTouchTarget + space.sm,
    paddingHorizontal: space.sm,
    borderRadius: radius.field,
    borderWidth: border.hairline,
    borderColor: 'transparent',
  },
  rowSelected: {
    backgroundColor: palette.feld,
    borderColor: palette.kante,
  },
  rail: {
    width: DOT,
    alignItems: 'center',
    paddingTop: space.md,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: border.emphasis,
    borderColor: palette.grau,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    borderColor: palette.messing,
  },
  dotCurrent: {
    borderColor: palette.messing,
    backgroundColor: palette.messing,
  },
  check: {
    ...gloss,
    color: palette.messing,
    lineHeight: DOT - border.emphasis * 2,
  },
  line: {
    flex: 1,
    width: border.emphasis,
    marginTop: space.xs,
    backgroundColor: palette.kante,
  },
  lineDone: {
    backgroundColor: palette.messing,
  },
  body: {
    flex: 1,
    paddingVertical: space.md,
    gap: space.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  name: {
    ...levelName,
    flexShrink: 1,
  },
  number: {
    ...levelName,
    color: palette.grau,
  },
  muted: {
    color: palette.grau,
  },
  status: gloss,
  detail: {
    gap: space.xs,
  },
  rule: explanation,
  gloss,
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.xs,
  },
  bars: {
    flexDirection: 'row',
    gap: space.xs,
  },
  bar: {
    width: space.xl,
    height: space.sm,
    borderRadius: space.xs,
    backgroundColor: palette.kante,
  },
  barOn: {
    backgroundColor: palette.messing,
  },
});
