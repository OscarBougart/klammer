/**
 * A tile — E2.3 / E2.8.
 *
 * design.md §6: type slugs, not chips. Radius 6, a hard offset shadow with no
 * blur, a chalk face and slate type. The finite verb's face turns brass once
 * it is correctly placed, before the full check, so the sentence's anchor is
 * visible while the learner is still working.
 *
 * Tiles render `neutralSurface`, never `surface`. A capitalised tile in the
 * tray announces that it belongs in the Vorfeld, which gives the puzzle away.
 * Capitalisation happens on placement, with a visible flip — see below.
 */
import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  a11y,
  border,
  duration,
  palette,
  radius,
  shadow,
  space,
  tileText,
} from '@/theme';

export type TileProps = {
  /** Chunk id. Stable; the board addresses tiles by this. */
  id: string;
  /** The neutral form — lowercase unless the word is a noun or a name. */
  neutralSurface: string;
  /**
   * True once the tile sits first in the Vorfeld.
   *
   * The flip is not decoration, it is the lesson: German capitalises
   * sentence-initially regardless of what goes there, and watching the same
   * word arrive lowercase and turn over teaches that more quietly than a rule
   * box would.
   */
  capitalised?: boolean;
  /** The finite verb, once correctly placed. Face goes brass. */
  isFiniteAnchor?: boolean;
  /**
   * Lifted by a drag — raises the shadow offset. The scale belongs to the
   * dragging wrapper's transform, not here, or the two would compound.
   */
  isLifted?: boolean;
  /** Selected by tap-to-place, waiting for a destination. */
  isSelected?: boolean;
  /** Names the field the tile currently sits in, for the screen reader. */
  fieldName?: string;
  onPress?: () => void;
};

/** Capitalising the first letter, leaving the rest of a compound alone. */
export function capitalise(value: string): string {
  if (value.length === 0) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function TileComponent({
  neutralSurface,
  capitalised = false,
  isFiniteAnchor = false,
  isLifted = false,
  isSelected = false,
  fieldName,
  onPress,
}: TileProps) {
  const reducedMotion = useReducedMotion();

  /**
   * The text actually on the face. Held in state rather than derived so the
   * swap can be timed to the middle of the flip: at 90° the tile is edge-on
   * and the change is invisible, which is what makes it read as one object
   * turning over rather than two words crossfading.
   */
  const [shown, setShown] = useState(() =>
    capitalised ? capitalise(neutralSurface) : neutralSurface,
  );

  const spin = useSharedValue(0);

  useEffect(() => {
    const target = capitalised ? capitalise(neutralSurface) : neutralSurface;
    if (target === shown) return;

    if (reducedMotion) {
      // The information is the changed letter, not the movement.
      setShown(target);
      return;
    }

    const half = duration.capitaliseFlip / 2;

    spin.value = withSequence(
      withTiming(90, { duration: half }, (finished) => {
        'worklet';
        if (finished) runOnJS(setShown)(target);
      }),
      withTiming(0, { duration: half }),
    );
  }, [capitalised, neutralSurface, shown, reducedMotion, spin]);

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 400 }, { rotateX: `${spin.value}deg` }],
  }));

  // German, matching the board. See the note on `a11yLabel` in fields.ts.
  const label = fieldName ? `${shown}, in ${fieldName}` : `${shown}, in der Ablage`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      style={[styles.tile, isSelected && styles.selected]}
    >
      {/*
        The shadow is a sibling view rather than a shadow* style: iOS and
        Android disagree about shadow rendering, and design.md is specific
        that this is a hard offset with zero blur. A drawn rectangle behaves
        identically on both.
      */}
      <View
        style={[styles.shadow, isLifted && styles.shadowLifted]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.face, isFiniteAnchor && styles.faceFinite, faceStyle]}
      >
        {/*
          No numberOfLines cap. design.md §10 asks for tiles that wrap rather
          than truncate, and a cap is truncation — at 200% type a compound
          like `wegen der Erkältung` needs more than two lines, and an ellipsis
          would hide part of the puzzle the learner has to solve.

          maxFontSizeMultiplier honours dynamic type up to the 200% the design
          promises and stops there, so a user at 300% gets a board that still
          holds together rather than one tile filling the screen.
        */}
        <Text
          style={styles.text}
          maxFontSizeMultiplier={a11y.maxDynamicTypeScale}
        >
          {shown}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default memo(TileComponent);

const styles = StyleSheet.create({
  tile: {
    // A floor, never a fixed height — the face grows with the text so a tile
    // at 200% type gets taller instead of clipping.
    minHeight: a11y.minTouchTarget,
    justifyContent: 'center',
  },
  face: {
    backgroundColor: palette.kreide,
    borderRadius: radius.tile,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minHeight: a11y.minTouchTarget,
    justifyContent: 'center',
  },
  faceFinite: {
    backgroundColor: palette.messing,
  },
  shadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: shadow.tileRest.offsetY,
    bottom: -shadow.tileRest.offsetY,
    backgroundColor: shadow.tileRest.color,
    borderRadius: radius.tile,
  },
  shadowLifted: {
    top: shadow.tileLifted.offsetY,
    bottom: -shadow.tileLifted.offsetY,
  },
  selected: {
    // Tap-to-place must be visible without colour alone carrying the meaning,
    // so the selected tile is outlined rather than merely tinted.
    borderWidth: border.emphasis,
    borderColor: palette.messing,
    borderRadius: radius.tile,
  },
  text: tileText,
});
