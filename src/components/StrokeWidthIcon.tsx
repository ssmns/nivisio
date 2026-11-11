import type { CSSProperties } from 'react'

export function StrokeWidthIcon({ scale }: { scale: number }) {
  return (
    <span
      className="stroke-width-icon"
      style={{ '--stroke-width': `${Math.max(1.5, scale * 2.4)}px` } as CSSProperties}
      aria-hidden="true"
    />
  )
}
