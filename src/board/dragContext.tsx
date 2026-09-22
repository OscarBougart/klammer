/**
 * Drop-target geometry, shared with the UI thread — E2.4.
 *
 * CLAUDE.md: Reanimated worklets only, no JS-thread layout during drag. So
 * zone rectangles are measured once when a zone lays out, written into a
 * shared value, and hit-tested inside the gesture worklet. Nothing crosses to
 * JavaScript between finger-down and finger-up except the final placement.
 *
 * The alternative — measuring on drop — puts a `measure()` round trip in the
 * one frame where the tile is supposed to snap, which is exactly the frame a
 * cheap Android device cannot spare.
 */
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import type { FieldId } from './fields';
import type { Rect, ZoneRects } from './geometry';

// Re-exported so callers have one import for the drag surface.
export { insertionIndex, zoneAt } from './geometry';
export type { Rect, ZoneRects } from './geometry';

type DragContextValue = {
  /** Field id -> rect in window coordinates. Read inside worklets. */
  zones: SharedValue<ZoneRects>;
  /** Called by a zone once it knows where it is. */
  registerZone: (field: FieldId, rect: Rect) => void;
  /**
   * Tile id -> rect in window coordinates. Used to work out *where* in a zone
   * a tile was dropped, not just which zone. Read on the JS thread after the
   * gesture ends, never during it.
   */
  tiles: SharedValue<Record<string, Rect>>;
  registerTile: (tileId: string, rect: Rect) => void;
  /** The tile currently under the finger, or null. Drives tray/zone styling. */
  draggingTileId: SharedValue<string | null>;
};

const DragContext = createContext<DragContextValue | null>(null);

export function DragProvider({ children }: { children: ReactNode }) {
  const zones = useSharedValue<ZoneRects>({});
  const tiles = useSharedValue<Record<string, Rect>>({});
  const draggingTileId = useSharedValue<string | null>(null);

  const registerZone = useCallback(
    (field: FieldId, rect: Rect) => {
      // Mutating the object in place would not notify the UI thread; a new
      // object is what makes the write visible to worklets.
      zones.value = { ...zones.value, [field]: rect };
    },
    [zones],
  );

  const registerTile = useCallback(
    (tileId: string, rect: Rect) => {
      tiles.value = { ...tiles.value, [tileId]: rect };
    },
    [tiles],
  );

  const value = useMemo(
    () => ({ zones, registerZone, tiles, registerTile, draggingTileId }),
    [zones, registerZone, tiles, registerTile, draggingTileId],
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
