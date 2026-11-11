export const MIN_ZOOM = 0.6
export const MAX_ZOOM = 3

export function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

export function touchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0
  const [a, b] = [touches[0], touches[1]]
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

export function touchMidpoint(touches: TouchList): { x: number; y: number } {
  if (touches.length < 2) return { x: 0, y: 0 }
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  }
}
