import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Annotation, NormPoint, NormRect, ShapeConfig } from '../lib/types'
import {
  bendFromPoint,
  bezierBendFromPoint,
  isLineShape,
  lineRect,
  shapeEndpoints,
} from '../lib/shapes'

export interface ShapePreview {
  id: string
  rect: NormRect
  rotation: number
  shape: ShapeConfig
}

interface EndpointOptions {
  pointFromClient: (clientX: number, clientY: number) => NormPoint | null
  snapPoint: (point: NormPoint, anchor?: NormPoint | null) => NormPoint
  getPageBox: () => DOMRect | null
  onUpdateAnnotation: (id: string, patch: Partial<Annotation>) => void
}

interface EndpointDrag {
  id: string
  handle: 'start' | 'end' | 'bend' | 'bend1' | 'bend2'
  rect: NormRect
  rotation: number
  config: ShapeConfig
}

const rotate = (
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  angle: number,
): NormPoint => {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = x - centerX
  const dy = y - centerY
  return { x: centerX + dx * cos - dy * sin, y: centerY + dx * sin + dy * cos }
}

/**
 * Drag the two endpoints of a line/arrow, or the bend handle of a curved arrow.
 * The whole line stays editable after it has been placed.
 */
export function useShapeEndpoints({
  pointFromClient,
  snapPoint,
  getPageBox,
  onUpdateAnnotation,
}: EndpointOptions) {
  const [preview, setPreview] = useState<ShapePreview | null>(null)
  const previewRef = useRef<ShapePreview | null>(null)
  const dragRef = useRef<EndpointDrag | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => () => cleanupRef.current?.(), [])

  const publish = (next: ShapePreview | null) => {
    previewRef.current = next
    setPreview(next)
  }

  const beginShapeEndpoint = (
    event: ReactPointerEvent<Element>,
    annotation: Annotation,
    handle: 'start' | 'end' | 'bend' | 'bend1' | 'bend2',
  ) => {
    const rect = annotation.rects?.[0]
    const config = annotation.shape
    if (!rect || !config || !isLineShape(config.kind)) return
    if (!event.isPrimary) return
    event.stopPropagation()
    event.preventDefault()
    cleanupRef.current?.()
    begin(annotation, handle, rect, config)
  }

  const begin = (
    annotation: Annotation,
    handle: 'start' | 'end' | 'bend' | 'bend1' | 'bend2',
    rect: NormRect,
    config: ShapeConfig,
  ) => {
    const drag: EndpointDrag = {
      id: annotation.id,
      handle,
      rect,
      rotation: annotation.rotation ?? 0,
      config,
    }
    dragRef.current = drag

    const move = (pointerEvent: PointerEvent) => {
      const point = pointFromClient(pointerEvent.clientX, pointerEvent.clientY)
      const box = getPageBox()
      if (!point || !box) return
      const next = updateDrag(drag, point, box)
      if (next) publish(next)
    }
    const finish = () => {
      const current = previewRef.current
      const active = dragRef.current
      dragRef.current = null
      cleanup()
      if (!current || !active || current.id !== active.id) return
      onUpdateAnnotation(active.id, {
        rects: [current.rect],
        rotation: current.rotation,
        shape: current.shape,
      })
    }
    const cancel = () => {
      finish()
    }
    const cleanup = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', cancel)
      cleanupRef.current = null
    }
    cleanupRef.current = cleanup
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', cancel)
  }

  const updateDrag = (
    drag: EndpointDrag,
    point: NormPoint,
    box: DOMRect,
  ): ShapePreview | null => {
    if (box.width < 1 || box.height < 1) return null
    const { rect, config } = drag
    const theta = (drag.rotation * Math.PI) / 180
    const centerX = (rect.x + rect.w / 2) * box.width
    const centerY = (rect.y + rect.h / 2) * box.height
    const endpoints = shapeEndpoints(config)
    // Move everything to page/world coordinates so rotated lines do not jump
    // when one endpoint is dragged.
    const toWorld = (value: NormPoint): NormPoint => {
      const world = rotate(
        (rect.x + value.x * rect.w) * box.width,
        (rect.y + value.y * rect.h) * box.height,
        centerX,
        centerY,
        theta,
      )
      return { x: world.x / box.width, y: world.y / box.height }
    }
    const start = toWorld(endpoints.start)
    const end = toWorld(endpoints.end)

    if (drag.handle === 'bend' || drag.handle === 'bend1' || drag.handle === 'bend2') {
      const toPx = (value: NormPoint) => ({
        x: value.x * box.width,
        y: value.y * box.height,
      })
      const pointer = { x: point.x * box.width, y: point.y * box.height }
      if (drag.handle === 'bend') {
        const bend = bendFromPoint(toPx(start), toPx(end), pointer)
        return {
          id: drag.id,
          rect,
          rotation: drag.rotation,
          shape: { ...config, bend: Math.min(2, Math.max(-2, bend)) },
        }
      }
      const t = drag.handle === 'bend1' ? 1 / 3 : 2 / 3
      const bend = bezierBendFromPoint(toPx(start), toPx(end), pointer, t)
      const clamped = Math.min(2, Math.max(-2, bend))
      return {
        id: drag.id,
        rect,
        rotation: drag.rotation,
        shape:
          drag.handle === 'bend1'
            ? { ...config, bend1: clamped }
            : { ...config, bend2: clamped },
      }
    }

    const target = snapPoint(point)
    if (drag.handle === 'start') {
      start.x = target.x
      start.y = target.y
    } else {
      end.x = target.x
      end.y = target.y
    }
    const normalized = lineRect(start, end)
    return {
      id: drag.id,
      rect: normalized.rect,
      rotation: 0,
      shape: { ...config, start: normalized.start, end: normalized.end },
    }
  }

  return { preview, beginShapeEndpoint }
}
