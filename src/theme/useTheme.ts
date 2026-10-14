/**
 * The current theme — design.md §6.
 *
 * Dark is the shipping default; light is a setting. A theme is a palette plus
 * the type scale drawn in it, built once per theme and shared, so switching
 * never allocates per render.
 *
 * Style sheets are built with `makeStyles`, which returns a hook: the sheet is
 * created once per theme and every screen re-renders in the new colours the
 * moment the setting changes. No restart.
 */
import { useSettingsStore } from '@/store/settings';

import { palettes, type Palette, type ThemeName } from './tokens';
import { typeScale, type TypeScale } from './type';

export type Theme = {
  name: ThemeName;
  palette: Palette;
  type: TypeScale;
  /** For the status bar: light content on the dark theme, dark on light. */
  statusBar: 'light' | 'dark';
};

const THEMES: Record<ThemeName, Theme> = {
  dark: { name: 'dark', palette: palettes.dark, type: typeScale(palettes.dark), statusBar: 'light' },
  light: {
    name: 'light',
    palette: palettes.light,
    type: typeScale(palettes.light),
    statusBar: 'dark',
  },
};

export function useTheme(): Theme {
  const name = useSettingsStore((s) => s.theme);
  return THEMES[name];
}

/**
 * Turns a style factory into a hook. The factory runs at most once per theme.
 *
 *   const useStyles = makeStyles(({ palette, type }) => StyleSheet.create({ … }));
 *   const styles = useStyles();
 */
export function makeStyles<T>(factory: (theme: Theme) => T): () => T {
  const cache = new Map<ThemeName, T>();
  return function useStyles(): T {
    const theme = useTheme();
    let styles = cache.get(theme.name);
    if (styles === undefined) {
      styles = factory(theme);
      cache.set(theme.name, styles);
    }
    return styles;
  };
}
