/**
 * One field zone on the board — E2.2.
 *
 * Flexible width, wraps to two lines rather than truncating, and accepts
 * anything. The zone is a drop target for drag and a destination for
 * tap-to-place; both paths end in the same `onDrop`.
 *
 * The label sits above the zone and says both what the field is called and
 * what goes in it. The name is the grammar's own vocabulary; the hint is what
 * makes it usable on first sight.
 */
import { memo, useCallback, useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { useDragContext } from './dragContext';
import type { Field } from './fields';
import { a11y, border, fieldLabel, palette, radius, space } from '@/theme';

/** A zone's box, in the coordinates of the list of zones it sits in. */
export type ZoneBox = { y: number; height: number };

export type FieldZoneProps = {
  field: Field;
  /** Tiles already in this zone, rendered by the caller. */
  children?: ReactNode;
  /** How many tiles are here — drives the empty state and the a11y label. */
  count: number;
  /**
   * True while a tile is selected by tap-to-place, so the zone can advertise
   * itself as somewhere that tile could go.
   */
  isAwaitingPlacement?: boolean;
  onDrop?: () => void;
  /** Where the zone's box sits in its parent — the bracket is drawn from it. */
  onBoxLayout?: (box: ZoneBox) => void;
};

function FieldZoneComponent({
  field,
  children,
  count,
  isAwaitingPlacement = false,
  onDrop,
  onBoxLayout,
}: FieldZoneProps) {
  const isFull = field.capacity === 'single' && count >= 1;
  const { registerZone } = useDragContext();
  const viewRef = useRef<View>(null);

  // The box's position in its parent is the wrapper's offset plus the box's
  // offset inside the wrapper, and the two arrive in separate layout events.
  const wrapperY = useRef<number | null>(null);
  const box = useRef<ZoneBox | null>(null);

  const report = useCallback(() => {
    if (!onBoxLayout || wrapperY.current === null || box.current === null) return;
    onBoxLayout({ y: wrapperY.current + box.current.y, height: box.current.height });
  }, [onBoxLayout]);

  /**
   * Publishes this zone's window rect for the drag worklet to hit-test
   * against. Measured on layout rather than on drop: measuring during the
   * frame a tile is released is exactly the work a cheap Android device
   * cannot afford.
   */
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      box.current = { y, height };
      report();

      viewRef.current?.measureInWindow((wx, wy, width, h) => {
        if (width === 0 && h === 0) return;
        registerZone(field.id, { x: wx, y: wy, width, height: h });
      });
    },
    [field.id, registerZone, report],
  );

  const handleWrapperLayout = useCallback(
    (event: LayoutChangeEvent) => {
      wrapperY.current = event.nativeEvent.layout.y;
      report();
    },
    [report],
  );

  return (
    <View style={styles.wrapper} onLayout={handleWrapperLayout}>
      <Text
        style={styles.label}
        maxFontSizeMultiplier={a11y.maxDynamicTypeScale}
        // The zone below carries the full label; reading this too would
        // announce every field twice.
        importantForAccessibility="no"
        accessibilityElementsHidden
      >
        <Text style={styles.name}>{field.label}</Text>
        {'   '}
        {field.hint}
      </Text>

      <Pressable
        ref={viewRef}
        onLayout={handleLayout}
        onPress={onDrop}
        // A zone is only a button when there is something to put in it.
        // Otherwise it is scenery and the screen reader should not offer it.
        accessibilityRole={isAwaitingPlacement ? 'button' : undefined}
        accessibilityLabel={
          isAwaitingPlacement
            ? `Hier einsetzen: ${field.a11yLabel}`
            : `${field.a11yLabel}, ${describeCount(count)}`
        }
        style={[
          styles.zone,
          isAwaitingPlacement && styles.zoneAwaiting,
          // The Vorfeld holding its one constituent is the tier-1 lesson made
          // visible: the zone reads as satisfied rather than merely occupied.
          isFull && styles.zoneFull,
        ]}
      >
        <View style={styles.contents}>{children}</View>
      </Pressable>
    </View>
  );
}

function describeCount(count: number): string {
  if (count === 0) return 'leer';
  if (count === 1) return 'ein Baustein';
  return `${count} Bausteine`;
}

export default memo(FieldZoneComponent);

const styles = StyleSheet.create({
  wrapper: {
    // Never shrink below the content. With flexShrink the zone collapses when
    // the verdict panel appears and squeezes the board, and the tiles spill
    // out of their box and overlap the zone below — which is exactly what the
    // first device run showed.
    flexShrink: 0,
    flexGrow: 0,
    gap: space.xs,
  },
  zone: {
    backgroundColor: palette.feld,
    borderRadius: radius.field,
    borderWidth: border.hairline,
    borderColor: palette.kante,
    padding: space.xs,
    // An empty zone still has to look like somewhere a tile could go: one
    // tile high, and no taller, so the whole board fits without scrolling.
    minHeight: a11y.minTouchTarget + space.sm,
    justifyContent: 'center',
  },
  zoneAwaiting: {
    // Every zone lights up while a tile waits for a destination: the answer
    // to "where can this go?" is "anywhere", and the board says so.
    borderColor: palette.messing,
    borderWidth: border.emphasis,
  },
  zoneFull: {
    borderColor: palette.grau,
  },
  contents: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    alignItems: 'center',
  },
  label: fieldLabel,
  name: {
    ...fieldLabel,
    color: palette.kreide,
  },
});
