import type { CSSProperties, ReactNode, PointerEvent as ReactPointerEvent } from 'react'
import type { Annotation, ReaderTool } from '../../lib/types'
import { polygonPoints, starPoints } from '../../lib/utils'
import { GuideView } from './GuideView'

interface BoxGeometry {
  x: number
  y: number
  w: number
  h: number
  rotation: number
}

interface ShapeGuideLayerProps {
  annotations: Annotation[]
  tool: ReaderTool
  activeObjectId: string | null
  selectedClass: (annotation: Annotation) => string
  moveStyle: (annotation: Annotation) => CSSProperties | undefined
  tapeGeometryFor: (annotation: Annotation) => BoxGeometry
  boxHandles: (active: boolean) => ReactNode
  beginTapeTransform: (
    event: ReactPointerEvent<HTMLDivElement>,
    annotation: Annotation,
  ) => void
  pageSize: { width: number; height: number }
  pagePoints: { width: number; height: number }
}

export function ShapeGuideLayer({
  annotations,
  tool,
  activeObjectId,
  selectedClass,
  moveStyle,
  tapeGeometryFor,
  boxHandles,
  beginTapeTransform,
  pageSize,
  pagePoints,
}: ShapeGuideLayerProps) {
  const guides = annotations.filter((annotation) => annotation.type === 'guide')
  const shapes = annotations.filter((annotation) => annotation.type === 'shape')
  return (
    <>
          {guides.map((annotation) => {
            const geometry = tapeGeometryFor(annotation)
            const isActive = tool === 'select' && activeObjectId === annotation.id
            const kind = annotation.guide?.kind ?? 'ruler'
            return (
              <div
                key={annotation.id}
                className={`object-box guide-box${selectedClass(annotation)}${
                  isActive ? ' is-object-selected' : ''
                }`}
                style={{
                  left: `${geometry.x * 100}%`,
                  top: `${geometry.y * 100}%`,
                  width: `${geometry.w * 100}%`,
                  height: `${geometry.h * 100}%`,
                  transform: `rotate(${geometry.rotation}deg)`,
                  pointerEvents: tool === 'select' ? 'auto' : 'none',
                  cursor: tool === 'select' ? 'move' : undefined,
                  zIndex: isActive ? 9 : 3,
                  ...moveStyle(annotation),
                }}
                onPointerDown={(event) => beginTapeTransform(event, annotation)}
              >
                <GuideView
                  kind={kind}
                  width={geometry.w * pageSize.width}
                  height={geometry.h * pageSize.height}
                  pageWidthPt={pagePoints.width}
                  pageWidthPx={pageSize.width}
                />
                {boxHandles(isActive)}
              </div>
            )
          })}

          {shapes.map((annotation) => {
            const geometry = tapeGeometryFor(annotation)
            const isActive = tool === 'select' && activeObjectId === annotation.id
            const config = annotation.shape ?? { kind: 'line' as const }
            const color = annotation.color
            const filled = config.filled
            const sw = (config.strokeWidth ?? 1) * 1.4
            const markerId = `arrow-${annotation.id}`
            const x1 = config.flipX ? 100 : 0
            const y1 = config.flipY ? 100 : 0
            const x2 = config.flipX ? 0 : 100
            const y2 = config.flipY ? 0 : 100
            return (
              <div
                key={annotation.id}
                className={`object-box shape-box${selectedClass(annotation)}${
                  isActive ? ' is-object-selected' : ''
                }`}
                style={{
                  left: `${geometry.x * 100}%`,
                  top: `${geometry.y * 100}%`,
                  width: `${geometry.w * 100}%`,
                  height: `${geometry.h * 100}%`,
                  transform: `rotate(${geometry.rotation}deg)`,
                  pointerEvents: tool === 'select' ? 'auto' : 'none',
                  cursor: tool === 'select' ? 'move' : undefined,
                  zIndex: isActive ? 8 : undefined,
                  color,
                  ...moveStyle(annotation),
                }}
                onPointerDown={(event) => beginTapeTransform(event, annotation)}
              >
                <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <marker id={markerId} markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                      <path d="M0,0 L6,3 L0,6 Z" fill={color} />
                    </marker>
                  </defs>
                  {(config.kind === 'line' || config.kind === 'arrow') && (
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={color}
                      strokeWidth={sw}
                      strokeLinecap="round"
                      markerEnd={config.kind === 'arrow' ? `url(#${markerId})` : undefined}
                    />
                  )}
                  {config.kind === 'rect' && (
                    <rect x="2" y="2" width="96" height="96" fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 0} stroke={color} strokeWidth={sw} />
                  )}
                  {(config.kind === 'ellipse' || config.kind === 'circle') && (
                    <ellipse cx="50" cy="50" rx="48" ry="48" fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 0} stroke={color} strokeWidth={sw} />
                  )}
                  {config.kind === 'triangle' && (
                    <polygon points="50,4 96,96 4,96" fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 0} stroke={color} strokeWidth={sw} />
                  )}
                  {config.kind === 'polygon' && (
                    <polygon
                      points={polygonPoints(config.sides ?? 5)}
                      fill={filled ? color : 'none'}
                      fillOpacity={filled ? 0.18 : 0}
                      stroke={color}
                      strokeWidth={sw}
                    />
                  )}
                  {config.kind === 'star' && (
                    <polygon
                      points={starPoints(config.sides ?? 5)}
                      fill={filled ? color : 'none'}
                      fillOpacity={filled ? 0.18 : 0}
                      stroke={color}
                      strokeWidth={sw}
                    />
                  )}
                </svg>
                {boxHandles(isActive)}
              </div>
            )
          })}

    </>
  )
}
