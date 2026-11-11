import { useCallback } from 'react'
import { useToast } from '../components/Toast'
import { db, newId } from '../lib/db'
import {
  PEN_MODELS,
  type Annotation,
  type BnoteDocument,
  type ChartConfig,
  type LinkInfo,
  type NormPoint,
  type NormRect,
  type PenStyle,
  type ReaderTool,
  type TextAlign,
  type TextVerticalAlign,
  type TextStyle,
} from '../lib/types'
import { clamp, makeRectCentered, toFa } from '../lib/utils'
import { measureTextBox } from '../lib/textLayout'
import { useI18n } from '../lib/i18n'

interface ReaderActionsOptions {
  doc: BnoteDocument | undefined
  pageRef: string
  pageNumber: number
  pageCount: number
  tool: ReaderTool
  penStyle: PenStyle
  penWidthScale: number
  inkColor: string
  highlightColor: string
  tapeColor: string
  category: string
}

interface HighlightInput {
  rects: NormRect[]
  text: string
}

export interface TextValue {
  text: string
  fontSize: number
  color: string
  textAlign: TextAlign
  verticalAlign: TextVerticalAlign
  textStyle: TextStyle
  category: string
}

export interface PendingImage {
  data: string
  aspect: number
}

export function useReaderActions({
  doc,
  pageRef,
  pageNumber,
  pageCount,
  tool,
  penStyle,
  penWidthScale,
  inkColor,
  highlightColor,
  tapeColor,
  category,
}: ReaderActionsOptions) {
  const toast = useToast()
  const { t } = useI18n()

  const base = useCallback(
    (type: Annotation['type'], color: string, extra: Partial<Annotation>): Annotation | null => {
      if (!doc) return null
      const now = Date.now()
      return {
        id: newId(),
        docId: doc.id,
        pageRef,
        page: pageNumber,
        type,
        color,
        category,
        createdAt: now,
        updatedAt: now,
        ...extra,
      }
    },
    [category, doc, pageNumber, pageRef],
  )

  const updateAnnotation = useCallback(
    async (annotationId: string, patch: Partial<Annotation>) => {
      await db.annotations.update(annotationId, { ...patch, updatedAt: Date.now() })
    },
    [],
  )

  const saveHighlight = useCallback(
    async (selection: HighlightInput, chosenColor: string): Promise<Annotation | null> => {
      const annotation = base('highlight', chosenColor, {
        rects: selection.rects,
        text: selection.text,
      })
      if (!annotation) return null
      await db.annotations.add(annotation)
      toast.show(t('هایلایت ذخیره شد.', 'Highlight saved.'), { tone: 'success' })
      return annotation
    },
    [base, toast],
  )

  const addInk = useCallback(
    async (points: NormPoint[], pressures: number[]) => {
      const style: PenStyle = tool === 'marker' ? 'marker' : penStyle
      const model = PEN_MODELS.find((item) => item.id === style) ?? PEN_MODELS[0]
      const marker = style === 'marker'
      const annotation = base('ink', marker ? highlightColor : inkColor, {
        points,
        pressures,
        penStyle: style,
        strokeWidth: model.width * penWidthScale,
        opacity: model.opacity,
      })
      if (!annotation) return
      await db.annotations.add(annotation)
    },
    [base, highlightColor, inkColor, penStyle, penWidthScale, tool],
  )

  const addTape = useCallback(
    async (rect: NormRect): Promise<string | null> => {
      const annotation = base('tape', tapeColor, {
        rects: [rect],
        opacity: 0.9,
        rotation: 0,
      })
      if (!annotation) return null
      await db.annotations.add(annotation)
      return annotation.id
    },
    [base, tapeColor],
  )

  const saveText = useCallback(
    async (
      value: TextValue,
      target: { annotation?: Annotation; point?: NormPoint; pageAspect?: number },
    ) => {
      const aspect = target.pageAspect ?? 1.414
      const box = measureTextBox(value.text, value.fontSize, aspect, value.textStyle)
      if (target.annotation) {
        const current = target.annotation.rects?.[0]
        const center = current
          ? { x: current.x + current.w / 2, y: current.y + current.h / 2 }
          : null
        await updateAnnotation(target.annotation.id, {
          text: value.text,
          fontSize: value.fontSize,
          color: value.color,
          textAlign: value.textAlign,
          verticalAlign: value.verticalAlign,
          textStyle: value.textStyle,
          category: value.category,
          ...(center
            ? {
                rects: [
                  {
                    x: center.x - box.width / 2,
                    y: center.y - box.height / 2,
                    w: box.width,
                    h: box.height,
                  },
                ],
              }
            : {}),
        })
        toast.show(t('متن ویرایش شد.', 'Text updated.'), { tone: 'success' })
        return
      }
      if (!target.point) return
      const annotation = base('text', value.color, {
        text: value.text,
        fontSize: value.fontSize,
        textAlign: value.textAlign,
        verticalAlign: value.verticalAlign,
        textStyle: value.textStyle,
        category: value.category,
        rects: [
          {
            x: target.point.x - box.width / 2,
            y: target.point.y - box.height / 2,
            w: box.width,
            h: box.height,
          },
        ],
      })
      if (!annotation) return
      await db.annotations.add(annotation)
      toast.show(t('متن روی برگ قرار گرفت.', 'Text placed on the page.'), { tone: 'success' })
    },
    [base, toast, updateAnnotation],
  )

  const saveNote = useCallback(
    async (
      text: string,
      chosenCategory: string,
      target: { annotation?: Annotation; point?: NormPoint },
    ): Promise<boolean> => {
      const trimmed = text.trim()
      if (!trimmed && !target.annotation) {
        toast.show(t('متن یادداشت خالی است.', 'The note text is empty.'), { tone: 'error' })
        return false
      }
      if (target.annotation) {
        await updateAnnotation(target.annotation.id, {
          note: trimmed || undefined,
          category: chosenCategory,
        })
        toast.show(t('یادداشت ذخیره شد.', 'Note saved.'), { tone: 'success' })
        return true
      }
      if (target.point) {
        const annotation = base('note', highlightColor, {
          points: [target.point],
          note: trimmed,
          category: chosenCategory,
        })
        if (!annotation) return false
        await db.annotations.add(annotation)
        toast.show(t('یادداشت روی برگ ثبت شد.', 'Note added to the page.'), { tone: 'success' })
        return true
      }
      return false
    },
    [base, highlightColor, toast, updateAnnotation],
  )

  const deleteAnnotation = useCallback(
    async (annotation: Annotation) => {
      await db.annotations.delete(annotation.id)
      toast.show(t('نشانه حذف شد.', 'Mark deleted.'), {
        action: {
          label: t('بازگردانی', 'Undo'),
          onClick: () => {
            void db.annotations.add(annotation)
          },
        },
      })
    },
    [toast],
  )

  const moveSelected = useCallback(
    async (delta: NormPoint, selectedIds: string[], list: Annotation[]) => {
      const items = list.filter((annotation) => selectedIds.includes(annotation.id))
      if (items.length === 0) return
      const now = Date.now()
      await db.transaction('rw', db.annotations, async () => {
        for (const annotation of items) {
          const patch: Partial<Annotation> = { updatedAt: now }
          if (annotation.rects) {
            patch.rects = annotation.rects.map((rect) => ({
              ...rect,
              x: rect.x + delta.x,
              y: rect.y + delta.y,
            }))
          }
          if (annotation.points) {
            patch.points = annotation.points.map((point) => ({
              x: point.x + delta.x,
              y: point.y + delta.y,
            }))
          }
          await db.annotations.update(annotation.id, patch)
        }
      })
    },
    [],
  )

  const deleteSelected = useCallback(
    async (selectedIds: string[], list: Annotation[]) => {
      const items = list.filter((annotation) => selectedIds.includes(annotation.id))
      if (items.length === 0) return
      await db.annotations.bulkDelete(selectedIds)
      toast.show(t(`${toFa(items.length)} نشانه حذف شد.`, `${toFa(items.length)} marks deleted.`), {
        action: {
          label: t('بازگردانی', 'Undo'),
          onClick: () => {
            void db.annotations.bulkAdd(items)
          },
        },
      })
    },
    [toast],
  )

  const recolorSelected = useCallback(
    async (selectedIds: string[], list: Annotation[], color: string) => {
      const items = list.filter((annotation) => selectedIds.includes(annotation.id))
      if (items.length === 0) return
      const now = Date.now()
      await Promise.all(
        items.map((annotation) =>
          db.annotations.update(annotation.id, { color, updatedAt: now }),
        ),
      )
      toast.show(t('رنگ نشانه‌های انتخاب‌شده تغییر کرد.', 'Selected marks recolored.'), { tone: 'success' })
    },
    [toast],
  )

  const placeObject = useCallback(
    async (
      point: NormPoint,
      pageAspect: number,
      pendingImage: PendingImage | null,
      pendingChart: ChartConfig | null,
    ): Promise<Annotation | null> => {
      if (tool === 'image' && pendingImage) {
        const width = 0.46
        const height = clamp(
          (width * pendingImage.aspect) / Math.max(0.2, pageAspect),
          0.08,
          0.8,
        )
        const annotation = base('image', '#0ea5e9', {
          rects: [makeRectCentered(point, width, height)],
          image: pendingImage.data,
        })
        if (!annotation) return null
        await db.annotations.add(annotation)
        toast.show(t('تصویر روی برگ قرار گرفت.', 'Image placed on the page.'), { tone: 'success' })
        return annotation
      }
      if (tool === 'chart' && pendingChart) {
        const width = 0.56
        const height = clamp((width * 0.66) / Math.max(0.2, pageAspect), 0.1, 0.75)
        const annotation = base('chart', pendingChart.color, {
          rects: [makeRectCentered(point, width, height)],
          chart: pendingChart,
        })
        if (!annotation) return null
        await db.annotations.add(annotation)
        toast.show(t('نمودار روی برگ قرار گرفت.', 'Chart placed on the page.'), { tone: 'success' })
        return annotation
      }
      return null
    },
    [base, toast, tool],
  )

  const saveLink = useCallback(
    async (link: LinkInfo, rect: NormRect) => {
      const annotation = base('link', '#e11d48', {
        rects: [rect],
        link,
        note: link.label,
      })
      if (!annotation) return
      await db.annotations.add(annotation)
      toast.show(t('پیوند ثبت شد.', 'Link saved.'), { tone: 'success' })
    },
    [base, toast],
  )

  const togglePageRead = useCallback(
    async (key: string) => {
      if (!doc) return
      const readPages = { ...(doc.readPages ?? {}) }
      if (readPages[key]) delete readPages[key]
      else readPages[key] = true
      await db.documents.update(doc.id, { readPages })
      toast.show(
        readPages[key]
          ? t('این برگ «خوانده‌شده» علامت خورد.', 'Page marked as read.')
          : t('این برگ «خوانده‌نشده» شد.', 'Page marked as unread.'),
        { tone: 'success' },
      )
    },
    [doc, toast],
  )

  const toggleBookmark = useCallback(
    async (key: string) => {
      if (!doc) return
      const next = doc.bookmarkKey === key ? undefined : key
      await db.documents.update(doc.id, { bookmarkKey: next })
      toast.show(
        next ? t('این برگ نشانک شد.', 'Page bookmarked.') : t('نشانک برداشته شد.', 'Bookmark removed.'),
        { tone: 'success' },
      )
    },
    [doc, toast],
  )

  const rotateTape = useCallback(
    async (annotation: Annotation, delta: number) => {
      const rotation = (annotation.rotation ?? 0) + delta
      await updateAnnotation(annotation.id, {
        rotation: (((rotation + 180) % 360) + 360) % 360 - 180,
      })
    },
    [updateAnnotation],
  )

  return {
    pageCount,
    saveHighlight,
    addInk,
    addTape,
    saveText,
    saveNote,
    deleteAnnotation,
    updateAnnotation,
    moveSelected,
    deleteSelected,
    recolorSelected,
    placeObject,
    saveLink,
    togglePageRead,
    toggleBookmark,
    rotateTape,
  }
}
