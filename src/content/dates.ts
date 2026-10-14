/**
 * Local calendar dates for the streak — design.md §7.
 *
 * Streaks are a *local calendar* notion, not an elapsed-hours one: someone
 * playing at 23:50 and again at 00:10 has played on two days, and someone
 * playing at 09:00 and 21:00 has played on one. Using timestamps and dividing
 * by 86400 gets both wrong, and gets them wrong differently depending on the
 * learner's timezone.
 */

/** YYYY-MM-DD in the device's own timezone. */
export function localDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** The local date one day before the given one. */
export function previousDate(date: Date = new Date()): string {
  const shifted = new Date(date);
  // setDate handles month and year rollover, and — unlike subtracting 86400
  // seconds — it stays correct across a daylight-saving change, where a local
  // day can be 23 or 25 hours long.
  shifted.setDate(shifted.getDate() - 1);
  return localDate(shifted);
}
