import type { ChartConfig } from '../lib/types'
import { translate } from '../lib/lang'

interface ChartViewProps {
  config: ChartConfig
  compact?: boolean
}

const FALLBACK_COLORS = ['#f43f5e', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6']

function safeValues(config: ChartConfig): number[] {
  return config.values.map((value) => (Number.isFinite(value) ? Math.max(0, value) : 0))
}

export function ChartView({ config, compact }: ChartViewProps) {
  const values = safeValues(config)
  const labels = config.labels.length ? config.labels : values.map((_, index) => `${index + 1}`)
  const max = Math.max(1, ...values)
  const total = values.reduce((sum, value) => sum + value, 0) || 1

  const background =
    config.background && config.background !== 'transparent' ? (
      <rect x="0" y="0" width="100" height="100" fill={config.background} />
    ) : null

  if (config.kind === 'pie') {
    let angle = -Math.PI / 2
    const cx = 50
    const cy = 48
    const radius = compact ? 30 : 34
    return (
      <svg
        className="chart-svg"
        viewBox="0 0 100 100"
        role="img"
        aria-label={config.title || translate('نمودار دایره‌ای', 'Pie chart')}
      >
        {background}
        {config.title && (
          <text x="50" y="9" textAnchor="middle" className="chart-title">
            {config.title}
          </text>
        )}
        {values.map((value, index) => {
          const slice = (value / total) * Math.PI * 2
          const start = angle
          const end = angle + slice
          angle = end
          if (slice <= 0) return null
          const large = slice > Math.PI ? 1 : 0
          const x1 = cx + radius * Math.cos(start)
          const y1 = cy + radius * Math.sin(start)
          const x2 = cx + radius * Math.cos(end)
          const y2 = cy + radius * Math.sin(end)
          return (
            <path
              key={index}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`}
              fill={FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
              stroke="#fff"
              strokeWidth="1"
              opacity={0.92}
            >
              <title>{`${labels[index] ?? ''}: ${value}`}</title>
            </path>
          )
        })}
        <circle cx={cx} cy={cy} r={radius * 0.42} fill="#fff" />
        <text x={cx} y={cy + 2} textAnchor="middle" className="chart-total">
          {total}
        </text>
        {!compact &&
          values.slice(0, 6).map((value, index) => (
            <g key={`legend-${index}`}>
              <rect
                x={6}
                y={74 + index * 4}
                width={3}
                height={3}
                rx={1}
                fill={FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
              />
              <text x={11} y={76.6 + index * 4} className="chart-legend">
                {labels[index] ?? ''} ({value})
              </text>
            </g>
          ))}
      </svg>
    )
  }

  if (config.kind === 'radar') {
    const cx = 50
    const cy = 52
    const radius = compact ? 25 : 29
    const count = Math.max(3, values.length)
    const series = Array.from({ length: count }, (_, index) => values[index] ?? 0)
    const angleAt = (index: number) => -Math.PI / 2 + (index * Math.PI * 2) / count
    const pointAt = (index: number, ratio: number) => ({
      x: cx + Math.cos(angleAt(index)) * radius * ratio,
      y: cy + Math.sin(angleAt(index)) * radius * ratio,
    })
    const polygonAt = (ratio: number) =>
      Array.from({ length: count }, (_, index) => {
        const point = pointAt(index, ratio)
        return `${point.x},${point.y}`
      }).join(' ')
    const shape = series
      .map((value, index) => {
        const point = pointAt(index, Math.max(0.03, value / max))
        return `${point.x},${point.y}`
      })
      .join(' ')
    return (
      <svg
        className="chart-svg"
        viewBox="0 0 100 100"
        role="img"
        aria-label={config.title || translate('نمودار راداری', 'Radar chart')}
      >
        {background}
        {config.title && (
          <text x="50" y="9" textAnchor="middle" className="chart-title">
            {config.title}
          </text>
        )}
        {[0.33, 0.66, 1].map((ratio) => (
          <polygon
            key={ratio}
            points={polygonAt(ratio)}
            fill="none"
            stroke="#e2e4ec"
            strokeWidth=".5"
          />
        ))}
        {Array.from({ length: count }, (_, index) => {
          const point = pointAt(index, 1)
          return (
            <line
              key={`axis-${index}`}
              x1={cx}
              y1={cy}
              x2={point.x}
              y2={point.y}
              stroke="#e2e4ec"
              strokeWidth=".5"
            />
          )
        })}
        <polygon
          points={shape}
          fill={config.color || '#f43f5e'}
          fillOpacity=".2"
          stroke={config.color || '#f43f5e'}
          strokeWidth="1.5"
        />
        {series.map((value, index) => {
          const point = pointAt(index, Math.max(0.03, value / max))
          return (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r="1.4"
              fill="#fff"
              stroke={config.color || '#f43f5e'}
              strokeWidth="1"
            >
              <title>{`${labels[index] ?? ''}: ${value}`}</title>
            </circle>
          )
        })}
        {Array.from({ length: count }, (_, index) => {
          const point = pointAt(index, 1.16)
          const anchor =
            Math.abs(point.x - cx) < 4 ? 'middle' : point.x > cx ? 'start' : 'end'
          return (
            <text
              key={`label-${index}`}
              x={point.x}
              y={point.y + 1.5}
              textAnchor={anchor}
              className="chart-label"
            >
              {labels[index] ?? ''}
            </text>
          )
        })}
      </svg>
    )
  }

  if (config.kind === 'hbar') {
    const top = config.title ? 17 : 9
    const bottom = 88
    const slot = (bottom - top) / Math.max(1, values.length)
    const plotX = 30
    const plotWidth = 62
    return (
      <svg
        className="chart-svg"
        viewBox="0 0 100 100"
        role="img"
        aria-label={config.title || translate('نمودار میله‌ای افقی', 'Horizontal bar chart')}
      >
        {background}
        {config.title && (
          <text x="50" y="9" textAnchor="middle" className="chart-title">
            {config.title}
          </text>
        )}
        <line x1={plotX} y1={top} x2={plotX} y2={bottom} stroke="#c9ccd8" strokeWidth=".8" />
        {values.map((value, index) => {
          const barHeight = slot * 0.56
          const barWidth = (value / max) * plotWidth
          const y = top + index * slot + (slot - barHeight) / 2
          return (
            <g key={index}>
              <rect
                x={plotX}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={1.5}
                fill={config.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                opacity={0.9}
              >
                <title>{`${labels[index] ?? ''}: ${value}`}</title>
              </rect>
              <text
                x={plotX - 2}
                y={y + barHeight * 0.72}
                textAnchor="end"
                className="chart-label"
              >
                {labels[index] ?? ''}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }

  if (config.kind === 'scatter') {
    const coords = values.map((value, index) => ({
      x: 14 + (index / Math.max(1, values.length - 1)) * 76,
      y: 82 - (value / max) * 62,
    }))
    return (
      <svg
        className="chart-svg"
        viewBox="0 0 100 100"
        role="img"
        aria-label={config.title || translate('نمودار نقطه‌ای', 'Scatter chart')}
      >
        {background}
        {config.title && (
          <text x="50" y="9" textAnchor="middle" className="chart-title">
            {config.title}
          </text>
        )}
        <line x1="14" y1="82" x2="92" y2="82" stroke="#c9ccd8" strokeWidth=".8" />
        <line x1="14" y1="16" x2="14" y2="82" stroke="#c9ccd8" strokeWidth=".8" />
        {coords.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="2.1" fill={config.color || '#f43f5e'} opacity=".9">
              <title>{`${labels[index] ?? ''}: ${values[index] ?? 0}`}</title>
            </circle>
            <text x={point.x} y={92} textAnchor="middle" className="chart-label">
              {labels[index] ?? ''}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  if (config.kind === 'line' || config.kind === 'area') {
    const coords = values.map((value, index) => ({
      x: 12 + (index / Math.max(1, values.length - 1)) * 78,
      y: 82 - (value / max) * 62,
    }))
    const points = coords.map((point) => `${point.x},${point.y}`).join(' ')
    return (
      <svg
        className="chart-svg"
        viewBox="0 0 100 100"
        role="img"
        aria-label={
          config.title ||
          (config.kind === 'area'
            ? translate('نمودار سطحی', 'Area chart')
            : translate('نمودار خطی', 'Line chart'))
        }
      >
        {background}
        {config.title && (
          <text x="50" y="9" textAnchor="middle" className="chart-title">
            {config.title}
          </text>
        )}
        <line x1="12" y1="82" x2="92" y2="82" stroke="#c9ccd8" strokeWidth=".8" />
        {config.kind === 'area' && (
          <polygon
            points={`12,82 ${points} 90,82`}
            fill={config.color || '#f43f5e'}
            fillOpacity=".2"
            stroke="none"
          />
        )}
        <polyline
          points={points}
          fill="none"
          stroke={config.color || '#f43f5e'}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="2"
              fill="#fff"
              stroke={config.color || '#f43f5e'}
              strokeWidth="1.5"
            />
            <text x={point.x} y={92} textAnchor="middle" className="chart-label">
              {labels[index] ?? ''}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  return (
    <svg
      className="chart-svg"
      viewBox="0 0 100 100"
      role="img"
      aria-label={config.title || translate('نمودار میله‌ای', 'Bar chart')}
    >
      {background}
      {config.title && (
        <text x="50" y="9" textAnchor="middle" className="chart-title">
          {config.title}
        </text>
      )}
      <line x1="12" y1="82" x2="94" y2="82" stroke="#c9ccd8" strokeWidth=".8" />
      {values.map((value, index) => {
        const slot = 78 / Math.max(1, values.length)
        const barWidth = slot * 0.58
        const x = 14 + index * slot + (slot - barWidth) / 2
        const height = (value / max) * 58
        return (
          <g key={index}>
            <rect
              x={x}
              y={82 - height}
              width={barWidth}
              height={height}
              rx={1.5}
              fill={config.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
              opacity={0.9}
            >
              <title>{`${labels[index] ?? ''}: ${value}`}</title>
            </rect>
            <text x={x + barWidth / 2} y={90} textAnchor="middle" className="chart-label">
              {labels[index] ?? ''}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
