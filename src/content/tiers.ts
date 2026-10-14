/**
 * The Stufen, by name and by what they train — design.md §2.
 *
 * Shared by Home, the level path and the unlock screen, so a tier is named
 * the same everywhere.
 */
import { MAX_TIER } from './progression';
import { seed } from './seed';

export type TierInfo = {
  tier: number;
  /** The grammar's name for it, shown as the Stufe's title. */
  name: string;
  /** What it trains, in one line, German then English. */
  de: string;
  en: string;
};

export const TIERS: readonly TierInfo[] = [
  { tier: 1, name: 'Position zwei', de: 'Das Verb steht an Position 2.', en: 'The verb goes in position 2.' },
  {
    tier: 2,
    name: 'Die Klammer',
    de: 'Das Verb teilt sich: ein Teil vorn, der Rest am Ende.',
    en: 'The verb splits: one part early, the rest at the end.',
  },
  {
    tier: 3,
    name: 'Das Mittelfeld',
    de: 'Die Ordnung in der Mitte: Pronomen, Zeit, Grund, Art, Ort.',
    en: 'The order in the middle: pronouns, time, reason, manner, place.',
  },
  {
    tier: 4,
    name: 'Der Nebensatz',
    de: 'Im Nebensatz steht das Verb am Ende.',
    en: 'In a subordinate clause the verb goes last.',
  },
  {
    tier: 5,
    name: 'Das Nachfeld',
    de: 'Was hinter der Klammer stehen darf.',
    en: 'What may come after the bracket.',
  },
];

export function tierInfo(tier: number): TierInfo | undefined {
  return TIERS.find((t) => t.tier === tier);
}

/**
 * The Stufe most of these sentences belong to — how a resumed session's
 * tier is recovered, since a session also mixes in due reviews from others.
 */
export function majorityTier(sentences: readonly { tier: number }[], fallback: number): number {
  const counts = new Map<number, number>();
  for (const s of sentences) counts.set(s.tier, (counts.get(s.tier) ?? 0) + 1);
  let best = fallback;
  let bestCount = 0;
  for (const [tier, count] of counts) {
    if (count > bestCount) {
      best = tier;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The highest Stufe that has sentences to play. Stufen above it are shown as
 * coming, never unlocked: a promotion into an empty tier is no reward.
 */
export const HIGHEST_PLAYABLE_TIER = Math.min(
  MAX_TIER,
  seed.sentences.reduce((max, s) => Math.max(max, s.tier), 1),
);
