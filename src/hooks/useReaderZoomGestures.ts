import { useEffect, useRef, type RefObject } from 'react'

interface ZoomGestureOptions {
  stageRef: RefObject<HTMLDivElement | null>
  enabled: boolean
  zoom: number
  onZoom: (zoom: number) => void
}

const MIN_ZOOM = 0.6
const MAX_ZOOM = 2.4
const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))

function touchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0
  const [a, b] = [touches[0], touches[1]]
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

/**
 * Ctrl/⌘ + wheel (desktop/trackpad) and two-finger pinch (touch devices)
 * control the reader zoom instead of the browser page zoom.
 */
export function useReaderZoomGestures({
  stageRef,
  enabled,
  zoom,
  onZoom,
}: ZoomGestureOptions) {
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom

  useEffect(() => {
    if (!enabled) return
    const stage = stageRef.current
    if (!stage) return

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const delta = event.deltaY > 0 ? -0.12 : 0.12
      onZoom(clampZoom(zoomRef.current + delta))
    }

    let pinchStart = 0
    let pinchZoom = 1
    let pinchMidX = 0
    let pinchMidY = 0
    let startScrollLeft = 0
    let startScrollTop = 0

    const midpoint = (touches: TouchList) => {
      if (touches.length < 2) return { x: 0, y: 0 }
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      }
    }

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) return
      pinchStart = touchDistance(event.touches)
      pinchZoom = zoomRef.current
      const mid = midpoint(event.touches)
      pinchMidX = mid.x
      pinchMidY = mid.y
      startScrollLeft = stage.scrollLeft
      startScrollTop = stage.scrollTop
      event.preventDefault()
    }

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 2 || pinchStart <= 0) return
      event.preventDefault()
      const distance = touchDistance(event.touches)
      if (distance > 0) onZoom(clampZoom(pinchZoom * (distance / pinchStart)))
      // Two-finger drag pans the page even while a drawing tool is active.
      const mid = midpoint(event.touches)
      stage.scrollLeft = startScrollLeft - (mid.x - pinchMidX)
      stage.scrollTop = startScrollTop - (mid.y - pinchMidY)
    }

    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) pinchStart = 0
    }

    const onGestureStart = (event: Event) => event.preventDefault()

    stage.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: false, capture: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true, capture: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true })
    window.addEventListener('gesturestart', onGestureStart, { passive: false })

    return () => {
      stage.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart, true)
      window.removeEventListener('touchmove', onTouchMove, true)
      window.removeEventListener('touchend', onTouchEnd, true)
      window.removeEventListener('touchcancel', onTouchEnd, true)
      window.removeEventListener('gesturestart', onGestureStart)
    }
  }, [enabled, onZoom, stageRef])
}
