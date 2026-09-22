/**
 * One field zone on the board — E2.2.
 *
 * Flexible width, wraps to two lines rather than truncating, and accepts
 * anything. The zone is a drop target for drag and a destination for
 * tap-to-place; both paths end in the same `onDrop`.
 */
import { memo, useCallback, useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDragContext } from './dragContext';
import type { Field } from './fields';
import { a11y, border, fieldLabel, palette, radius, space } from '@/theme';

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
};

function FieldZoneComponent({
  field,
  children,
  count,
  isAwaitingPlacement = false,
  onDrop,
}: FieldZoneProps) {
  const isFull = field.capacity === 'single' && count >= 1;
  const { registerZone } = useDragContext();
  const viewRef = useRef<View>(null);

  /**
   * Publishes this zone's window rect for the drag worklet to hit-test
   * against. Measured on layout rather than on drop: measuring during the
   * frame a tile is released is exactly the work a cheap Android device
   * cannot afford.
   */
  const handleLayout = useCallback(() => {
    viewRef.current?.measureInWindow((x, y, width, height) => {
      if (width === 0 && height === 0) return;
      registerZone(field.id, { x, y, width, height });
    });
  }, [field.id, registerZone]);

  return (
    <View style={styles.wrapper}>
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

      <Text
        style={styles.label}
        maxFontSizeMultiplier={a11y.maxDynamicTypeScale}
      >
        {field.label}
      </Text>
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
    flexGrow: 1,
    flexShrink: 1,
    // Zones size to their contents but never collapse below a tile's width.
    flexBasis: 'auto',
    gap: space.xs,
  },
  zone: {
    backgroundColor: palette.feld,
    borderRadius: radius.field,
    borderWidth: border.hairline,
    borderColor: palette.kante,
    padding: space.sm,
    // An empty zone still has to look like somewhere a tile could go.
    minHeight: a11y.minTouchTarget + space.lg,
    justifyContent: 'center',
  },
  zoneAwaiting: {
    borderColor: palette.messing,
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
  label: {
    ...fieldLabel,
    textAlign: 'center',
  },
});
