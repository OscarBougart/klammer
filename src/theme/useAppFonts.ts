/**
 * Font loading — E0.3.
 *
 * Bricolage Grotesque for tiles, field labels and numerals; Atkinson
 * Hyperlegible for running text. Both carry full Latin Extended, so umlauts
 * and ß render at every weight without a fallback swap mid-session.
 *
 * Each face is registered under its own family name — see `fonts` in tokens.ts.
 */
import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
} from '@expo-google-fonts/atkinson-hyperlegible';
import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { useFonts } from 'expo-font';

/**
 * Returns [loaded, error]. The root layout holds the splash until this
 * resolves: a board drawn in a fallback face measures tiles at the wrong width
 * and reflows the whole row when the real face arrives.
 */
export function useAppFonts(): [boolean, Error | null] {
  return useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  });
}
