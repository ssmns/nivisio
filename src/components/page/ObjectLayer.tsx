import type { CSSProperties, ReactNode, PointerEvent as ReactPointerEvent } from 'react'
import { ChartView } from '../ChartView'
import type { Annotation, ReaderTool } from '../../lib/types'
import { translate } from '../../lib/lang'

interface BoxGeometry {
  x: number
  y: number
  w: number
  h: number
  rotation: number
}

interface ObjectLayerProps {
  annotations: Annotation[]
  showCaptions: boolean
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
  onEditChart: (annotation: Annotation) => void
}

export function ObjectLayer({
  annotations,
  showCaptions,
  tool,
  activeObjectId,
  selectedClass,
  moveStyle,
  tapeGeometryFor,
  boxHandles,
  beginTapeTransform,
  onEditChart,
}: ObjectLayerProps) {
  const images = annotations.filter((annotation) => annotation.type === 'image')
  const charts = annotations.filter((annotation) => annotation.type === 'chart')
  return (
    <>
          {images.map((annotation) => {
            if (!annotation.image) return null
            const geometry = tapeGeometryFor(annotation)
            const isActive = tool === 'select' && activeObjectId === annotation.id
            return (
              <div
                key={annotation.id}
                className={`object-box image-box${selectedClass(annotation)}${
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
                  ...moveStyle(annotation),
                }}
                onPointerDown={(event) => beginTapeTransform(event, annotation)}
              >
                <img src={annotation.image} alt={annotation.note || translate('تصویر', 'Image')} draggable={false} />
                {showCaptions && annotation.note && (
                  <span className="object-caption" dir="auto">
                    {annotation.note}
                  </span>
                )}
                {boxHandles(isActive)}
              </div>
            )
          })}

          {charts.map((annotation) => {
            if (!annotation.chart) return null
            const geometry = tapeGeometryFor(annotation)
            const isActive = tool === 'select' && activeObjectId === annotation.id
            return (
              <div
                key={annotation.id}
                className={`object-box chart-box${selectedClass(annotation)}${
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
                  background:
                    annotation.chart?.background === 'transparent'
                      ? 'transparent'
                      : annotation.chart?.background ?? '#ffffff',
                  boxShadow:
                    annotation.chart?.background === 'transparent' ? 'none' : undefined,
                  ...moveStyle(annotation),
                }}
                onPointerDown={(event) => beginTapeTransform(event, annotation)}
                onDoubleClick={(event) => {
                  event.stopPropagation()
                  onEditChart(annotation)
                }}
              >
                <ChartView config={annotation.chart} compact />
                {boxHandles(isActive)}
              </div>
            )
          })}

    </>
  )
}
