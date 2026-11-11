import type { GridType, NormPoint } from './types'

export interface GridSnapOptions {
  grid?: GridType
  gridScale?: number
  width: number
  height: number
}

interface Basis {
  e1: [number, number]
  e2: [number, number]
}

function roundBasis(point: [number, number], basis: Basis): [number, number] {
  const det = basis.e1[0] * basis.e2[1] - basis.e1[1] * basis.e2[0]
  if (Math.abs(det) < 1e-6) return point
  const c1 = (point[0] * basis.e2[1] - point[1] * basis.e2[0]) / det
  const c2 = (basis.e1[0] * point[1] - basis.e1[1] * point[0]) / det
  const r1 = Math.round(c1)
  const r2 = Math.round(c2)
  return [
    basis.e1[0] * r1 + basis.e2[0] * r2,
    basis.e1[1] * r1 + basis.e2[1] * r2,
  ]
}

/**
 * Snap a normalized point to the visible paper grid. Each grid type has its
 * own geometry: ruled paper only snaps vertically, graph paper is fine,
 * isometric/30–60 use a triangular lattice and circular paper snaps by radius
 * and angle. A blank page never quantizes.
 */
export function snapPointToGrid(point: NormPoint, options: GridSnapOptions): NormPoint {
  const { grid, gridScale = 1 } = options
  const scale = Math.max(0.4, gridScale)
  if (!grid || grid === 'blank') return point

  if (grid === 'lined' || grid === 'cornell') {
    const stepY = 0.041 * scale
    return { x: point.x, y: Math.round(point.y / stepY) * stepY }
  }

  if (grid === 'grid') {
    const stepX = 0.044 * scale
    const stepY = 0.036 * scale
    return {
      x: Math.round(point.x / stepX) * stepX,
      y: Math.round(point.y / stepY) * stepY,
    }
  }

  if (grid === 'dots') {
    const stepX = 0.042 * scale
    const stepY = 0.032 * scale
    return {
      x: Math.round(point.x / stepX) * stepX,
      y: Math.round(point.y / stepY) * stepY,
    }
  }

  if (grid === 'graph') {
    const stepX = 0.022 * scale
    const stepY = 0.018 * scale
    return {
      x: Math.round(point.x / stepX) * stepX,
      y: Math.round(point.y / stepY) * stepY,
    }
  }

  const width = Math.max(1, options.width)
  const height = Math.max(1, options.height)
  const px = point.x * width
  const py = point.y * height
  const unit = 0.036 * scale * width

  if (grid === 'isometric' || grid === 'tri30') {
    // Both papers use the same equilateral lattice. The isometric paper draws
    // the ±30° families; the 30–60 paper adds the vertical family that closes
    // the triangles. Snapping to the lattice is correct for both.
    const angle = Math.PI / 6
    const basis: Basis = {
      e1: [Math.cos(angle) * unit, Math.sin(angle) * unit],
      e2: [Math.cos(angle) * unit, -Math.sin(angle) * unit],
    }
    const [x, y] = roundBasis([px, py], basis)
    return { x: x / width, y: y / height }
  }

  if (grid === 'circular') {
    const centerX = width / 2
    const centerY = height / 2
    const dx = px - centerX
    const dy = py - centerY
    const radius = Math.hypot(dx, dy)
    const ring = 0.045 * scale * width
    if (radius < ring * 0.35) return { x: 0.5, y: 0.5 }
    const snappedRadius = Math.max(ring, Math.round(radius / ring) * ring)
    const step = Math.PI / 12
    const snappedAngle = Math.round(Math.atan2(dy, dx) / step) * step
    return {
      x: (centerX + Math.cos(snappedAngle) * snappedRadius) / width,
      y: (centerY + Math.sin(snappedAngle) * snappedRadius) / height,
    }
  }

  return point
}
