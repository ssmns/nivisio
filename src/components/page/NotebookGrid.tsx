import type { CSSProperties } from 'react'
import type { NotebookPage } from '../../lib/types'

interface NotebookGridProps {
  notebook?: NotebookPage
  width: number
  height: number
}

const COS30 = Math.cos(Math.PI / 6)
const SIN30 = Math.sin(Math.PI / 6)

function LatticeGrid({
  width,
  height,
  scale,
  withVertical,
}: {
  width: number
  height: number
  scale: number
  withVertical: boolean
}) {
  const unit = Math.max(10, 0.036 * scale * width)
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = []
  const span = Math.ceil((width + height) / unit) + 3
  const reach = (width + height) * 1.5

  // +30° family: lines through n·e2 along e1.
  for (let n = -span; n <= span; n += 1) {
    const px = n * unit * COS30
    const py = -n * unit * SIN30
    lines.push({
      x1: px - reach * COS30,
      y1: py - reach * SIN30,
      x2: px + reach * COS30,
      y2: py + reach * SIN30,
    })
  }

  // -30° family: lines through m·e1 along e2.
  for (let m = -span; m <= span; m += 1) {
    const px = m * unit * COS30
    const py = m * unit * SIN30
    lines.push({
      x1: px - reach * COS30,
      y1: py + reach * SIN30,
      x2: px + reach * COS30,
      y2: py - reach * SIN30,
    })
  }

  // The 30–60 variant closes the triangles with vertical lines.
  if (withVertical) {
    const step = unit * COS30
    for (let k = -span; k <= Math.ceil(width / step) + span; k += 1) {
      const x = k * step
      lines.push({ x1: x, y1: -reach, x2: x, y2: height + reach })
    }
  }

  return (
    <svg
      className="notebook-grid notebook-grid--lattice"
      viewBox={`0 0 ${Math.max(1, width)} ${Math.max(1, height)}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g stroke="#dfe6f0" strokeWidth="1" vectorEffect="non-scaling-stroke">
        {lines.map((line, index) => (
          <line key={index} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
        ))}
      </g>
    </svg>
  )
}

export function NotebookGrid({ notebook, width, height }: NotebookGridProps) {
  const grid = notebook?.grid ?? 'lined'
  const scale = notebook?.gridScale ?? 1

  if ((grid === 'isometric' || grid === 'tri30') && width > 0 && height > 0) {
    return (
      <LatticeGrid
        width={width}
        height={height}
        scale={scale}
        withVertical={grid === 'tri30'}
      />
    )
  }

  return (
    <div
      className={`notebook-grid notebook-grid--${grid}`}
      style={{ '--grid-scale': scale } as CSSProperties}
    />
  )
}
