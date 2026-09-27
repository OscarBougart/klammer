/**
 * The settings gear — Home's header.
 *
 * Settings is somewhere you go rarely, so it does not deserve a full-width
 * button competing with "Üben". A gear in the corner is the convention every
 * phone user already knows. Drawn with react-native-svg, which the Klammer arc
 * already uses, so no icon font is added.
 */
import { memo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { a11y, icon, palette, radius } from '@/theme';

export type GearIconProps = {
  onPress: () => void;
  accessibilityLabel?: string;
};

/** A six-tooth gear on a 24-unit grid. */
const GEAR =
  'M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7 7 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.47.47 0 0 0-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61zM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z';

function GearIconComponent({ onPress, accessibilityLabel = 'Einstellungen' }: GearIconProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      // Static style array: NativeWind drops Pressable's style function.
      style={[styles.button, pressed && styles.pressed]}
    >
      <Svg width={icon.size} height={icon.size} viewBox="0 0 24 24">
        <Path d={GEAR} fill={palette.grau} />
      </Svg>
    </Pressable>
  );
}

export default memo(GearIconComponent);

const styles = StyleSheet.create({
  button: {
    width: a11y.minTouchTarget,
    height: a11y.minTouchTarget,
    borderRadius: radius.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: palette.feld,
  },
});
