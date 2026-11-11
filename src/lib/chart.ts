import type { ChartConfig } from './types'

const COLORS = ['#f43f5e', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6']

function niceFont(size: number): string {
  return `600 ${size}px Vazirmatn, Tahoma, sans-serif`
}

/** Draws a chart into a canvas rectangle (used by the PDF exporter). */
export function drawChartOnCanvas(
  ctx: CanvasRenderingContext2D,
  config: ChartConfig,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const values = config.values.map((value) => (Number.isFinite(value) ? Math.max(0, value) : 0))
  const labels = config.labels
  const total = values.reduce((sum, value) => sum + value, 0) || 1
  const max = Math.max(1, ...values)

  ctx.save()
  if (config.background !== 'transparent') {
    ctx.fillStyle = config.background || '#ffffff'
    ctx.fillRect(x, y, width, height)
    ctx.strokeStyle = '#e3e1d9'
    ctx.lineWidth = Math.max(1, width * 0.002)
    ctx.strokeRect(x, y, width, height)
  }

  const titleSize = Math.max(11, width * 0.035)
  ctx.fillStyle = '#262736'
  ctx.font = niceFont(titleSize)
  ctx.textAlign = 'center'
  if (config.title) ctx.fillText(config.title, x + width / 2, y + titleSize * 1.8)

  const top = y + (config.title ? titleSize * 2.8 : height * 0.08)
  const plotHeight = height * 0.62
  const baseY = top + plotHeight
  const left = x + width * 0.08
  const plotWidth = width * 0.84

  if (config.kind === 'pie') {
    const cx = x + width / 2
    const cy = top + plotHeight / 2 + height * 0.02
    const radius = Math.min(width, height) * 0.27
    let angle = -Math.PI / 2
    values.forEach((value, index) => {
      const slice = (value / total) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, angle, angle + slice)
      ctx.closePath()
      ctx.fillStyle = COLORS[index % COLORS.length]
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
      angle += slice
    })
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 0.42, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.fillStyle = '#262736'
    ctx.font = niceFont(Math.max(10, radius * 0.24))
    ctx.textAlign = 'center'
    ctx.fillText(String(total), cx, cy + radius * 0.08)
    ctx.textAlign = 'left'
    const legendSize = Math.max(9, width * 0.022)
    ctx.font = `400 ${legendSize}px Vazirmatn, Tahoma, sans-serif`
    values.slice(0, 6).forEach((value, index) => {
      const ly = baseY + height * 0.07 + index * legendSize * 1.55
      if (ly > y + height - 4) return
      ctx.fillStyle = COLORS[index % COLORS.length]
      ctx.fillRect(left, ly - legendSize * 0.8, legendSize * 0.9, legendSize * 0.9)
      ctx.fillStyle = '#4a4b5c'
      ctx.fillText(`${labels[index] ?? ''} (${value})`, left + legendSize * 1.4, ly)
    })
    ctx.restore()
    return
  }

  if (config.kind === 'radar') {
    const cx = x + width / 2
    const cy = top + plotHeight / 2 + height * 0.02
    const radius = Math.min(width, height) * 0.26
    const count = Math.max(3, values.length)
    const series = Array.from({ length: count }, (_, index) => values[index] ?? 0)
    const angleAt = (index: number) => -Math.PI / 2 + (index * Math.PI * 2) / count
    const pointAt = (index: number, ratio: number) => ({
      x: cx + Math.cos(angleAt(index)) * radius * ratio,
      y: cy + Math.sin(angleAt(index)) * radius * ratio,
    })
    ctx.strokeStyle = '#e2e4ec'
    ctx.lineWidth = Math.max(1, width * 0.0012)
    ;[0.33, 0.66, 1].forEach((ratio) => {
      ctx.beginPath()
      for (let i = 0; i < count; i += 1) {
        const point = pointAt(i, ratio)
        if (i === 0) ctx.moveTo(point.x, point.y)
        else ctx.lineTo(point.x, point.y)
      }
      ctx.closePath()
      ctx.stroke()
    })
    for (let i = 0; i < count; i += 1) {
      const point = pointAt(i, 1)
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(point.x, point.y)
      ctx.stroke()
    }
    ctx.beginPath()
    series.forEach((value, index) => {
      const point = pointAt(index, Math.max(0.03, value / max))
      if (index === 0) ctx.moveTo(point.x, point.y)
      else ctx.lineTo(point.x, point.y)
    })
    ctx.closePath()
    ctx.fillStyle = config.color || COLORS[0]
    ctx.globalAlpha = 0.2
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.strokeStyle = config.color || COLORS[0]
    ctx.lineWidth = Math.max(1.5, width * 0.004)
    ctx.stroke()
    const labelSize = Math.max(8, width * 0.02)
    ctx.font = `400 ${labelSize}px Vazirmatn, Tahoma, sans-serif`
    series.forEach((_value, index) => {
      const point = pointAt(index, 1.16)
      ctx.textAlign = Math.abs(point.x - cx) < 4 ? 'center' : point.x > cx ? 'left' : 'right'
      ctx.fillStyle = '#4a4b5c'
      ctx.fillText(labels[index] ?? '', point.x, point.y + labelSize * 0.35)
    })
    ctx.restore()
    return
  }

  ctx.strokeStyle = '#c9ccd8'
  ctx.lineWidth = Math.max(1, width * 0.0015)

  if (config.kind === 'hbar') {
    const rowHeight = plotHeight / Math.max(1, values.length)
    const barHeight = rowHeight * 0.56
    const labelSize = Math.max(8, width * 0.02)
    ctx.font = `400 ${labelSize}px Vazirmatn, Tahoma, sans-serif`
    ctx.textAlign = 'right'
    values.forEach((value, index) => {
      const barWidth = (value / max) * plotWidth
      const py = top + index * rowHeight + (rowHeight - barHeight) / 2
      ctx.fillStyle = config.color || COLORS[index % COLORS.length]
      ctx.fillRect(left, py, barWidth, barHeight)
      ctx.fillStyle = '#55576a'
      ctx.fillText(labels[index] ?? '', left - 4, py + barHeight * 0.72)
    })
    ctx.beginPath()
    ctx.moveTo(left, top)
    ctx.lineTo(left, baseY)
    ctx.stroke()
    ctx.restore()
    return
  }

  ctx.beginPath()
  ctx.moveTo(left, top)
  ctx.lineTo(left, baseY)
  ctx.lineTo(left + plotWidth, baseY)
  ctx.stroke()

  const labelSize = Math.max(8, width * 0.02)
  ctx.font = `400 ${labelSize}px Vazirmatn, Tahoma, sans-serif`
  ctx.textAlign = 'center'

  if (config.kind === 'line' || config.kind === 'area' || config.kind === 'scatter') {
    if (config.kind === 'area') {
      ctx.beginPath()
      values.forEach((value, index) => {
        const px = left + (index / Math.max(1, values.length - 1)) * plotWidth
        const py = baseY - (value / max) * plotHeight
        if (index === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.lineTo(left + plotWidth, baseY)
      ctx.lineTo(left, baseY)
      ctx.closePath()
      ctx.fillStyle = config.color || COLORS[0]
      ctx.globalAlpha = 0.2
      ctx.fill()
      ctx.globalAlpha = 1
    }
    if (config.kind !== 'scatter') {
      ctx.beginPath()
      values.forEach((value, index) => {
        const px = left + (index / Math.max(1, values.length - 1)) * plotWidth
        const py = baseY - (value / max) * plotHeight
        if (index === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.strokeStyle = config.color || COLORS[0]
      ctx.lineWidth = Math.max(2, width * 0.006)
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.stroke()
    }
    values.forEach((value, index) => {
      const px = left + (index / Math.max(1, values.length - 1)) * plotWidth
      const py = baseY - (value / max) * plotHeight
      ctx.beginPath()
      ctx.arc(px, py, Math.max(2, width * 0.007), 0, Math.PI * 2)
      ctx.fillStyle = config.kind === 'scatter' ? config.color || COLORS[0] : '#fff'
      ctx.fill()
      if (config.kind !== 'scatter') {
        ctx.strokeStyle = config.color || COLORS[0]
        ctx.lineWidth = Math.max(1.5, width * 0.003)
        ctx.stroke()
      }
      ctx.fillStyle = '#55576a'
      ctx.fillText(labels[index] ?? '', px, baseY + labelSize * 1.8)
    })
  } else {
    const slot = plotWidth / Math.max(1, values.length)
    const barWidth = slot * 0.56
    values.forEach((value, index) => {
      const barHeight = (value / max) * plotHeight
      const px = left + index * slot + (slot - barWidth) / 2
      ctx.fillStyle = config.color || COLORS[index % COLORS.length]
      ctx.fillRect(px, baseY - barHeight, barWidth, barHeight)
      ctx.fillStyle = '#55576a'
      ctx.fillText(labels[index] ?? '', px + barWidth / 2, baseY + labelSize * 1.8)
    })
  }
  ctx.restore()
}
