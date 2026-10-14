/**
 * The app's one button.
 *
 * Every screen had its own copy of the same Pressable, and they had drifted:
 * body-size labels on the main action, a secondary that was bare grey text
 * with nothing marking it as pressable. One component keeps the primary action
 * unmistakable and the secondary one visibly a button.
 *
 *   primary    brass face, slate label. At most one per screen.
 *   secondary  outlined in chalk-grey. Alternatives to the primary action.
 */
import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { a11y, border, makeStyles, radius, space } from '@/theme';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  /** Defaults to the visible label; set it when the label alone is ambiguous. */
  accessibilityLabel?: string;
  /** Read after the label, e.g. why the button is disabled. */
  accessibilityHint?: string;
};

function ButtonComponent({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const styles = useStyles();
  const primary = variant === 'primary';

  // Pressed state is tracked by hand rather than with Pressable's style
  // function: NativeWind v4 wraps Pressable and drops a function `style`,
  // which left the primary button with no background, so its slate label
  // vanished into the slate screen.
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      {...(accessibilityHint ? { accessibilityHint } : {})}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        primary ? styles.primary : styles.secondary,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[styles.label, primary && styles.labelPrimary]}
        maxFontSizeMultiplier={a11y.maxDynamicTypeScale}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default memo(ButtonComponent);

const useStyles = makeStyles(({ palette, type }) =>
  StyleSheet.create({
    base: {
      // The touch-target floor and no more: the session screen stacks the board,
      // the verdict and up to three buttons without a scroll view.
      minHeight: a11y.minTouchTarget,
      borderRadius: radius.tile,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.xl,
      paddingVertical: space.sm,
    },
    primary: {
      backgroundColor: palette.messing,
    },
    secondary: {
      borderWidth: border.hairline,
      borderColor: palette.grau,
    },
    pressed: {
      // No soft shadows anywhere in the app, so pressing dims rather than sinks.
      opacity: 0.8,
    },
    disabled: {
      // Quieter, not invisible: the learner should see where the button is
      // before they are able to press it.
      opacity: 0.4,
    },
    label: {
      ...type.buttonLabel,
      textAlign: 'center',
    },
    labelPrimary: {
      color: palette.schiefer,
    },
  }),
);
