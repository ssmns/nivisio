import type { ShapeKind } from '../lib/types'

interface ShapeIconProps {
  kind: ShapeKind
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** Small line-art previews used by the shape picker. */
export function ShapeIcon({ kind }: ShapeIconProps) {
  return (
    <svg className="shape-picker__icon" viewBox="0 0 24 24" aria-hidden="true">
      {kind === 'line' && <line x1="3" y1="19" x2="21" y2="5" {...stroke} />}
      {kind === 'arrow' && (
        <>
          <line x1="3" y1="19" x2="21" y2="5" {...stroke} />
          <path d="M21 5 L15 5.6 M21 5 L19.6 10.8" {...stroke} />
        </>
      )}
      {kind === 'curve-arrow' && (
        <>
          <path d="M3 18 Q 11 4 21 10" {...stroke} />
          <path d="M21 10 L16.8 6.4 M21 10 L16.4 13.8" {...stroke} />
        </>
      )}
      {kind === 'bezier-arrow' && (
        <>
          <path d="M3 18 C 7 4, 15 20, 21 7" {...stroke} />
          <path d="M21 7 L16 5.2 M21 7 L19.4 12.2" {...stroke} />
        </>
      )}
      {kind === 'rect' && <rect x="3" y="5" width="18" height="14" rx="2" {...stroke} />}
      {kind === 'ellipse' && <ellipse cx="12" cy="12" rx="9" ry="6" {...stroke} />}
      {kind === 'circle' && <circle cx="12" cy="12" r="8" {...stroke} />}
      {kind === 'triangle' && <polygon points="12,3 21,20 3,20" {...stroke} />}
      {kind === 'polygon' && (
        <polygon
          points="12,2.5 20.5,7.25 20.5,16.75 12,21.5 3.5,16.75 3.5,7.25"
          {...stroke}
        />
      )}
      {kind === 'star' && (
        <polygon
          points="12,2.5 14.7,8.9 21.5,9.5 16.3,14 17.9,20.7 12,17.1 6.1,20.7 7.7,14 2.5,9.5 9.3,8.9"
          {...stroke}
        />
      )}
    </svg>
  )
}
