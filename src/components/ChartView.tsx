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

  if (config.kind === 'line') {
    const points = values
      .map((value, index) => {
        const x = 12 + (index / Math.max(1, values.length - 1)) * 78
        const y = 82 - (value / max) * 62
        return `${x},${y}`
      })
      .join(' ')
    return (
      <svg
        className="chart-svg"
        viewBox="0 0 100 100"
        role="img"
        aria-label={config.title || translate('نمودار خطی', 'Line chart')}
      >
        {background}
        {config.title && (
          <text x="50" y="9" textAnchor="middle" className="chart-title">
            {config.title}
          </text>
        )}
        <line x1="12" y1="82" x2="92" y2="82" stroke="#c9ccd8" strokeWidth=".8" />
        <polyline
          points={points}
          fill="none"
          stroke={config.color || '#f43f5e'}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {values.map((value, index) => {
          const x = 12 + (index / Math.max(1, values.length - 1)) * 78
          const y = 82 - (value / max) * 62
          return (
            <g key={index}>
              <circle cx={x} cy={y} r="2" fill="#fff" stroke={config.color || '#f43f5e'} strokeWidth="1.5" />
              <text x={x} y={92} textAnchor="middle" className="chart-label">
                {labels[index] ?? ''}
              </text>
            </g>
          )
        })}
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
