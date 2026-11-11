import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import type { Annotation, ReaderTool } from '../../lib/types'
import { translate } from '../../lib/lang'

interface BoxGeometry {
  x: number
  y: number
  w: number
  h: number
  rotation: number
}

interface TapeLayerProps {
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
}

export function TapeLayer({
  annotations,
  tool,
  activeObjectId,
  selectedClass,
  moveStyle,
  tapeGeometryFor,
  boxHandles,
  beginTapeTransform,
}: TapeLayerProps) {
  const tapes = annotations.filter((annotation) => annotation.type === 'tape')
  return (
    <>
          {tapes.map((annotation) => {
            const geometry = tapeGeometryFor(annotation)
            const isActive = tool === 'select' && activeObjectId === annotation.id
            const canTransform = tool === 'select'
            return (
              <div
                key={annotation.id}
                className={`tape-annotation${selectedClass(annotation)}${
                  isActive ? ' is-active' : ''
                }`}
                style={{
                  left: `${geometry.x * 100}%`,
                  top: `${geometry.y * 100}%`,
                  width: `${geometry.w * 100}%`,
                  height: `${geometry.h * 100}%`,
                  transform: `rotate(${geometry.rotation}deg)`,
                  pointerEvents: canTransform ? 'auto' : 'none',
                  cursor: isActive ? 'move' : 'pointer',
                  zIndex: isActive ? 8 : undefined,
                  ...moveStyle(annotation),
                }}
                onPointerDown={(event) => beginTapeTransform(event, annotation)}
                title={translate('نوار چسب — برای ویرایش بکشید', 'Tape — drag to edit')}
              >
                <span
                  className="tape-surface"
                  style={{
                    background: annotation.color,
                    opacity: annotation.opacity ?? 0.9,
                  }}
                />
                {boxHandles(isActive)}
              </div>
            )
          })}

    </>
  )
}
