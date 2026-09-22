/**
 * The Klammer arc — E3.2.
 *
 * design.md §6: the app's one orchestrated moment. When both bracket halves
 * are filled correctly the arc draws left to right over 420ms with a slight
 * overshoot, and one sharp haptic lands on arrival. Nothing else in the app
 * has a signature animation, which is what makes this one mean something.
 *
 * Success is the arc completing in brass — not a green tick. Colour never
 * carries the meaning alone: the arc's *shape* closing is the signal, so it
 * still reads for a colourblind player and in a screenshot.
 */
import * as Haptics from 'expo-haptics';
import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useSettingsStore } from '@/store/settings';
import { arc, duration, palette } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type KlammerArcProps = {
  /** Draw the arc. Going false resets it without animating. */
  closed: boolean;
  /**
   * A dimmer brass for a marked order — design.md §4 gives
   * `ungewoehnlich` the same closing arc in a dimmer tone.
   */
  dimmed?: boolean;
  width: number;
  height?: number;
};


function KlammerArcComponent({
  closed,
  dimmed = false,
  width,
  height = arc.height,
}: KlammerArcProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  // The arc is drawn as a stroked path revealed by its dash offset, which is
  // the only way to animate "drawing" a line in SVG.
  const length = width + height * 2;

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

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      <Svg width={width} height={height}>
        {/*
          Down from the left bracket, across, and back up to the right one —
          the shape of a composing stick holding the sentence together.
        */}
        <AnimatedPath
          d={`M ${arc.stroke} 0 L ${arc.stroke} ${height - arc.stroke} L ${width - arc.stroke} ${height - arc.stroke} L ${width - arc.stroke} 0`}
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

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
});
