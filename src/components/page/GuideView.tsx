import type { GuideKind } from '../../lib/types'

interface GuideViewProps {
  kind: GuideKind
  width: number
  height: number
  pageWidthPt: number
  pageWidthPx: number
}

/**
 * Renders measuring guides in device pixels. The SVG viewBox matches the
 * rendered box, so enlarging a ruler adds length/ticks instead of stretching
 * the markings, and protractors/set squares keep their real angles.
 */
export function GuideView({
  kind,
  width,
  height,
  pageWidthPt,
  pageWidthPx,
}: GuideViewProps) {
  const w = Math.max(1, width)
  const h = Math.max(1, height)

  if (kind === 'ruler') {
    const pageWidthMm = (pageWidthPt / 72) * 25.4
    const pxPerMm = pageWidthPx / Math.max(1, pageWidthMm)
    const minor = Math.max(7, pxPerMm * 5)
    const major = minor * 2
    const tickMinor = Math.min(h * 0.32, 8)
    const tickMajor = Math.min(h * 0.58, 15)
    const ticks: number[] = []
    for (let x = 0; x <= w + 0.01; x += minor) ticks.push(x)
    const cmTotal = w / pxPerMm / 10
    const labelSize = Math.max(6, Math.min(10, h * 0.22))
    return (
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="guide-svg">
        <rect x="0.5" y="0.5" width={w - 1} height={h - 1} rx="2" fill="rgba(244,63,94,0.05)" stroke="currentColor" strokeWidth="0.8" />
        {ticks.map((x) => {
          const isMajor = Math.abs(x % major) < 0.01 || Math.abs((x % major) - major) < 0.01
          return (
            <line
              key={x}
              x1={x}
              y1="0.5"
              x2={x}
              y2={isMajor ? tickMajor : tickMinor}
              stroke="currentColor"
              strokeWidth={isMajor ? 0.9 : 0.6}
            />
          )
        })}
        {cmTotal >= 1 && (
          <text
            x={w / 2}
            y={Math.min(h - 4, Math.max(tickMajor + labelSize + 2, h * 0.78))}
            textAnchor="middle"
            fontSize={labelSize}
            fill="currentColor"
          >
            {cmTotal.toFixed(1)} cm
          </text>
        )}
      </svg>
    )
  }

  if (kind === 'protractor') {
    const radius = Math.max(14, Math.min(w / 2, h) - 2)
    const cx = w / 2
    const cy = Math.min(h - 2, radius + 2)
    const ticks = Array.from({ length: 37 }, (_, index) => index * 5)
    const labelSize = Math.max(5.5, Math.min(8, radius * 0.11))
    return (
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="guide-svg">
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy} Z`}
          fill="rgba(244,63,94,0.05)"
          stroke="currentColor"
          strokeWidth="1"
        />
        <line x1={cx - radius} y1={cy} x2={cx + radius} y2={cy} stroke="currentColor" strokeWidth="0.9" />
        {ticks.map((deg) => {
          const rad = (deg * Math.PI) / 180
          const major = deg % 10 === 0
          const length = major ? Math.min(10, radius * 0.16) : Math.min(5, radius * 0.08)
          const x1 = cx + Math.cos(rad) * radius
          const y1 = cy - Math.sin(rad) * radius
          const x2 = cx + Math.cos(rad) * (radius - length)
          const y2 = cy - Math.sin(rad) * (radius - length)
          return (
            <line
              key={deg}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={major ? 0.8 : 0.5}
            />
          )
        })}
        {[0, 30, 60, 90, 120, 150, 180].map((deg) => {
          const rad = (deg * Math.PI) / 180
          const r = Math.max(4, radius - Math.min(16, radius * 0.22))
          return (
            <text
              key={deg}
              x={cx + Math.cos(rad) * r}
              y={cy - Math.sin(rad) * r + labelSize / 3}
              textAnchor="middle"
              fontSize={labelSize}
              fill="currentColor"
            >
              {deg}
            </text>
          )
        })}
      </svg>
    )
  }

  const ratio = Math.sqrt(3)
  const triHeight = Math.min(h, w / ratio)
  const triWidth = triHeight * ratio
  const x0 = (w - triWidth) / 2
  const y0 = (h - triHeight) / 2
  const labelSize = Math.max(5, Math.min(8, triHeight * 0.11))
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="guide-svg">
      <polygon
        points={`${x0},${y0 + triHeight} ${x0 + triWidth},${y0 + triHeight} ${x0 + triWidth},${y0}`}
        fill="rgba(244,63,94,0.05)"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <text x={x0 + 6} y={y0 + triHeight - 5} fontSize={labelSize} fill="currentColor">30°</text>
      <text x={x0 + triWidth - 6} y={y0 + 12} textAnchor="end" fontSize={labelSize} fill="currentColor">60°</text>
      <text x={x0 + triWidth - 6} y={y0 + triHeight - 5} textAnchor="end" fontSize={labelSize} fill="currentColor">90°</text>
    </svg>
  )
}
