import type { Annotation } from './types'
import { bezierControls, curveControlPoint, shapeEndpoints, spiralPoints } from './shapes'

interface PxRect {
  x: number
  y: number
  w: number
  h: number
}

/** Draw a shape annotation on the flattened export canvas. */
export function drawShapeAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: Annotation,
  width: number,
  r: PxRect,
): void {
  const config = annotation.shape
  if (!config) return
  const angle = ((annotation.rotation ?? 0) * Math.PI) / 180
  const lineWidth = Math.max(1, width * 0.003 * (config.strokeWidth ?? 1))
  ctx.save()
  ctx.translate(r.x + r.w / 2, r.y + r.h / 2)
  ctx.rotate(angle)
  ctx.strokeStyle = annotation.color
  ctx.fillStyle = annotation.color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const { start, end } = shapeEndpoints(config)
  const x1 = (start.x - 0.5) * r.w
  const y1 = (start.y - 0.5) * r.h
  const x2 = (end.x - 0.5) * r.w
  const y2 = (end.y - 0.5) * r.h
  if (
    config.kind === 'line' ||
    config.kind === 'arrow' ||
    config.kind === 'curve-arrow' ||
    config.kind === 'bezier-arrow'
  ) {
    let tangentX = x2 - x1
    let tangentY = y2 - y1
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    if (config.kind === 'curve-arrow') {
      const control = curveControlPoint({ x: x1, y: y1 }, { x: x2, y: y2 }, config.bend ?? 0.35)
      ctx.quadraticCurveTo(control.x, control.y, x2, y2)
      tangentX = x2 - control.x
      tangentY = y2 - control.y
    } else if (config.kind === 'bezier-arrow') {
      const bezier = bezierControls(
        { x: x1, y: y1 },
        { x: x2, y: y2 },
        config.bend1 ?? 0.35,
        config.bend2 ?? 0.35,
      )
      ctx.bezierCurveTo(bezier.c1.x, bezier.c1.y, bezier.c2.x, bezier.c2.y, x2, y2)
      tangentX = x2 - bezier.c2.x
      tangentY = y2 - bezier.c2.y
    } else {
      ctx.lineTo(x2, y2)
    }
    ctx.stroke()
    if (
      config.kind === 'arrow' ||
      config.kind === 'curve-arrow' ||
      config.kind === 'bezier-arrow'
    ) {
      const head = Math.max(6, lineWidth * 5)
      const a = Math.atan2(tangentY, tangentX)
      ctx.beginPath()
      ctx.moveTo(x2, y2)
      ctx.lineTo(x2 - Math.cos(a - 0.4) * head, y2 - Math.sin(a - 0.4) * head)
      ctx.lineTo(x2 - Math.cos(a + 0.4) * head, y2 - Math.sin(a + 0.4) * head)
      ctx.closePath()
      ctx.fill()
    }
  } else if (config.kind === 'rect') {
    if (config.filled) {
      ctx.globalAlpha = 0.18
      ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h)
      ctx.globalAlpha = 1
    }
    ctx.strokeRect(-r.w / 2, -r.h / 2, r.w, r.h)
  } else if (config.kind === 'ellipse' || config.kind === 'circle') {
    ctx.beginPath()
    ctx.ellipse(0, 0, r.w / 2, r.h / 2, 0, 0, Math.PI * 2)
    if (config.filled) {
      ctx.globalAlpha = 0.18
      ctx.fill()
      ctx.globalAlpha = 1
    }
    ctx.stroke()
  } else if (config.kind === 'diamond') {
    ctx.beginPath()
    ctx.moveTo(0, -r.h / 2)
    ctx.lineTo(r.w / 2, 0)
    ctx.lineTo(0, r.h / 2)
    ctx.lineTo(-r.w / 2, 0)
    ctx.closePath()
    if (config.filled) {
      ctx.globalAlpha = 0.18
      ctx.fill()
      ctx.globalAlpha = 1
    }
    ctx.stroke()
  } else if (config.kind === 'heart') {
    const px = (value: number) => (value / 100 - 0.5) * r.w
    const py = (value: number) => (value / 100 - 0.5) * r.h
    ctx.beginPath()
    ctx.moveTo(px(50), py(88))
    ctx.bezierCurveTo(px(20), py(64), px(4), py(42), px(4), py(26))
    ctx.bezierCurveTo(px(4), py(10), px(16), py(4), px(28), py(4))
    ctx.bezierCurveTo(px(38), py(4), px(46), py(10), px(50), py(20))
    ctx.bezierCurveTo(px(54), py(10), px(62), py(4), px(72), py(4))
    ctx.bezierCurveTo(px(84), py(4), px(96), py(10), px(96), py(26))
    ctx.bezierCurveTo(px(96), py(42), px(80), py(64), px(50), py(88))
    ctx.closePath()
    if (config.filled) {
      ctx.globalAlpha = 0.18
      ctx.fill()
      ctx.globalAlpha = 1
    }
    ctx.stroke()
  } else if (config.kind === 'spiral') {
    const points = spiralPoints(r.w, r.h)
    ctx.beginPath()
    points.forEach((point, index) => {
      const x = point.x - r.w / 2
      const y = point.y - r.h / 2
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  } else {
    const count = Math.max(3, Math.min(24, config.sides ?? 5))
    const outer = Math.min(r.w, r.h) / 2
    const points: [number, number][] = []
    const total = config.kind === 'star' ? count * 2 : count
    for (let i = 0; i < total; i += 1) {
      const radius = config.kind === 'star' && i % 2 === 1 ? outer * 0.45 : outer
      const a = -Math.PI / 2 + (i * Math.PI * 2) / total
      points.push([Math.cos(a) * radius, Math.sin(a) * radius])
    }
    ctx.beginPath()
    points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
    ctx.closePath()
    if (config.filled) {
      ctx.globalAlpha = 0.18
      ctx.fill()
      ctx.globalAlpha = 1
    }
    ctx.stroke()
  }
  ctx.restore()
}
