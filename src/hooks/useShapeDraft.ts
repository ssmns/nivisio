import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { NormPoint, NormRect, ShapeConfig } from '../lib/types'
import { isLineShape, lineRect } from '../lib/shapes'

interface ShapeDraftOptions {
  pendingShape?: ShapeConfig | null
  pointFromClient: (clientX: number, clientY: number) => NormPoint | null
  snapPoint: (point: NormPoint, anchor?: NormPoint | null) => NormPoint
  onAddShape: (
    rect: NormRect,
    flips: { flipX: boolean; flipY: boolean },
    points?: { start: NormPoint; end: NormPoint },
  ) => void
}

/** Draw a new shape by dragging from a start point to an end point. */
export function useShapeDraft({
  pendingShape,
  pointFromClient,
  snapPoint,
  onAddShape,
}: ShapeDraftOptions) {
  const [shapeDraft, setShapeDraft] = useState<NormRect | null>(null)
  const startRef = useRef<NormPoint | null>(null)
  const endRef = useRef<NormPoint | null>(null)

  const beginShape = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) {
      startRef.current = null
      endRef.current = null
      setShapeDraft(null)
      return
    }
    if (event.button !== 0 && event.pointerType === 'mouse') return
    const point = pointFromClient(event.clientX, event.clientY)
    if (!point) return
    const snapped = snapPoint(point)
    event.currentTarget.setPointerCapture(event.pointerId)
    startRef.current = snapped
    endRef.current = snapped
    setShapeDraft({ x: snapped.x, y: snapped.y, w: 0, h: 0 })
  }

  const moveShape = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = startRef.current
    if (!start) return
    const point = pointFromClient(event.clientX, event.clientY)
    if (!point) return
    let end = snapPoint(point, start)
    if (
      event.shiftKey &&
      pendingShape &&
      isLineShape(pendingShape.kind)
    ) {
      const dx = end.x - start.x
      const dy = end.y - start.y
      const length = Math.hypot(dx, dy)
      const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 12)) * (Math.PI / 12)
      end = { x: start.x + Math.cos(angle) * length, y: start.y + Math.sin(angle) * length }
    }
    endRef.current = end
    setShapeDraft({
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      w: Math.abs(end.x - start.x),
      h: Math.abs(end.y - start.y),
    })
  }

  const finishShape = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = startRef.current
    if (!start) return
    startRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const point = pointFromClient(event.clientX, event.clientY)
    const end = (point ? snapPoint(point, start) : null) ?? endRef.current ?? start
    endRef.current = null
    setShapeDraft(null)

    const line = pendingShape && isLineShape(pendingShape.kind)
    if (line) {
      const endPoint =
        Math.hypot(end.x - start.x, end.y - start.y) < 0.02
          ? { x: Math.min(0.98, start.x + 0.16), y: start.y }
          : end
      const { rect } = lineRect(start, endPoint)
      onAddShape(
        rect,
        { flipX: endPoint.x < start.x, flipY: endPoint.y < start.y },
        { start, end: endPoint },
      )
      return
    }

    const rect = {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      w: Math.abs(end.x - start.x),
      h: Math.abs(end.y - start.y),
    }
    if (rect.w < 0.008 && rect.h < 0.008) {
      rect.w = 0.14
      rect.h = 0.1
      rect.x = start.x - rect.w / 2
      rect.y = start.y - rect.h / 2
    }
    onAddShape(rect, { flipX: end.x < start.x, flipY: end.y < start.y })
  }

  return { shapeDraft, beginShape, moveShape, finishShape }
}
