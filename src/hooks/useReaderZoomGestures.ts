import { useEffect, useRef, type RefObject } from 'react'
import { clampZoom, touchDistance, touchMidpoint } from '../lib/zoom'

interface ZoomGestureOptions {
  stageRef: RefObject<HTMLDivElement | null>
  enabled: boolean
  zoom: number
  onZoom: (zoom: number) => void
  /** Double-tap zoom is only safe when the active tool does not draw. */
  allowDoubleTap?: boolean
}

interface PointAnchor {
  page: HTMLElement
  /** Page-local coordinates of the point that must stay under the finger. */
  nx: number
  ny: number
  x: number
  y: number
}

const DOUBLE_TAP_MS = 320
const ANCHOR_RELEASE_MS = 1200

/**
 * Ctrl/⌘ + wheel (desktop/trackpad), two-finger pinch and double-tap (touch)
 * control the reader zoom. The page point under the gesture stays fixed, and a
 * two-finger drag pans the page even when a drawing tool is active.
 */
export function useReaderZoomGestures({
  stageRef,
  enabled,
  zoom,
  onZoom,
  allowDoubleTap = false,
}: ZoomGestureOptions) {
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom

  useEffect(() => {
    if (!enabled) return
    const stage = stageRef.current
    if (!stage) return

    let anchor: PointAnchor | null = null
    let observed: HTMLElement | null = null
    let frame = 0
    let releaseTimer = 0
    const observer = new ResizeObserver(() => {
      applyAnchor()
      scheduleRelease()
    })

    const pageAt = (clientX: number, clientY: number): HTMLElement | null => {
      const hit = document.elementFromPoint(clientX, clientY) as Element | null
      const page = hit?.closest('.pdf-page') ?? stage.querySelector('.pdf-page')
      return page instanceof HTMLElement ? page : null
    }

    const captureAnchor = (clientX: number, clientY: number): PointAnchor | null => {
      const page = pageAt(clientX, clientY)
      if (!page) return null
      const box = page.getBoundingClientRect()
      if (box.width < 1 || box.height < 1) return null
      return {
        page,
        nx: (clientX - box.left) / box.width,
        ny: (clientY - box.top) / box.height,
        x: clientX,
        y: clientY,
      }
    }

    const observePage = (page: HTMLElement | null) => {
      if (observed === page) return
      if (observed) observer.unobserve(observed)
      observed = page
      if (page) observer.observe(page)
    }

    const applyAnchor = () => {
      if (!anchor) return
      if (!anchor.page.isConnected) {
        anchor = null
        observePage(null)
        return
      }
      const box = anchor.page.getBoundingClientRect()
      if (box.width < 1 || box.height < 1) return
      const targetX = box.left + anchor.nx * box.width
      const targetY = box.top + anchor.ny * box.height
      const dx = targetX - anchor.x
      const dy = targetY - anchor.y
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        // `scrollBy` respects RTL scroll semantics in every browser.
        stage.scrollBy({ left: dx, top: dy })
      }
    }

    const scheduleAnchor = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(applyAnchor)
      })
    }

    const scheduleRelease = () => {
      window.clearTimeout(releaseTimer)
      releaseTimer = window.setTimeout(() => {
        anchor = null
        observePage(null)
      }, ANCHOR_RELEASE_MS)
    }

    const zoomTo = (next: number, clientX: number, clientY: number) => {
      const clamped = clampZoom(next)
      if (Math.abs(clamped - zoomRef.current) < 0.0005) return
      zoomRef.current = clamped
      anchor = captureAnchor(clientX, clientY)
      observePage(anchor?.page ?? null)
      onZoom(clamped)
      applyAnchor()
      scheduleAnchor()
      scheduleRelease()
    }

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const step = event.deltaY > 0 ? 0.9 : 1.1
      zoomTo(zoomRef.current * step, event.clientX, event.clientY)
    }

    let pinchDistance = 0
    let pinchZoom = 1
    let pinching = false
    let lastTapAt = 0
    let lastTapX = 0
    let lastTapY = 0

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        pinching = true
        pinchDistance = touchDistance(event.touches)
        pinchZoom = zoomRef.current
        const mid = touchMidpoint(event.touches)
        anchor = captureAnchor(mid.x, mid.y)
        observePage(anchor?.page ?? null)
        scheduleRelease()
        event.preventDefault()
        return
      }
      if (event.touches.length !== 1 || !allowDoubleTap) return
      const touch = event.touches[0]
      const now = performance.now()
      const closeEnough =
        Math.hypot(touch.clientX - lastTapX, touch.clientY - lastTapY) < 32
      if (now - lastTapAt < DOUBLE_TAP_MS && closeEnough) {
        const target = zoomRef.current > 1.02 ? 1 : Math.min(2.2, zoomRef.current * 2)
        zoomTo(target, touch.clientX, touch.clientY)
        lastTapAt = 0
        event.preventDefault()
      } else {
        lastTapAt = now
        lastTapX = touch.clientX
        lastTapY = touch.clientY
      }
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!pinching || event.touches.length !== 2) return
      event.preventDefault()
      const mid = touchMidpoint(event.touches)
      if (anchor) {
        // Keep the captured page point under the moving two-finger midpoint.
        anchor.x = mid.x
        anchor.y = mid.y
      }
      const distance = touchDistance(event.touches)
      if (pinchDistance > 0 && distance > 0) {
        const next = clampZoom(pinchZoom * (distance / pinchDistance))
        if (Math.abs(next - zoomRef.current) > 0.0005) {
          zoomRef.current = next
          onZoom(next)
        }
      }
      applyAnchor()
      scheduleAnchor()
      scheduleRelease()
    }

    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) {
        pinching = false
        pinchDistance = 0
      }
      scheduleRelease()
    }

    const onGestureStart = (event: Event) => event.preventDefault()

    stage.addEventListener('wheel', onWheel, { passive: false })
    stage.addEventListener('touchstart', onTouchStart, { passive: false })
    stage.addEventListener('touchmove', onTouchMove, { passive: false })
    stage.addEventListener('touchend', onTouchEnd, { passive: true })
    stage.addEventListener('touchcancel', onTouchEnd, { passive: true })
    window.addEventListener('gesturestart', onGestureStart, { passive: false })

    return () => {
      stage.removeEventListener('wheel', onWheel)
      stage.removeEventListener('touchstart', onTouchStart)
      stage.removeEventListener('touchmove', onTouchMove)
      stage.removeEventListener('touchend', onTouchEnd)
      stage.removeEventListener('touchcancel', onTouchEnd)
      window.removeEventListener('gesturestart', onGestureStart)
      if (frame) cancelAnimationFrame(frame)
      window.clearTimeout(releaseTimer)
      observer.disconnect()
    }
  }, [allowDoubleTap, enabled, onZoom, stageRef])
}
