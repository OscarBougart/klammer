/**
 * The streak — E5.3.
 *
 * Seven squares, not a number climbing to 400. design.md is pointed about
 * this: an ever-growing counter turns a learning habit into a thing you are
 * afraid to lose, and that is the one place a competitor's design does active
 * harm. Seven days is a week. A bad week is survivable and visibly so.
 *
 * It says what it is. Seven boxes with lone letters under a heading meant
 * nothing to someone opening the app for the first time, so the strip has a
 * name and a line of explanation, and it stays hidden until there is at least
 * one day in it worth showing.
 */
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { WeekDay } from '@/content/progression';
import { useSettingsStore } from '@/store/settings';
import { border, fieldLabel, gloss, palette, radius, space } from '@/theme';

export type WeekStripProps = {
  days: WeekDay[];
  /** Set when one missed day can still be repaired today. */
  repairSessionsNeeded?: number;
};

/**
 * Two letters, indexed by `Date.getDay()` (Sunday is 0). One letter repeated
 * S, M and D twice each, which is no way to tell a learner which day is which.
 */
const WEEKDAY = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/**
 * The weekday of a `YYYY-MM-DD` date, read in local time. `new Date(string)`
 * parses a bare date as UTC midnight, which puts every label a day early
 * anywhere west of Greenwich.
 */
function weekdayOf(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return '';
  return WEEKDAY[new Date(y, m - 1, d).getDay()] ?? '';
}

function WeekStripComponent({ days, repairSessionsNeeded = 0 }: WeekStripProps) {
  const showGloss = useSettingsStore((s) => s.showGloss);

  // Nothing played yet: an empty week is noise, not information.
  if (!days.some((d) => d.state === 'done')) return null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.heading}>
        <Text style={styles.title}>Deine Woche</Text>
        <Text style={styles.caption}>
          Ein Feld pro Tag, an dem du übst. Rechts ist heute.
        </Text>
        {showGloss ? (
          <Text style={styles.caption}>
            One square per day you practise. Today is on the right.
          </Text>
        ) : null}
      </View>

      <View
        style={styles.strip}
        accessibilityRole="summary"
        accessibilityLabel={describe(days)}
      >
        {days.map((day) => {
          const done = day.state === 'done';
          return (
            <View
              key={day.date}
              style={[
                styles.square,
                done && styles.done,
                day.state === 'today-pending' && styles.pending,
              ]}
            >
              <Text style={[styles.day, done && styles.dayDone]}>
                {weekdayOf(day.date)}
              </Text>
            </View>
          );
        })}
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
  return `Deine Woche: an ${done} von sieben Tagen geübt`;
}

export default memo(WeekStripComponent);

const styles = StyleSheet.create({
  wrapper: {
    gap: space.sm,
  },
  heading: {
    gap: space.xs,
  },
  title: {
    ...fieldLabel,
    color: palette.kreide,
  },
  caption: gloss,
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
    borderWidth: border.emphasis,
  },
  day: {
    ...fieldLabel,
    color: palette.grau,
  },
  dayDone: {
    // Grey on brass was barely legible; slate on brass is the button pairing.
    color: palette.schiefer,
  },
  repair: {
    ...fieldLabel,
    color: palette.grau,
  },
});
