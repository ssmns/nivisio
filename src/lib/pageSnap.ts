import type { Annotation, GridType, NormPoint } from './types'
import { snapPointToGrid } from './snap'

interface SnapOptions {
  enabled: boolean
  isNotebook: boolean
  grid?: GridType
  gridScale?: number
  width: number
  height: number
  anchor?: NormPoint | null
  annotations: Annotation[]
}

export function snapPointWithGuides(
  point: NormPoint,
  options: SnapOptions,
): NormPoint {
  const { enabled, isNotebook, grid, gridScale, width, height, anchor, annotations } =
    options
  if (!enabled) return point

  let snapped: NormPoint
  let verticalLock = false
  const wantsVerticalLock =
    isNotebook &&
    (grid === 'isometric' || grid === 'tri30') &&
    anchor &&
    Math.abs(point.x - anchor.x) < Math.abs(point.y - anchor.y) * 0.22

  if (wantsVerticalLock && anchor) {
    // On a triangular lattice, following a vertical line should not force the
    // point sideways. Keep the anchor column and snap the vertical step.
    const unit = 0.036 * (gridScale ?? 1) * width
    const stepY = unit / Math.max(1, height)
    snapped = {
      x: anchor.x,
      y: anchor.y + Math.round((point.y - anchor.y) / stepY) * stepY,
    }
    verticalLock = true
  } else {
    snapped = isNotebook
      ? snapPointToGrid(point, { grid, gridScale, width, height })
      : {
          x: Math.round(point.x / 0.05) * 0.05,
          y: Math.round(point.y / 0.05) * 0.05,
        }
  }

  // Rulers and set squares act as extra snap edges in every grid mode.
  const tolerance = 0.012
  for (const guide of annotations.filter((item) => item.type === 'guide')) {
    const rect = guide.rects?.[0]
    if (!rect) continue
    if (!verticalLock) {
      for (const edge of [rect.x, rect.x + rect.w]) {
        if (Math.abs(snapped.x - edge) < tolerance) snapped = { ...snapped, x: edge }
      }
    }
    for (const edge of [rect.y, rect.y + rect.h]) {
      if (Math.abs(snapped.y - edge) < tolerance) snapped = { ...snapped, y: edge }
    }
  }
  return snapped
}
