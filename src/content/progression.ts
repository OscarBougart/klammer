/**
 * Tier advancement and the streak — E5.1 / E5.3.
 *
 * design.md §7, and the one place it is explicit about a competitor:
 *
 *   "Streak, gently. A seven-day week strip, not a number that climbs to 400.
 *    One missed day greys out; two missed days reset. A missed day can be
 *    repaired by doing two sessions the next day. This is the one place where
 *    Duolingo's design does active harm and it costs nothing to avoid."
 *
 * Pure functions over explicit inputs, so both rules can be tested at any date
 * and any history rather than observed in the wild.
 */
import { previousDate } from './dates';

export const MAX_TIER = 5;

/** Sessions needed at the threshold before a tier opens up. */
export const ADVANCE_SESSIONS = 3;

/** Correct answers out of ten required in each of them. */
export const ADVANCE_THRESHOLD = 8;

/**
 * Whether the learner has earned the next tier — 8/10 correct across three
 * consecutive sessions.
 *
 * `recentCorrect` is the correct-count of the last sessions, newest first.
 * All three accepted classes count as correct: someone who reaches for a
 * marked-but-grammatical order has not made a mistake.
 */
export function shouldAdvanceTier(
  currentTier: number,
  recentCorrect: readonly number[],
): boolean {
  if (currentTier >= MAX_TIER) return false;
  if (recentCorrect.length < ADVANCE_SESSIONS) return false;

  // Consecutive means the three most recent, not the best three ever.
  return recentCorrect
    .slice(0, ADVANCE_SESSIONS)
    .every((correct) => correct >= ADVANCE_THRESHOLD);
}

/** One square in the week strip. */
export type DayState = 'done' | 'missed' | 'future' | 'today-pending';

export type WeekDay = {
  /** YYYY-MM-DD. */
  date: string;
  state: DayState;
};

/**
 * The seven-day strip ending today.
 *
 * Takes the set of dates a session was completed on, which is the honest
 * source — deriving squares from a streak counter would show a filled day the
 * learner did not actually play.
 */
export function weekStrip(
  playedDates: ReadonlySet<string>,
  today: string,
  todayDate: Date = new Date(),
): WeekDay[] {
  const days: WeekDay[] = [];

  // Walk back six days, then reverse, so the strip reads left to right.
  let cursor = todayDate;
  const dates: string[] = [today];
  for (let i = 0; i < 6; i += 1) {
    const previous = previousDate(cursor);
    dates.push(previous);
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }
  dates.reverse();

  for (const date of dates) {
    if (playedDates.has(date)) {
      days.push({ date, state: 'done' });
    } else if (date === today) {
      days.push({ date, state: 'today-pending' });
    } else {
      days.push({ date, state: 'missed' });
    }
  }

  return days;
}

export type StreakStatus = {
  days: number;
  /** True when one day was missed and two sessions today would repair it. */
  repairable: boolean;
  /** Sessions still needed today to repair. */
  repairSessionsNeeded: number;
};

/**
 * Where the streak stands, and whether it can still be saved.
 *
 * The repair rule is the point: one missed day does not destroy the streak, it
 * offers a way back. Two missed days reset, because at that point pretending
 * otherwise would make the streak meaningless.
 */
export function streakStatus(params: {
  streakDays: number;
  lastSessionDate: string | null;
  sessionsToday: number;
  today: string;
  yesterday: string;
  dayBeforeYesterday: string;
}): StreakStatus {
  const {
    streakDays,
    lastSessionDate,
    sessionsToday,
    today,
    yesterday,
    dayBeforeYesterday,
  } = params;

  if (!lastSessionDate) {
    return { days: 0, repairable: false, repairSessionsNeeded: 0 };
  }

  // Played today, or yesterday and still in time: the streak is intact.
  if (lastSessionDate === today || lastSessionDate === yesterday) {
    return { days: streakDays, repairable: false, repairSessionsNeeded: 0 };
  }

  // Exactly one day missed — two sessions today puts it back.
  if (lastSessionDate === dayBeforeYesterday) {
    return {
      days: streakDays,
      repairable: true,
      repairSessionsNeeded: Math.max(0, 2 - sessionsToday),
    };
  }

  // Two or more missed. Reset, without comment — no guilt-trip copy.
  return { days: 0, repairable: false, repairSessionsNeeded: 0 };
}
