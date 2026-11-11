import { Link2, StickyNote } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { Annotation, NormPoint, NormRect } from '../../lib/types'
import { linkLabel } from '../../lib/utils'
import { translate } from '../../lib/lang'

interface LinkNoteLayerProps {
  annotations: Annotation[]
  interactive: boolean
  activeObjectId: string | null
  selectedClass: (annotation: Annotation) => string
  moveStyle: (annotation: Annotation) => CSSProperties | undefined
  selectedIds: string[]
  moveDelta: NormPoint
  size: { width: number; height: number }
  onOpenLink: (annotation: Annotation) => void
  onOpenAnnotation: (annotation: Annotation) => void
  linkDraft: NormRect | null
  tapeDraft: NormRect | null
  tapeColor: string
  shapeDraft: NormRect | null
  lassoPath: NormPoint[]
}

export function LinkNoteLayer({
  annotations,
  interactive,
  activeObjectId,
  selectedClass,
  moveStyle,
  selectedIds,
  moveDelta,
  size,
  onOpenLink,
  onOpenAnnotation,
  linkDraft,
  tapeDraft,
  tapeColor,
  shapeDraft,
  lassoPath,
}: LinkNoteLayerProps) {
  const links = annotations.filter((annotation) => annotation.type === 'link')
  const notes = annotations.filter((annotation) => annotation.type === 'note')
  const selectedSet = new Set(selectedIds)
  return (
    <>
          {links.map((annotation) => {
            const rect = annotation.rects?.[0]
            if (!rect) return null
            return (
              <button
                key={annotation.id}
                type="button"
                className={`link-hotspot${selectedClass(annotation)}${
                  activeObjectId === annotation.id ? ' is-object-selected' : ''
                }`}
                style={{
                  left: `${rect.x * 100}%`,
                  top: `${rect.y * 100}%`,
                  width: `${rect.w * 100}%`,
                  height: `${rect.h * 100}%`,
                  pointerEvents: interactive ? 'auto' : 'none',
                  ...moveStyle(annotation),
                }}
                onClick={(event) => {
                  event.stopPropagation()
                  onOpenLink(annotation)
                }}
                title={linkLabel(annotation)}
              >
                <Link2 size={12} />
                <span>{annotation.link?.label || linkLabel(annotation)}</span>
              </button>
            )
          })}

          {notes.map((annotation) => {
            const point = annotation.points?.[0]
            if (!point) return null
            return (
              <button
                key={annotation.id}
                type="button"
                className={`note-pin${selectedClass(annotation)}${
                  activeObjectId === annotation.id ? ' is-object-selected' : ''
                }`}
                style={{
                  left: `${point.x * 100}%`,
                  top: `${point.y * 100}%`,
                  background: annotation.color,
                  transform:
                    selectedSet.has(annotation.id) && (moveDelta.x || moveDelta.y)
                      ? `translate(-50%, -50%) translate(${moveDelta.x * size.width}px, ${
                          moveDelta.y * size.height
                        }px)`
                      : undefined,
                }}
                title={annotation.note || translate('یادداشت', 'Note')}
                onClick={(event) => {
                  event.stopPropagation()
                  onOpenAnnotation(annotation)
                }}
              >
                <StickyNote size={13} />
              </button>
            )
          })}

          {linkDraft && (
            <span
              className="link-draft"
              style={{
                left: `${linkDraft.x * 100}%`,
                top: `${linkDraft.y * 100}%`,
                width: `${linkDraft.w * 100}%`,
                height: `${linkDraft.h * 100}%`,
              }}
            />
          )}

          {tapeDraft && (
            <span
              className="tape-annotation tape-annotation--draft"
              style={{
                left: `${tapeDraft.x * 100}%`,
                top: `${tapeDraft.y * 100}%`,
                width: `${tapeDraft.w * 100}%`,
                height: `${tapeDraft.h * 100}%`,
                background: tapeColor,
              }}
            />
          )}

          {shapeDraft && (
            <span
              className="shape-draft"
              style={{
                left: `${shapeDraft.x * 100}%`,
                top: `${shapeDraft.y * 100}%`,
                width: `${shapeDraft.w * 100}%`,
                height: `${shapeDraft.h * 100}%`,
              }}
            />
          )}

          {lassoPath.length > 1 && (
            <svg
              className="lasso-layer"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polyline
                points={lassoPath.map((point) => `${point.x * 100},${point.y * 100}`).join(' ')}
                fill="rgba(225, 29, 72, 0.08)"
                stroke="#e11d48"
                strokeWidth="0.35"
                strokeDasharray="1.4 0.9"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          )}
    </>
  )
}
