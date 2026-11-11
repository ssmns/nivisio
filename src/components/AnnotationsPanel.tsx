import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  BarChart3,
  Bandage,
  GripVertical,
  Highlighter,
  Image as ImageIcon,
  Link2,
  MapPin,
  Pencil,
  PenLine,
  Shapes,
  SlidersHorizontal,
  StickyNote,
  Trash2,
  Type,
  Ruler,
} from 'lucide-react'
import type { Annotation, AnnotationType, LogicalPage } from '../lib/types'
import {
  HIGHLIGHT_COLORS,
  INK_COLORS,
  TAPE_COLORS,
} from '../lib/types'
import { useI18n } from '../lib/i18n'
import {
  annotationLabel,
  categoryLabel,
  chartLabel,
  linkLabel,
  penLabel,
  toFa,
  truncate,
} from '../lib/utils'

interface AnnotationsPanelProps {
  annotations: Annotation[]
  pages: LogicalPage[]
  currentPageKey: string
  selectedId: string | null
  onSelect: (annotation: Annotation) => void
  onEdit: (annotation: Annotation) => void
  onDelete: (annotation: Annotation) => void
  onUpdate: (id: string, patch: Partial<Annotation>) => void
  onReorder: (pageRef: string, ids: string[]) => void
}

const TYPE_FILTERS: { id: AnnotationType | 'all'; label: string; en: string }[] = [
  { id: 'all', label: 'همه انواع', en: 'All types' },
  { id: 'highlight', label: 'هایلایت', en: 'Highlight' },
  { id: 'ink', label: 'قلم و ماژیک', en: 'Pen & marker' },
  { id: 'note', label: 'یادداشت', en: 'Note' },
  { id: 'image', label: 'تصویر', en: 'Image' },
  { id: 'chart', label: 'نمودار', en: 'Chart' },
  { id: 'link', label: 'پیوند', en: 'Link' },
  { id: 'tape', label: 'نوار چسب', en: 'Tape' },
  { id: 'text', label: 'متن', en: 'Text' },
  { id: 'shape', label: 'شکل', en: 'Shape' },
  { id: 'guide', label: 'ابزار اندازه', en: 'Guide' },
]

const iconFor = (type: AnnotationType) => {
  if (type === 'highlight') return Highlighter
  if (type === 'ink') return PenLine
  if (type === 'image') return ImageIcon
  if (type === 'chart') return BarChart3
  if (type === 'link') return Link2
  if (type === 'tape') return Bandage
  if (type === 'text') return Type
  if (type === 'shape') return Shapes
  if (type === 'guide') return Ruler
  return StickyNote
}

function paletteFor(type: AnnotationType) {
  if (type === 'tape') return TAPE_COLORS
  if (type === 'highlight') return HIGHLIGHT_COLORS
  return INK_COLORS
}

export function AnnotationsPanel({
  annotations,
  pages,
  currentPageKey,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onUpdate,
  onReorder,
}: AnnotationsPanelProps) {
  const { isRtl, lang, t } = useI18n()
  const [typeFilter, setTypeFilter] = useState<AnnotationType | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const pointerDragRef = useRef<{ id: string; pointerId: number } | null>(null)
  const pointerMovedRef = useRef(false)

  const pageOrder = useMemo(() => {
    const map = new Map<string, number>()
    pages.forEach((page, index) => map.set(page.key, index))
    return map
  }, [pages])

  const categories = useMemo(
    () => Array.from(new Set(annotations.map((item) => item.category ?? 'عمومی'))),
    [annotations],
  )

  const filtered = useMemo(() => {
    return annotations
      .filter((annotation) => {
        if (typeFilter !== 'all' && annotation.type !== typeFilter) return false
        if (categoryFilter !== 'all' && (annotation.category ?? 'عمومی') !== categoryFilter) {
          return false
        }
        return true
      })
      .sort(
        (a, b) =>
          (pageOrder.get(a.pageRef) ?? 9999) - (pageOrder.get(b.pageRef) ?? 9999) ||
          (a.sortIndex ?? Number.MAX_SAFE_INTEGER) -
            (b.sortIndex ?? Number.MAX_SAFE_INTEGER) ||
          a.createdAt - b.createdAt,
      )
  }, [annotations, typeFilter, categoryFilter, pageOrder])

  const selected = annotations.find((annotation) => annotation.id === selectedId) ?? null
  const withNotes = annotations.filter((annotation) => annotation.note).length

  if (annotations.length === 0) {
    return (
      <div className="panel-empty">
        <div className="panel-empty__icon">
          <Highlighter size={26} />
        </div>
        <h3>{t('هنوز نشانه‌ای ندارید', 'No marks yet')}</h3>
        <p>
          {t(
            'متن را هایلایت کنید، با ماژیک یا قلم بنویسید، تصویر و نمودار بگذارید یا به صفحه‌ای پیوند بدهید.',
            'Highlight text, write with a pen or marker, add images/charts or link to a page.',
          )}
        </p>
      </div>
    )
  }

  const pageLabelFor = (annotation: Annotation) => {
    const pageIndex = pageOrder.get(annotation.pageRef) ?? -1
    if (pageIndex < 0) return t('برگ نامشخص', 'Unknown page')
    const page = pages[pageIndex]
    return page?.kind === 'pdf'
      ? `PDF ${toFa(page.pdfPage ?? 1)}`
      : `${t('یادداشت', 'Note')} ${toFa(
          pages.slice(0, pageIndex + 1).filter((item) => item.kind === 'note').length,
        )}`
  }

  const excerptFor = (annotation: Annotation) =>
    annotation.note ||
    annotation.text ||
    (annotation.type === 'chart'
      ? chartLabel(annotation.chart)
      : annotation.type === 'link'
        ? linkLabel(annotation)
        : annotation.type === 'ink'
          ? `${penLabel(annotation.penStyle)} — ${t('خط آزاد', 'freehand stroke')}`
          : annotation.type === 'tape'
            ? t('نوار چسب روی محتوا', 'Tape covering content')
            : annotationLabel(annotation))

  const reorderTo = (sourceId: string, target: Annotation) => {
    const source = annotations.find((item) => item.id === sourceId)
    if (!source || sourceId === target.id || source.pageRef !== target.pageRef) return false
    const pageIds = filtered
      .filter((item) => item.pageRef === target.pageRef)
      .map((item) => item.id)
      .filter((id) => id !== sourceId)
    const targetIndex = pageIds.indexOf(target.id)
    pageIds.splice(targetIndex < 0 ? pageIds.length : targetIndex, 0, sourceId)
    onReorder(target.pageRef, pageIds)
    return true
  }

  const dropOn = (target: Annotation) => {
    if (!draggingId) return
    reorderTo(draggingId, target)
    setDraggingId(null)
    setDragOverId(null)
  }

  const commitPointerReorder = (clientX: number, clientY: number) => {
    const drag = pointerDragRef.current
    if (!drag) return
    pointerDragRef.current = null
    const targetElement = document
      .elementFromPoint(clientX, clientY)
      ?.closest('[data-annotation-id]') as HTMLElement | null
    const targetId = targetElement?.dataset.annotationId
    const target = annotations.find((item) => item.id === targetId)
    if (target) reorderTo(drag.id, target)
    setDraggingId(null)
    setDragOverId(null)
  }

  const beginPointerReorder = (
    event: ReactPointerEvent<HTMLElement>,
    annotation: Annotation,
  ) => {
    if (event.pointerType === 'mouse') return
    const rect = event.currentTarget.getBoundingClientRect()
    const nearGrip = isRtl
      ? event.clientX >= rect.right - 34
      : event.clientX <= rect.left + 34
    if (!nearGrip) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    pointerDragRef.current = { id: annotation.id, pointerId: event.pointerId }
    pointerMovedRef.current = false
    setDraggingId(annotation.id)
    setDragOverId(null)

    const cleanup = () => {
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchCancel)
    }
    const onTouchEnd = (touchEvent: TouchEvent) => {
      cleanup()
      const touch = touchEvent.changedTouches[0]
      if (touch) commitPointerReorder(touch.clientX, touch.clientY)
    }
    const onTouchCancel = () => {
      cleanup()
      commitPointerReorder(0, 0)
    }
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchCancel, { passive: true })
  }

  const movePointerReorder = (event: ReactPointerEvent<HTMLElement>) => {
    if (!pointerDragRef.current) return
    pointerMovedRef.current = true
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest('[data-annotation-id]') as HTMLElement | null
    const id = target?.dataset.annotationId
    setDragOverId(id && id !== pointerDragRef.current.id ? id : null)
  }

  const finishPointerReorder = (event: ReactPointerEvent<HTMLElement>) => {
    commitPointerReorder(event.clientX, event.clientY)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const cancelPointerReorder = () => {
    pointerDragRef.current = null
    setDraggingId(null)
    setDragOverId(null)
  }

  return (
    <div className="annotations-panel">
      <div className="annotations-summary">
        <span>
          {toFa(annotations.length)} {t('نشانه', 'marks')}
        </span>
        <span>
          {toFa(withNotes)} {t('یادداشت', 'notes')}
        </span>
        <span>
          {toFa(new Set(annotations.map((item) => item.pageRef)).size)} {t('برگ', 'pages')}
        </span>
      </div>

      <div className="annotation-filters">
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as AnnotationType | 'all')}
          aria-label={t('نوع نشانه', 'Mark type')}
        >
          {TYPE_FILTERS.map((item) => (
            <option key={item.id} value={item.id}>
              {t(item.label, item.en)}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label={t('دسته مطالعاتی', 'Study category')}
        >
          <option value="all">{t('همه دسته‌ها', 'All categories')}</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {categoryLabel(category)}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="annotation-inspector">
          <div className="annotation-inspector__head">
            <span className="annotation-type">
              {(() => {
                const Icon = iconFor(selected.type)
                return <Icon size={14} />
              })()}
              {annotationLabel(selected)}
            </span>
            <span className="annotation-page">{pageLabelFor(selected)}</span>
            <button
              type="button"
              className="icon-btn icon-btn--xs"
              onClick={() => onSelect(selected)}
              title={t('رفتن به این نشانه', 'Go to this mark')}
            >
              <MapPin size={13} />
            </button>
            <button
              type="button"
              className="icon-btn icon-btn--xs"
              onClick={() => onDelete(selected)}
              title={t('حذف', 'Delete')}
            >
              <Trash2 size={13} />
            </button>
          </div>

          <div className="annotation-inspector__row">
            <div className="annotation-inspector__colors">
              {paletteFor(selected.type).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`color-dot color-dot--xs${
                    selected.color === item.value ? ' is-active' : ''
                  }`}
                  style={{ background: item.value }}
                  onClick={() => {
                    if (selected.type === 'chart' && selected.chart) {
                      onUpdate(selected.id, {
                        color: item.value,
                        chart: { ...selected.chart, color: item.value },
                      })
                    } else {
                      onUpdate(selected.id, { color: item.value })
                    }
                  }}
                  title={lang === 'en' ? item.nameEn : item.name}
                />
              ))}
            </div>
            <label className="annotation-inspector__field">
              <span>{t('دسته', 'Category')}</span>
              <select
                value={selected.category ?? 'عمومی'}
                onChange={(event) => onUpdate(selected.id, { category: event.target.value })}
              >
                {Array.from(new Set(['عمومی', 'مهم', 'مرور', 'سؤال', 'ایده'])).map((category) => (
                  <option key={category} value={category}>
                    {categoryLabel(category)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selected.type === 'ink' && (
            <label className="annotation-inspector__range">
              <span>
                <SlidersHorizontal size={12} /> {t('ضخامت', 'Thickness')}
              </span>
              <input
                type="range"
                min="0.0008"
                max="0.02"
                step="0.0004"
                value={selected.strokeWidth ?? 0.0026}
                onChange={(event) =>
                  onUpdate(selected.id, { strokeWidth: Number(event.target.value) })
                }
              />
            </label>
          )}
          {selected.type === 'shape' && (
            <label className="annotation-inspector__range">
              <span>
                <SlidersHorizontal size={12} /> {t('ضخامت', 'Thickness')}
              </span>
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.1"
                value={selected.shape?.strokeWidth ?? 1}
                onChange={(event) =>
                  onUpdate(selected.id, {
                    shape: {
                      ...(selected.shape ?? { kind: 'line' }),
                      strokeWidth: Number(event.target.value),
                    },
                  })
                }
              />
            </label>
          )}

          {(selected.type === 'highlight' ||
            selected.type === 'ink' ||
            selected.type === 'tape') && (
            <label className="annotation-inspector__range">
              <span>{t('شفافیت', 'Opacity')}</span>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={Math.round((selected.opacity ?? 1) * 100)}
                onChange={(event) =>
                  onUpdate(selected.id, { opacity: Number(event.target.value) / 100 })
                }
              />
            </label>
          )}

          {(selected.type === 'tape' ||
            selected.type === 'shape' ||
            selected.type === 'image' ||
            selected.type === 'chart' ||
            selected.type === 'guide') && (
            <label className="annotation-inspector__range">
              <span>{t('چرخش', 'Rotation')}</span>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={Math.round(selected.rotation ?? 0)}
                onChange={(event) =>
                  onUpdate(selected.id, { rotation: Number(event.target.value) })
                }
              />
            </label>
          )}

          {selected.type !== 'ink' && (
            <button type="button" className="annotation-inspector__edit" onClick={() => onEdit(selected)}>
              <Pencil size={13} />
              {selected.type === 'text'
                ? t('ویرایش متن', 'Edit text')
                : t('ویرایش یادداشت / دسته', 'Edit note / category')}
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="panel-empty panel-empty--small">
          <p>{t('با این فیلترها نشانه‌ای پیدا نشد.', 'No marks match these filters.')}</p>
        </div>
      ) : (
        <div className="annotation-list">
          {filtered.map((annotation) => {
            const Icon = iconFor(annotation.type)
            const pageLabel = pageLabelFor(annotation)
            const excerpt = excerptFor(annotation)
            return (
              <article
                key={annotation.id}
                data-annotation-id={annotation.id}
                className={`annotation-item${
                  annotation.pageRef === currentPageKey ? ' is-current' : ''
                }${annotation.id === selectedId ? ' is-selected' : ''}${
                  dragOverId === annotation.id ? ' is-drag-over' : ''
                }${draggingId === annotation.id ? ' is-dragging' : ''}`}
                draggable
                onDragStart={() => setDraggingId(annotation.id)}
                onDragEnd={() => {
                  setDraggingId(null)
                  setDragOverId(null)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragOverId(annotation.id)
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  dropOn(annotation)
                }}
                onPointerDown={(event) => beginPointerReorder(event, annotation)}
                onPointerMove={movePointerReorder}
                onPointerUp={finishPointerReorder}
                onPointerCancel={cancelPointerReorder}
                onClickCapture={(event) => {
                  if (!pointerMovedRef.current) return
                  pointerMovedRef.current = false
                  event.preventDefault()
                  event.stopPropagation()
                }}
              >
                <button
                  type="button"
                  className="annotation-item__drag"
                  title={t('جابه‌جایی', 'Reorder')}
                  aria-label={t('جابه‌جایی', 'Reorder')}
                >
                  <GripVertical size={13} />
                </button>
                <button
                  type="button"
                  className="annotation-item__main"
                  onClick={() => onSelect(annotation)}
                  title={t(`رفتن به ${pageLabel}`, `Go to ${pageLabel}`)}
                >
                  <span className="annotation-item__top">
                    <span className="annotation-type">
                      <Icon size={12} />
                      {annotationLabel(annotation)}
                    </span>
                    <span className="annotation-category">
                      {categoryLabel(annotation.category)}
                    </span>
                    <span className="annotation-page">
                      <MapPin size={10} />
                      {pageLabel}
                    </span>
                  </span>
                  <span className="annotation-item__text">{truncate(excerpt, 95)}</span>
                </button>
                <div className="annotation-item__tools">
                  <span className="annotation-dot" style={{ background: annotation.color }} />
                  {annotation.type !== 'ink' && (
                    <button
                      type="button"
                      className="icon-btn icon-btn--xs"
                      title={
                        annotation.type === 'text'
                          ? t('ویرایش متن', 'Edit text')
                          : t('ویرایش یادداشت / دسته', 'Edit note / category')
                      }
                      onClick={() => onEdit(annotation)}
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn icon-btn--xs icon-btn--danger"
                    title={t('حذف نشانه', 'Delete mark')}
                    onClick={() => onDelete(annotation)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
