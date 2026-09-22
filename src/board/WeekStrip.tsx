/**
 * The streak — E5.3.
 *
 * Seven squares, not a number climbing to 400. design.md is pointed about
 * this: an ever-growing counter turns a learning habit into a thing you are
 * afraid to lose, and that is the one place a competitor's design does active
 * harm. Seven days is a week. A bad week is survivable and visibly so.
 */
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { WeekDay } from '@/content/progression';
import { border, fieldLabel, palette, radius, space } from '@/theme';

export type WeekStripProps = {
  days: WeekDay[];
  /** Set when one missed day can still be repaired today. */
  repairSessionsNeeded?: number;
};

/** Single letters, Monday-first is wrong here — the strip ends on today. */
const INITIAL = ['S', 'M', 'D', 'M', 'D', 'F', 'S'];

function WeekStripComponent({ days, repairSessionsNeeded = 0 }: WeekStripProps) {
  return (
    <View style={styles.wrapper}>
      <View
        style={styles.strip}
        accessibilityRole="summary"
        accessibilityLabel={describe(days)}
      >
        {days.map((day, i) => (
          <View
            key={day.date}
            style={[
              styles.square,
              day.state === 'done' && styles.done,
              day.state === 'today-pending' && styles.pending,
            ]}
          >
            <Text style={styles.initial}>
              {INITIAL[new Date(day.date).getDay()] ?? INITIAL[i]}
            </Text>
          </View>
        ))}
      </View>

      {repairSessionsNeeded > 0 ? (
        // The repair offer, stated plainly and without alarm. No countdown
        // timer, no flames, no "don't lose your streak!".
        <Text style={styles.repair}>
          {repairSessionsNeeded === 1
            ? 'Noch eine Sitzung heute, dann ist die Serie gerettet.'
            : 'Zwei Sitzungen heute retten die Serie.'}
        </Text>
      ) : null}
    </View>
  );
}

function describe(days: WeekDay[]): string {
  const done = days.filter((d) => d.state === 'done').length;
  return `${done} von sieben Tagen geübt`;
}

export default memo(WeekStripComponent);

const styles = StyleSheet.create({
  wrapper: {
    gap: space.sm,
  },
  strip: {
    flexDirection: 'row',
    gap: space.sm,
  },
  square: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.tile,
    borderWidth: border.hairline,
    borderColor: palette.kante,
    backgroundColor: palette.feld,
    alignItems: 'center',
    justifyContent: 'center',
  },
  done: {
    backgroundColor: palette.messing,
  },
  pending: {
    // Today is outlined rather than filled — it has not happened yet, and
    // showing it as missed before the day is over would be a lie.
    borderColor: palette.messing,
  },
  initial: {
    ...fieldLabel,
    color: palette.grau,
  },
  repair: {
    ...fieldLabel,
    color: palette.grau,
  },
});
