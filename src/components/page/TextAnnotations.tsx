import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { Annotation, NormPoint, ReaderTool } from '../../lib/types'

interface TextAnnotationsProps {
  annotations: Annotation[]
  tool: ReaderTool
  activeObjectId: string | null
  interactive: boolean
  selectedClass: (annotation: Annotation) => string
  moveStyle: (annotation: Annotation) => CSSProperties | undefined
  objectDelta: NormPoint
  size: { width: number; height: number }
  beginObjectDrag: (event: ReactPointerEvent<Element>, annotation: Annotation) => void
  onEditText: (annotation: Annotation) => void
}

export function TextAnnotations({
  annotations,
  activeObjectId,
  interactive,
  selectedClass,
  moveStyle,
  objectDelta,
  size,
  beginObjectDrag,
  onEditText,
}: TextAnnotationsProps) {
  const texts = annotations.filter((annotation) => annotation.type === 'text')
  return (
    <>
          {texts.map((annotation) => {
            const rect = annotation.rects?.[0]
            if (!rect) return null
            return (
              <div
                key={annotation.id}
                className={`text-annotation${selectedClass(annotation)}${
                  activeObjectId === annotation.id ? ' is-object-selected' : ''
                }`}
                dir="auto"
                style={{
                  left: `${rect.x * 100}%`,
                  top: `${rect.y * 100}%`,
                  width: `${rect.w * 100}%`,
                  height: `${rect.h * 100}%`,
                  color: annotation.color,
                  fontSize: `${(annotation.fontSize ?? 0.024) * size.width}px`,
                  textAlign: annotation.textAlign ?? 'right',
                  pointerEvents: interactive ? 'auto' : 'none',
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
                onDoubleClick={(event) => {
                  event.stopPropagation()
                  onEditText(annotation)
                }}
                title={annotation.text}
              >
                {annotation.text}
              </div>
            )
          })}

    </>
  )
}
