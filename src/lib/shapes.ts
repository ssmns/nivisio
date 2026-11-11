import type { NormPoint, NormRect, ShapeConfig, ShapeKind } from './types'

const LINE_KINDS: ShapeKind[] = ['line', 'arrow', 'curve-arrow', 'bezier-arrow']

export function isLineShape(kind: ShapeKind | undefined): boolean {
  return Boolean(kind && LINE_KINDS.includes(kind))
}

/**
 * Endpoints of a line-like shape in the local 0..1 space of its rect.
 * Older annotations only stored `flipX`/`flipY`, so derive them from the corners.
 */
export function shapeEndpoints(config: ShapeConfig): { start: NormPoint; end: NormPoint } {
  if (config.start && config.end) return { start: config.start, end: config.end }
  return {
    start: { x: config.flipX ? 1 : 0, y: config.flipY ? 1 : 0 },
    end: { x: config.flipX ? 0 : 1, y: config.flipY ? 0 : 1 },
  }
}

/**
 * Build the smallest rect that contains both endpoints, keeping a minimum span so
 * truly horizontal or vertical lines still have a paintable box. The returned
 * start/end are local to that rect.
 */
export function lineRect(
  from: NormPoint,
  to: NormPoint,
  minSpan = 0.02,
): { rect: NormRect; start: NormPoint; end: NormPoint } {
  let x = Math.min(from.x, to.x)
  let y = Math.min(from.y, to.y)
  let w = Math.abs(to.x - from.x)
  let h = Math.abs(to.y - from.y)
  if (w < minSpan) {
    x = (from.x + to.x) / 2 - minSpan / 2
    w = minSpan
  }
  if (h < minSpan) {
    y = (from.y + to.y) / 2 - minSpan / 2
    h = minSpan
  }
  return {
    rect: { x, y, w, h },
    start: { x: (from.x - x) / w, y: (from.y - y) / h },
    end: { x: (to.x - x) / w, y: (to.y - y) / h },
  }
}

/** Control point of the quadratic curve used by curved arrows. */
export function curveControlPoint(
  start: NormPoint,
  end: NormPoint,
  bend: number,
): NormPoint {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy)
  if (length < 0.0001) {
    return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
  }
  const offset = bend * length
  return {
    x: (start.x + end.x) / 2 - (dy / length) * offset,
    y: (start.y + end.y) / 2 + (dx / length) * offset,
  }
}

/** Point on the curve at t=0.5, where the bend handle lives. */
export function curveMidpoint(start: NormPoint, end: NormPoint, control: NormPoint): NormPoint {
  return {
    x: start.x * 0.25 + control.x * 0.5 + end.x * 0.25,
    y: start.y * 0.25 + control.y * 0.5 + end.y * 0.25,
  }
}

/** Invert `curveMidpoint`: bend value that makes the curve pass through `point`. */
export function bendFromPoint(
  start: NormPoint,
  end: NormPoint,
  point: NormPoint,
): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy)
  if (length < 0.0001) return 0
  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2
  const normalX = -dy / length
  const normalY = dx / length
  const projection = (point.x - midX) * normalX + (point.y - midY) * normalY
  return (2 * projection) / length
}

/**
 * Cubic Bézier controls for a two-handle arrow. Each handle moves only along the
 * chord normal, at one-third and two-thirds of the chord.
 */
export function bezierControls(
  start: NormPoint,
  end: NormPoint,
  bend1: number,
  bend2: number,
): { c1: NormPoint; c2: NormPoint } {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy)
  if (length < 0.0001) return { c1: start, c2: end }
  const normalX = -dy / length
  const normalY = dx / length
  const pointAt = (t: number, bend: number): NormPoint => ({
    x: start.x + dx * t + normalX * bend * length,
    y: start.y + dy * t + normalY * bend * length,
  })
  return { c1: pointAt(1 / 3, bend1), c2: pointAt(2 / 3, bend2) }
}

/** Bend value that places a Bézier control handle at `point` (t = 1/3 or 2/3). */
export function bezierBendFromPoint(
  start: NormPoint,
  end: NormPoint,
  point: NormPoint,
  t: number,
): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.hypot(dx, dy)
  if (length < 0.0001) return 0
  const baseX = start.x + dx * t
  const baseY = start.y + dy * t
  const normalX = -dy / length
  const normalY = dx / length
  const projection = (point.x - baseX) * normalX + (point.y - baseY) * normalY
  return projection / length
}

/** Archimedean spiral in pixel space, used by both the editor and PDF export. */
export function spiralPoints(
  width: number,
  height: number,
  turns = 2.8,
  steps = 160,
): NormPoint[] {
  const cx = width / 2
  const cy = height / 2
  const maxRadius = Math.min(width, height) * 0.46
  const points: NormPoint[] = []
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps
    const angle = t * turns * Math.PI * 2 - Math.PI / 2
    const radius = maxRadius * (0.06 + 0.94 * t)
    points.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius })
  }
  return points
}
