/**
 * A tile you can drag — E2.4 / E2.5.
 *
 * The gesture is the product, so everything here stays on the UI thread: the
 * tile follows the finger through shared values, the drop target is hit-tested
 * in a worklet against pre-measured rects, and the only hop to JavaScript is
 * the placement itself once the finger is up.
 *
 * Motion (design.md §6): lift raises the shadow to 5px and scales to 1.04,
 * settle is a spring at damping 18 / stiffness 220, snap is 110ms and carries
 * a light haptic. Reduced motion replaces every spring with a 120ms fade-in of
 * the final position — the tile still moves, it just does not bounce.
 */
import * as Haptics from 'expo-haptics';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, type View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type WithSpringConfig,
} from 'react-native-reanimated';

import Tile, { type TileProps } from './Tile';
import { useSettingsStore } from '@/store/settings';
import { useDragContext, zoneAt } from './dragContext';
import type { FieldId } from './fields';
import { border, duration, palette, radius, scale, shake, spring } from '@/theme';

const SPRING: WithSpringConfig = {
  damping: spring.damping,
  stiffness: spring.stiffness,
};

export type DraggableTileProps = TileProps & {
  /**
   * Called when the tile is released over a zone, with the drop point in
   * window coordinates so the board can work out where in the zone it landed.
   */
  onDropInto: (field: FieldId, dropX: number, dropY: number) => void;
  /** Called when the tile is released over nothing. */
  onDropOutside?: () => void;
  /**
   * Bumped to shake this tile — design.md §6 shakes the *offending* tile, not
   * the screen. A counter rather than a boolean so two wrong answers in a row
   * both register.
   */
  shakeNonce?: number;
};

function DraggableTileComponent({
  onDropInto,
  onDropOutside,
  shakeNonce = 0,
  ...tileProps
}: DraggableTileProps) {
  const { zones, registerTile, draggingTileId } = useDragContext();
  const reducedMotion = useReducedMotion();

  const wrapperRef = useRef<View>(null);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const lifted = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const flagged = useSharedValue(0);

  /**
   * Drives the tile's raised shadow. This is React state rather than a shared
   * value because the shadow lives inside the plain `Tile`, and it is set
   * exactly twice per gesture — on lift and on release — never per frame, so
   * the drag itself stays entirely on the UI thread.
   */
  const [isLifted, setIsLifted] = useState(false);

  // Haptics are side effects and cannot run in a worklet.
  const onLift = useCallback(() => {
    setIsLifted(true);
    if (!useSettingsStore.getState().haptics) return;
    Haptics.selectionAsync().catch(() => {
      // A device without a taptic engine is not an error worth surfacing.
    });
  }, []);

  const onRelease = useCallback(() => setIsLifted(false), []);

  /**
   * Publishes this tile's resting rect so a later drop can be positioned
   * against it. Fires on layout — including every reflow — and never during a
   * gesture, since a dragged tile moves by transform and does not re-lay-out.
   */
  const handleLayout = useCallback(() => {
    wrapperRef.current?.measureInWindow((x, y, width, height) => {
      if (width === 0 && height === 0) return;
      registerTile(tileProps.id, { x, y, width, height });
    });
  }, [registerTile, tileProps.id]);

  const onSnap = useCallback(() => {
    if (!useSettingsStore.getState().haptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const pan = Gesture.Pan()
    .onStart(() => {
      lifted.value = withTiming(1, { duration: duration.snap });
      draggingTileId.value = tileProps.id;
      runOnJS(onLift)();
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const target = zoneAt(zones.value, event.absoluteX, event.absoluteY);

      lifted.value = withTiming(0, { duration: duration.snap });
      draggingTileId.value = null;
      runOnJS(onRelease)();

      // The tile returns to the origin either way: on a hit the board
      // re-renders it inside its new zone, on a miss it belongs where it was.
      // Snapping back first means no frame shows it in two places.
      const settle = (value: number) =>
        reducedMotion
          ? withTiming(value, { duration: duration.reducedFade })
          : withSpring(value, SPRING);

      translateX.value = settle(0);
      translateY.value = settle(0);

      if (target) {
        runOnJS(onSnap)();
        runOnJS(onDropInto)(target, event.absoluteX, event.absoluteY);
      } else if (onDropOutside) {
        runOnJS(onDropOutside)();
      }
    });

  /**
   * Wrong answers shake the offending tile 3px, twice, at 90ms a leg. No
   * screen flash and no full-board shake — the point is to say *this* tile,
   * not "everything is wrong".
   *
   * Under reduced motion the tile takes a static outline instead. The
   * information is "this one", and an outline carries that without moving.
   */
  useEffect(() => {
    if (shakeNonce === 0) return;

    if (reducedMotion) {
      flagged.value = 1;
      return;
    }

    shakeX.value = withRepeat(
      withSequence(
        withTiming(-shake.distance, { duration: duration.shakeLeg / 2 }),
        withTiming(shake.distance, { duration: duration.shakeLeg }),
        withTiming(0, { duration: duration.shakeLeg / 2 }),
      ),
      shake.legs,
      false,
    );
  }, [shakeNonce, reducedMotion, shakeX, flagged]);

  // A new attempt clears the previous one's mark.
  useEffect(() => {
    if (shakeNonce === 0) flagged.value = 0;
  }, [shakeNonce, flagged]);

  const animatedStyle = useAnimatedStyle(() => ({
    // Invisible at width 0; the reduced-motion path raises it to mark the
    // tile that has to move.
    borderColor: palette.ziegel,
    borderWidth: flagged.value * border.emphasis,
    borderRadius: radius.tile,
    transform: [
      { translateX: translateX.value + shakeX.value },
      { translateY: translateY.value },
      {
        scale:
          scale.tileRest +
          lifted.value * (scale.tileLifted - scale.tileRest),
      },
    ],
    // A lifted tile must clear the zones it passes over.
    zIndex: lifted.value > 0 ? 10 : 0,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        ref={wrapperRef}
        onLayout={handleLayout}
        // When the board's order changes — a tile reflowing to make room, or
        // the single-tile correction being applied — the tile glides to its
        // new position instead of teleporting. Reduced motion skips it, since
        // the destination is the information, not the journey.
        {...(reducedMotion
          ? {}
          : { layout: LinearTransition.duration(duration.arcDraw / 2) })}
        style={[styles.container, animatedStyle]}
      >
        <Tile {...tileProps} isLifted={isLifted} />
      </Animated.View>
    </GestureDetector>
  );
}

export default memo(DraggableTileComponent);

const styles = StyleSheet.create({
  container: {
    // The tile sizes itself; this wrapper only carries the transform.
    alignSelf: 'flex-start',
  },
});
