import type { CSSProperties, ReactNode, PointerEvent as ReactPointerEvent } from 'react'
import type { Annotation, ReaderTool, ShapeConfig } from '../../lib/types'
import { polygonPoints, starPoints } from '../../lib/utils'
import {
  bezierControls,
  curveControlPoint,
  curveMidpoint,
  isLineShape,
  shapeEndpoints,
  spiralPoints,
} from '../../lib/shapes'
import type { ShapePreview } from '../../hooks/useShapeEndpoints'
import { translate } from '../../lib/lang'
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
  shapePreview?: ShapePreview | null
}

/** Scale the 0..100 points from utils to the real pixel box. */
function scalePoints(points: string, width: number, height: number): string {
  return points
    .split(' ')
    .map((pair) => {
      const [x, y] = pair.split(',').map(Number)
      return `${(x / 100) * width},${(y / 100) * height}`
    })
    .join(' ')
}

function heartPath(width: number, height: number): string {
  const px = (x: number) => (x / 100) * width
  const py = (y: number) => (y / 100) * height
  return [
    `M ${px(50)} ${py(88)}`,
    `C ${px(20)} ${py(64)} ${px(4)} ${py(42)} ${px(4)} ${py(26)}`,
    `C ${px(4)} ${py(10)} ${px(16)} ${py(4)} ${px(28)} ${py(4)}`,
    `C ${px(38)} ${py(4)} ${px(46)} ${py(10)} ${px(50)} ${py(20)}`,
    `C ${px(54)} ${py(10)} ${px(62)} ${py(4)} ${px(72)} ${py(4)}`,
    `C ${px(84)} ${py(4)} ${px(96)} ${py(10)} ${px(96)} ${py(26)}`,
    `C ${px(96)} ${py(42)} ${px(80)} ${py(64)} ${px(50)} ${py(88)} Z`,
  ].join(' ')
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
  shapePreview,
}: ShapeGuideLayerProps) {
  const guides = annotations.filter((annotation) => annotation.type === 'guide')
  const shapes = annotations.filter((annotation) => annotation.type === 'shape')

  const geometryFor = (annotation: Annotation): BoxGeometry => {
    if (shapePreview?.id === annotation.id) {
      return { ...shapePreview.rect, rotation: shapePreview.rotation }
    }
    return tapeGeometryFor(annotation)
  }

  const configFor = (annotation: Annotation): ShapeConfig => {
    if (shapePreview?.id === annotation.id) return shapePreview.shape
    return annotation.shape ?? { kind: 'line' }
  }

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
        const geometry = geometryFor(annotation)
        const isActive = tool === 'select' && activeObjectId === annotation.id
        const config = configFor(annotation)
        const color = annotation.color
        const filled = Boolean(config.filled)
        const lineLike = isLineShape(config.kind)
        const stroke = Math.max(1.2, pageSize.width * 0.0026 * (config.strokeWidth ?? 1))
        const width = Math.max(1, geometry.w * pageSize.width)
        const height = Math.max(1, geometry.h * pageSize.height)
        const markerId = `arrow-${annotation.id}`
        const head = Math.max(7, stroke * 4.6)
        const endpoints = shapeEndpoints(config)
        const p1 = { x: endpoints.start.x * width, y: endpoints.start.y * height }
        const p2 = { x: endpoints.end.x * width, y: endpoints.end.y * height }
        const control =
          config.kind === 'curve-arrow'
            ? curveControlPoint(p1, p2, config.bend ?? 0.35)
            : null
        const mid = control ? curveMidpoint(p1, p2, control) : null
        const bezier =
          config.kind === 'bezier-arrow'
            ? bezierControls(p1, p2, config.bend1 ?? 0.35, config.bend2 ?? 0.35)
            : null
        const spiral = config.kind === 'spiral' ? spiralPoints(width, height) : null
        const inset = stroke / 2 + 1
        return (
          <div
            key={annotation.id}
            className={`object-box shape-box${lineLike ? ' shape-box--line' : ''}${selectedClass(annotation)}${
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
            <svg
              viewBox={`0 0 ${width} ${height}`}
              width="100%"
              height="100%"
              preserveAspectRatio="none"
            >
              <defs>
                <marker
                  id={markerId}
                  markerUnits="userSpaceOnUse"
                  markerWidth={head}
                  markerHeight={head}
                  refX={head}
                  refY={head / 2}
                  orient="auto"
                >
                  <path
                    d={`M0,0 L${head},${head / 2} L0,${head} Z`}
                    fill={color}
                    stroke="none"
                  />
                </marker>
              </defs>
              {(config.kind === 'line' || config.kind === 'arrow') && (
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  markerEnd={config.kind === 'arrow' ? `url(#${markerId})` : undefined}
                />
              )}
              {config.kind === 'curve-arrow' && control && (
                <path
                  d={`M ${p1.x} ${p1.y} Q ${control.x} ${control.y} ${p2.x} ${p2.y}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  markerEnd={`url(#${markerId})`}
                />
              )}
              {config.kind === 'bezier-arrow' && bezier && (
                <path
                  d={`M ${p1.x} ${p1.y} C ${bezier.c1.x} ${bezier.c1.y} ${bezier.c2.x} ${bezier.c2.y} ${p2.x} ${p2.y}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  markerEnd={`url(#${markerId})`}
                />
              )}
              {config.kind === 'rect' && (
                <rect
                  x={inset}
                  y={inset}
                  width={Math.max(0, width - inset * 2)}
                  height={Math.max(0, height - inset * 2)}
                  fill={filled ? color : 'none'}
                  fillOpacity={filled ? 0.18 : 0}
                  stroke={color}
                  strokeWidth={stroke}
                />
              )}
              {(config.kind === 'ellipse' || config.kind === 'circle') && (
                <ellipse
                  cx={width / 2}
                  cy={height / 2}
                  rx={Math.max(0, width / 2 - inset)}
                  ry={Math.max(0, height / 2 - inset)}
                  fill={filled ? color : 'none'}
                  fillOpacity={filled ? 0.18 : 0}
                  stroke={color}
                  strokeWidth={stroke}
                />
              )}
              {config.kind === 'triangle' && (
                <polygon
                  points={scalePoints('50,4 96,96 4,96', width, height)}
                  fill={filled ? color : 'none'}
                  fillOpacity={filled ? 0.18 : 0}
                  stroke={color}
                  strokeWidth={stroke}
                />
              )}
              {config.kind === 'polygon' && (
                <polygon
                  points={scalePoints(polygonPoints(config.sides ?? 5), width, height)}
                  fill={filled ? color : 'none'}
                  fillOpacity={filled ? 0.18 : 0}
                  stroke={color}
                  strokeWidth={stroke}
                />
              )}
              {config.kind === 'star' && (
                <polygon
                  points={scalePoints(starPoints(config.sides ?? 5), width, height)}
                  fill={filled ? color : 'none'}
                  fillOpacity={filled ? 0.18 : 0}
                  stroke={color}
                  strokeWidth={stroke}
                />
              )}
              {config.kind === 'diamond' && (
                <polygon
                  points={scalePoints('50,2 98,50 50,98 2,50', width, height)}
                  fill={filled ? color : 'none'}
                  fillOpacity={filled ? 0.18 : 0}
                  stroke={color}
                  strokeWidth={stroke}
                />
              )}
              {config.kind === 'heart' && (
                <path
                  d={heartPath(width, height)}
                  fill={filled ? color : 'none'}
                  fillOpacity={filled ? 0.18 : 0}
                  stroke={color}
                  strokeWidth={stroke}
                  strokeLinejoin="round"
                />
              )}
              {spiral && (
                <path
                  d={spiral
                    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
                    .join(' ')}
                  fill="none"
                  stroke={color}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>

            {lineLike && isActive ? (
              <>
                <span
                  className="shape-endpoint"
                  data-shape-handle="start"
                  style={{ left: `${endpoints.start.x * 100}%`, top: `${endpoints.start.y * 100}%` }}
                />
                <span
                  className="shape-endpoint"
                  data-shape-handle="end"
                  style={{ left: `${endpoints.end.x * 100}%`, top: `${endpoints.end.y * 100}%` }}
                />
                {config.kind === 'curve-arrow' && mid && (
                  <span
                    className="shape-bend-handle"
                    data-shape-handle="bend"
                    style={{
                      left: `${(mid.x / width) * 100}%`,
                      top: `${(mid.y / height) * 100}%`,
                    }}
                  />
                )}
                {config.kind === 'bezier-arrow' && bezier && (
                  <>
                    <span
                      className="shape-bend-handle"
                      data-shape-handle="bend1"
                      style={{
                        left: `${(bezier.c1.x / width) * 100}%`,
                        top: `${(bezier.c1.y / height) * 100}%`,
                      }}
                    />
                    <span
                      className="shape-bend-handle"
                      data-shape-handle="bend2"
                      style={{
                        left: `${(bezier.c2.x / width) * 100}%`,
                        top: `${(bezier.c2.y / height) * 100}%`,
                      }}
                    />
                  </>
                )}
                <span
                  className="tape-rotate-handle"
                  data-tape-handle="rotate"
                  title={translate('چرخش (با Shift در ۱۵ درجه)', 'Rotate (Shift for 15° steps)')}
                />
              </>
            ) : (
              boxHandles(isActive)
            )}
          </div>
        )
      })}
    </>
  )
}
