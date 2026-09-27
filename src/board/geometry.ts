/**
 * Drop-target geometry — pure functions, no React and no React Native.
 *
 * Kept apart from dragContext.tsx deliberately. This is the logic that decides
 * where a dropped tile lands, it is the easiest part of the drag to get subtly
 * wrong, and it is the only part that can be tested without a device. Importing
 * React Native here would make it untestable in node.
 */
export type Rect = { x: number; y: number; width: number; height: number };

/**
 * Where in the row a drop belongs.
 *
 * Tiles wrap across rows, so "before" means reading order: an earlier row
 * always precedes a later one, and within a row it is left of centre. Counting
 * how many tiles the drop point is past gives the insertion index directly.
 *
 * Runs on the JS thread once the gesture has ended. Doing it in a worklet
 * would buy nothing — there is no frame left to save.
 */
export function insertionIndex(
  orderedTileIds: readonly string[],
  rects: Record<string, Rect>,
  dropX: number,
  dropY: number,
  excludeTileId: string,
): number {
  let index = 0;

  for (const tileId of orderedTileIds) {
    // A tile never displaces itself: without this, dragging a tile one place
    // to the right would count its own old position and land it back where it
    // started.
    if (tileId === excludeTileId) continue;

    const rect = rects[tileId];
    if (!rect) continue;

    const centreX = rect.x + rect.width / 2;

    // A drop clearly below this tile's row is past it regardless of x.
    const isLaterRow = dropY > rect.y + rect.height;
    const isSameRow = !isLaterRow && dropY >= rect.y;

    if (isLaterRow || (isSameRow && dropX > centreX)) {
      index += 1;
      continue;
    }

    // The first tile the drop does not pass is where it goes.
    break;
  }

  return index;
}
