import type { CSSProperties, ReactNode, PointerEvent as ReactPointerEvent } from 'react'
import type { Annotation, ReaderTool } from '../../lib/types'

interface BoxGeometry {
  x: number
  y: number
  w: number
  h: number
  rotation: number
}

interface TextAnnotationsProps {
  annotations: Annotation[]
  visible: boolean
  tool: ReaderTool
  activeObjectId: string | null
  selectedClass: (annotation: Annotation) => string
  size: { width: number; height: number }
  tapeGeometryFor: (annotation: Annotation) => BoxGeometry
  boxHandles: (active: boolean) => ReactNode
  beginTapeTransform: (
    event: ReactPointerEvent<HTMLDivElement>,
    annotation: Annotation,
  ) => void
  onEditText: (annotation: Annotation, pageAspect: number) => void
}

export function TextAnnotations({
  annotations,
  visible,
  tool,
  activeObjectId,
  selectedClass,
  size,
  tapeGeometryFor,
  boxHandles,
  beginTapeTransform,
  onEditText,
}: TextAnnotationsProps) {
  const texts = annotations.filter((annotation) => annotation.type === 'text')
  if (!visible) return null
  return (
    <>
      {texts.map((annotation) => {
        const geometry = tapeGeometryFor(annotation)
        const isActive = tool === 'select' && activeObjectId === annotation.id
        return (
          <div
            key={annotation.id}
            className={`object-box text-annotation${selectedClass(annotation)}${
              isActive ? ' is-object-selected' : ''
            }`}
            dir="auto"
            style={
              {
                left: `${geometry.x * 100}%`,
                top: `${geometry.y * 100}%`,
                width: `${geometry.w * 100}%`,
                height: `${geometry.h * 100}%`,
                transform: `rotate(${geometry.rotation}deg)`,
                color: annotation.color,
                fontWeight: annotation.textStyle?.includes('bold') ? 700 : 500,
                fontStyle: annotation.textStyle?.includes('italic') ? 'italic' : 'normal',
                fontSize: `${(annotation.fontSize ?? 0.024) * size.width}px`,
                textAlign: annotation.textAlign ?? 'right',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent:
                  annotation.verticalAlign === 'middle'
                    ? 'center'
                    : annotation.verticalAlign === 'bottom'
                      ? 'flex-end'
                      : 'flex-start',
                pointerEvents: tool === 'select' ? 'auto' : 'none',
                cursor: tool === 'select' ? 'move' : undefined,
                zIndex: isActive ? 9 : undefined,
              } as CSSProperties
            }
            onPointerDown={(event) => beginTapeTransform(event, annotation)}
            onDoubleClick={(event) => {
              event.stopPropagation()
              onEditText(annotation, size.height / Math.max(1, size.width))
            }}
            title={annotation.text}
          >
            {annotation.text}
            {boxHandles(isActive)}
          </div>
        )
      })}
    </>
  )
}
