/**
 * One field on the board, read-only — E2.2.
 *
 * The learner builds the sentence in a single row; the fields appear after
 * Prüfen, filled from that row (see segment.ts). So a zone is no longer a
 * drop target: it is the answer to "where did each word end up, and why".
 *
 * The label sits above the zone and says both what the field is called and
 * what goes in it. The name is the grammar's own vocabulary; the hint is what
 * makes it usable on first sight.
 */
import { memo, useCallback, useRef, type ReactNode } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import type { Field } from './fields';
import { a11y, border, fieldLabel, palette, radius, space } from '@/theme';

/** A zone's box, in the coordinates of the list of zones it sits in. */
export type ZoneBox = { y: number; height: number };

export type FieldZoneProps = {
  field: Field;
  /** Tiles in this zone, rendered by the caller. */
  children?: ReactNode;
  /** How many tiles are here — drives the a11y label. */
  count: number;
  /**
   * The field holds more than it should, e.g. two Satzteile in position 1.
   * The zone's outline turns ziegel so the mistake is visible in the field
   * itself, not only in the text below.
   */
  isOverfull?: boolean;
  /** Where the zone's box sits in its parent — the bracket is drawn from it. */
  onBoxLayout?: (box: ZoneBox) => void;
};

function FieldZoneComponent({
  field,
  children,
  count,
  isOverfull = false,
  onBoxLayout,
}: FieldZoneProps) {
  // The box's position in its parent is the wrapper's offset plus the box's
  // offset inside the wrapper, and the two arrive in separate layout events.
  const wrapperY = useRef<number | null>(null);
  const box = useRef<ZoneBox | null>(null);

  const report = useCallback(() => {
    if (!onBoxLayout || wrapperY.current === null || box.current === null) return;
    onBoxLayout({ y: wrapperY.current + box.current.y, height: box.current.height });
  }, [onBoxLayout]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      box.current = { y, height };
      report();
    },
    [report],
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

      <View
        onLayout={handleLayout}
        accessible
        accessibilityLabel={`${field.a11yLabel}, ${describeCount(count)}`}
        style={[styles.zone, isOverfull && styles.zoneOverfull]}
      >
        <View style={styles.contents}>{children}</View>
      </View>
    </View>
  );
}

function describeCount(count: number): string {
  if (count === 0) return 'leer';
  if (count === 1) return 'ein Satzteil';
  return `${count} Satzteile`;
}

export default memo(FieldZoneComponent);

const styles = StyleSheet.create({
  wrapper: {
    // Never shrink below the content, or tiles spill out of their box and
    // overlap the zone below — which is exactly what the first device run
    // showed.
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
    minHeight: a11y.minTouchTarget + space.sm,
    justifyContent: 'center',
  },
  zoneOverfull: {
    borderColor: palette.ziegel,
    borderWidth: border.emphasis,
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
