/**
 * What a dragged tile needs to know about the board — E2.4.
 *
 * There is one drop target: the sentence row. A tile released over it is
 * inserted where it lands; released anywhere else, it goes back to the bank.
 *
 * The row is measured *at drop time*, inside the gesture worklet, with
 * Reanimated's `measure()`. That returns page coordinates in the same frame
 * as the gesture's `absoluteX/Y`, whatever the status bar, edge-to-edge
 * insets or scroll position are doing. The previous design stored window
 * rects from `measureInWindow` on layout and compared them with the gesture's
 * coordinates; on Android the two disagreed and no drop ever landed.
 *
 * Where in the row a tile lands is worked out from the row's own tiles, whose
 * rects come from `onLayout` and are therefore already relative to the row.
 */
import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import type Animated from 'react-native-reanimated';
import { useAnimatedRef, useSharedValue, type AnimatedRef, type SharedValue } from 'react-native-reanimated';

import type { Rect } from './geometry';

export { insertionIndex } from './geometry';
export type { Rect } from './geometry';

/** Which container the lifted tile came from; that container draws on top. */
export type DragSource = 'row' | 'bank' | null;

type DragContextValue = {
  /** The sentence row, measured in the worklet when a tile is released. */
  rowRef: AnimatedRef<Animated.View>;
  /** Tile id -> rect relative to the row. Read on the JS thread after a drop. */
  rowTiles: RefObject<Record<string, Rect>>;
  registerRowTile: (tileId: string, rect: Rect) => void;
  /** Where the tile under the finger came from, or null. */
  dragSource: SharedValue<DragSource>;
};

const DragContext = createContext<DragContextValue | null>(null);

export function DragProvider({ children }: { children: ReactNode }) {
  const rowRef = useAnimatedRef<Animated.View>();
  const rowTiles = useRef<Record<string, Rect>>({});
  const dragSource = useSharedValue<DragSource>(null);

  const registerRowTile = useCallback((tileId: string, rect: Rect) => {
    rowTiles.current[tileId] = rect;
  }, []);

  const value = useMemo(
    () => ({ rowRef, rowTiles, registerRowTile, dragSource }),
    [rowRef, registerRowTile, dragSource],
  );

  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
}

export function useDragContext(): DragContextValue {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDragContext must be used inside a <DragProvider>');
  }
  return context;
}
