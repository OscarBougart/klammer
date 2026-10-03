/**
 * The Klammer arc — E3.2.
 *
 * design.md §6: the app's one orchestrated moment. When the sentence is right
 * the bracket draws over 420ms with a slight overshoot, and one sharp haptic
 * lands on arrival. Nothing else in the app has a signature animation, which
 * is what makes this one mean something.
 *
 * The board stacks its fields vertically, so the bracket runs down its left
 * edge: from the left bracket (the finite verb) to the right bracket (the rest
 * of the verb), tying the two together the way the grammar does. A faint
 * outline of it is always there once the tier has a bracket, so the pairing is
 * visible before the learner has earned the brass.
 *
 * Success is the arc completing in brass — not a green tick. Colour never
 * carries the meaning alone: the arc's *shape* closing is the signal, so it
 * still reads for a colourblind player and in a screenshot.
 */
import * as Haptics from 'expo-haptics';
import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useSettingsStore } from '@/store/settings';
import { arc, duration, makeStyles, useTheme } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type KlammerArcProps = {
  /** Draw the arc. Going false resets it without animating. */
  closed: boolean;
  /**
   * A dimmer brass for a marked order — design.md §4 gives
   * `ungewoehnlich` the same closing arc in a dimmer tone.
   */
  dimmed?: boolean;
  /** Where the arc starts, from the top of its container: the left bracket. */
  top: number;
  /** How far down it runs: to the middle of the right bracket. */
  span: number;
};

function KlammerArcComponent({ closed, dimmed = false, top, span }: KlammerArcProps) {
  const styles = useStyles();
  const { palette } = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  const width = arc.gutter;
  const height = span + arc.stroke * 2;
  const x = width - arc.tick;
  const bottom = height - arc.stroke;

  // A "[": in from the left bracket, down the edge, back out to the right one.
  const d = `M ${width} ${arc.stroke} L ${x} ${arc.stroke} L ${x} ${bottom} L ${width} ${bottom}`;

  // The arc is drawn as a stroked path revealed by its dash offset, which is
  // the only way to animate "drawing" a line in SVG.
  const length = arc.tick * 2 + span;

  const onArrival = () => {
    if (!useSettingsStore.getState().haptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  useEffect(() => {
    if (!closed) {
      progress.value = 0;
      return;
    }

    if (reducedMotion) {
      // Reduced motion: the arc appears rather than draws. It still lands, and
      // the haptic still fires — the information is in the arrival.
      progress.value = 1;
      onArrival();
      return;
    }

    progress.value = withTiming(
      1,
      {
        duration: duration.arcDraw,
        // back-out: overshoots slightly and settles, so the bracket lands
        // rather than merely arriving.
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      },
      (finished) => {
        'worklet';
        if (finished) runOnJS(onArrival)();
      },
    );
  }, [closed, reducedMotion, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - progress.value),
  }));

  if (span <= 0) return null;

  return (
    <View
      style={[styles.container, { top: top - arc.stroke, width, height }]}
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Svg width={width} height={height}>
        <Path
          d={d}
          stroke={palette.grau}
          strokeOpacity={arc.ghostOpacity}
          strokeWidth={arc.stroke}
          fill="none"
          strokeLinecap="round"
        />
        <AnimatedPath
          d={d}
          stroke={dimmed ? palette.grau : palette.messing}
          strokeWidth={arc.stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={length}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}

export default memo(KlammerArcComponent);

const useStyles = makeStyles(({ palette, type }) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
    },
  }),
);
