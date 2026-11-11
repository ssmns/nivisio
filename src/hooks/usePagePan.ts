import { useRef, type PointerEvent as ReactPointerEvent } from 'react'

interface PanStart {
  x: number
  y: number
  left: number
  top: number
}

/** One-finger/mouse drag panning for the dedicated hand tool. */
export function usePagePan() {
  const startRef = useRef<PanStart | null>(null)

  const beginPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) {
      startRef.current = null
      return
    }
    if (event.button !== 0 && event.pointerType === 'mouse') return
    const stage = event.currentTarget.closest('.reader__stage') as HTMLElement | null
    if (!stage) return
    event.currentTarget.setPointerCapture(event.pointerId)
    startRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: stage.scrollLeft,
      top: stage.scrollTop,
    }
  }

  const movePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pan = startRef.current
    const stage = event.currentTarget.closest('.reader__stage') as HTMLElement | null
    if (!pan || !stage) return
    stage.scrollLeft = pan.left - (event.clientX - pan.x)
    stage.scrollTop = pan.top - (event.clientY - pan.y)
  }

  const finishPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    startRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return { beginPan, movePan, finishPan }
}
