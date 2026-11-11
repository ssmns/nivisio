import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { Annotation, NormPoint, PenStyle } from '../../lib/types'
import { pressureWidth, strokeDash } from '../../lib/utils'

interface InkLayerProps {
  annotations: Annotation[]
  activeObjectId: string | null
  interactive: boolean
  objectDelta: NormPoint
  size: { width: number; height: number }
  selectedClass: (annotation: Annotation) => string
  moveStyle: (annotation: Annotation) => CSSProperties | undefined
  beginObjectDrag: (event: ReactPointerEvent<Element>, annotation: Annotation) => void
  draft: NormPoint[]
  draftPressures: number[]
  penStyle: PenStyle
  penWidthScale: number
  color: string
  highlightColor: string
}

export function InkLayer({
  annotations,
  activeObjectId,
  interactive,
  objectDelta,
  size,
  selectedClass,
  moveStyle,
  beginObjectDrag,
  draft,
  draftPressures,
  penStyle,
  penWidthScale,
  color,
  highlightColor,
}: InkLayerProps) {
  const inks = annotations.filter((annotation) => annotation.type === 'ink')
  return (
    <>
          {inks.map((annotation) => {
            const points = annotation.points ?? []
            const pressures = annotation.pressures ?? []
            const style = annotation.penStyle ?? 'pen'
            const base = annotation.strokeWidth ?? 0.0026
            const opacity = annotation.opacity ?? (style === 'marker' ? 0.34 : 1)
            if (points.length < 2) return null
            return (
              <svg
                key={annotation.id}
                className={`ink-layer${style === 'marker' ? ' ink-layer--marker' : ''}${selectedClass(annotation)}${
                  activeObjectId === annotation.id ? ' is-object-selected' : ''
                }`}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{
                  opacity,
                  pointerEvents: 'none',
                  cursor: interactive ? 'move' : undefined,
                  ...moveStyle(annotation),
                  ...(activeObjectId === annotation.id &&
                  (objectDelta.x || objectDelta.y)
                    ? {
                        transform: `translate(${objectDelta.x * size.width}px, ${
                          objectDelta.y * size.height
                        }px)`,
                      }
                    : {}),
                }}
                onPointerDown={(event) => beginObjectDrag(event, annotation)}
              >
                {points.slice(1).map((point, index) => {
                  const previous = points[index]
                  const pressure = pressures[index + 1] ?? pressures[index] ?? 0.55
                  const width = pressureWidth(base, pressure, style) * 100
                  return (
                    <line
                      key={index}
                      x1={previous.x * 100}
                      y1={previous.y * 100}
                      x2={point.x * 100}
                      y2={point.y * 100}
                      stroke={annotation.color}
                      strokeWidth={width}
                      strokeLinecap={style === 'marker' ? 'butt' : 'round'}
                      strokeLinejoin="round"
                      strokeDasharray={strokeDash(style, base)}
                      style={{ pointerEvents: interactive ? 'stroke' : 'none' }}
                    />
                  )
                })}
              </svg>
            )
          })}

          {draft.length > 1 && (
            <svg
              className={`ink-layer${penStyle === 'marker' ? ' ink-layer--marker' : ''}`}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{
                opacity: penStyle === 'marker' ? 0.34 : penStyle === 'pencil' ? 0.62 : 1,
              }}
            >
              {draft.slice(1).map((point, index) => {
                const previous = draft[index]
                const pressure = draftPressures[index + 1] ?? draftPressures[index] ?? 0.55
                const width =
                  pressureWidth(0.0026 * penWidthScale, pressure, penStyle) * 100
                return (
                  <line
                    key={index}
                    x1={previous.x * 100}
                    y1={previous.y * 100}
                    x2={point.x * 100}
                    y2={point.y * 100}
                    stroke={penStyle === 'marker' ? highlightColor : color}
                    strokeWidth={width}
                    strokeLinecap={penStyle === 'marker' ? 'butt' : 'round'}
                    strokeDasharray={strokeDash(penStyle, 0.0026 * penWidthScale)}
                  />
                )
              })}
            </svg>
          )}

    </>
  )
}
