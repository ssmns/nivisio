import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { db, deleteNotebookPageCascade, newId, notePageKey, pdfPageKey } from '../lib/db'
import { usePdfDocument } from '../hooks/usePdfDocument'
import { useReaderActions } from '../hooks/useReaderActions'
import { useReaderPreferences } from '../hooks/useReaderPreferences'
import { useReaderZoomGestures } from '../hooks/useReaderZoomGestures'
import { useReaderKeyboard } from '../hooks/useReaderKeyboard'
import { useReaderExport } from '../hooks/useReaderExport'
import { useI18n } from '../lib/i18n'
import {
  GRID_TYPES,
  HIGHLIGHT_COLORS,
  INK_COLORS,
  TAPE_COLORS,
  type Annotation,
  type ChartConfig,
  type GridType,
  type LinkInfo,
  type NormPoint,
  type NormRect,
  type NotebookPage,
  type PenStyle,
  type ReaderTool,
  type ShapeConfig,
  type GuideKind,
  type TextAlign,
  type TextVerticalAlign,
  type TextStyle,
  type FitMode,
} from '../lib/types'
import {
  buildLogicalPages,
  clamp,
  documentPageSize,
  documentPageSizeLabel,
  findPageIndex,
  imageFileToDataUrl,
  isSafeExternalUrl,
  pageDisplayLabel,
} from '../lib/utils'
import { ReaderHeader } from '../components/reader/ReaderHeader'
import { ReaderToolbar } from '../components/reader/ReaderToolbar'
import { PageDock } from '../components/reader/PageDock'
import { PageSlot, type PageSurfaceProps } from '../components/reader/PageSlot'
import { ReaderBars } from '../components/reader/ReaderBars'
import { ReaderModals } from '../components/reader/ReaderModals'
import { ReaderPanel } from '../components/reader/ReaderPanel'
import { ReaderState } from '../components/reader/ReaderState'
import { SelectionPopover } from '../components/reader/SelectionPopover'
import type {
  NoteTarget,
  PageTemplateState,
  SelectedText,
  TextTarget,
} from '../components/reader/readerTypes'
import { useToast } from '../components/Toast'

export function ReaderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const { isRtl, lang, t } = useI18n()

  const doc = useLiveQuery(() => (id ? db.documents.get(id) : undefined), [id])
  const docs = useLiveQuery(() => db.documents.toArray(), []) ?? []
  const collections = useLiveQuery(() => db.collections.toArray(), []) ?? []
  const annotations = useLiveQuery(
    () => (id ? db.annotations.where('docId').equals(id).toArray() : []),
    [id],
  ) ?? []
  const notebookPages = useLiveQuery(
    () => (id ? db.notebookPages.where('docId').equals(id).toArray() : []),
    [id],
  ) ?? []
  const { pdf, loading, error } = usePdfDocument(
    doc?.kind === 'note' ? undefined : doc?.id,
    doc?.kind !== 'note',
  )

  const pages = useMemo(
    () =>
      buildLogicalPages(
        doc?.kind === 'note' ? 0 : doc?.pageCount ?? 1,
        notebookPages,
        doc?.kind ?? 'pdf',
      ),
    [doc?.kind, doc?.pageCount, notebookPages],
  )

  const { exporting, exportPdf, downloadOriginal } = useReaderExport(
    doc,
    pdf,
    pages,
    annotations,
  )

  const [pageIndex, setPageIndex] = useState(0)
  const [pageInput, setPageInput] = useState('1')
  const [zoom, setZoom] = useState(1)
  const [tool, setTool] = useState<ReaderTool>('select')
  const [penStyle, setPenStyle] = useState<PenStyle>('pen')
  const [penWidthScale, setPenWidthScale] = useState(1)
  const [inkColor, setInkColor] = useState<string>(INK_COLORS[0].value)
  const [highlightColor, setHighlightColor] = useState<string>(HIGHLIGHT_COLORS[0].value)
  const [tapeColor, setTapeColor] = useState<string>(TAPE_COLORS[1].value)
  const [category, setCategory] = useState('عمومی')
  const [selection, setSelection] = useState<SelectedText | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeObjectId, setActiveObjectId] = useState<string | null>(null)
  const [noteTarget, setNoteTarget] = useState<NoteTarget | null>(null)
  const [textTarget, setTextTarget] = useState<TextTarget | null>(null)
  const [pageTemplate, setPageTemplate] = useState<PageTemplateState | null>(null)
  const [linkRect, setLinkRect] = useState<NormRect | null>(null)
  const [chartOpen, setChartOpen] = useState(false)
  const [chartTarget, setChartTarget] = useState<Annotation | null>(null)
  const [shapeOpen, setShapeOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [pendingShape, setPendingShape] = useState<ShapeConfig | null>(null)
  const [pendingGuide, setPendingGuide] = useState<GuideKind | null>(null)
  const [pendingChart, setPendingChart] = useState<ChartConfig | null>(null)
  const [pendingImage, setPendingImage] = useState<{ data: string; aspect: number } | null>(null)
  const [panelOpen, setPanelOpen] = useState(() => window.innerWidth >= 1080)
  const [panelTab, setPanelTab] = useState<'notes' | 'info' | 'assets'>('notes')
  const [focusKey, setFocusKey] = useState<string | null>(null)
  const {
    viewMode,
    setViewMode,
    fitMode,
    setFitMode,
    readingTheme,
    setReadingTheme,
    snapEnabled,
    setSnapEnabled,
    showText,
    setShowText,
    showLabels,
    setShowLabels,
  } = useReaderPreferences()
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })

  const stageRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const imageInputRef = useRef<HTMLInputElement>(null)
  const initRef = useRef<string | null>(null)
  const openedRef = useRef<string | null>(null)
  const queryRef = useRef<string | null>(null)

  const currentIndex = Math.min(pageIndex, Math.max(0, pages.length - 1))
  const currentPage = pages[currentIndex]
  const currentKey = currentPage?.key ?? ''
  const notebookSize = useMemo(
    () => (doc ? documentPageSize(doc) : { width: 595, height: 842 }),
    [doc?.pageWidth, doc?.pageHeight, doc?.pageSize],
  )
  const activeObject =
    annotations.find((annotation) => annotation.id === activeObjectId) ?? null
  const activeTape = activeObject?.type === 'tape' ? activeObject : null

  useEffect(() => {
    if (!doc) return
    if (initRef.current === doc.id) return
    initRef.current = doc.id
    const target = findPageIndex(pages, doc.lastKey ?? pdfPageKey(doc.lastPage || 1))
    setPageIndex(target)
  }, [doc, pages])

  useEffect(() => {
    if (!doc || pages.length === 0 || queryRef.current === doc.id) return
    queryRef.current = doc.id
    const requested = Number(searchParams.get('pdfPage'))
    if (requested > 0) {
      const index = pages.findIndex(
        (page) => page.kind === 'pdf' && page.pdfPage === requested,
      )
      if (index >= 0) setPageIndex(index)
    }
  }, [doc, pages, searchParams])

  useEffect(() => {
    if (!focusKey) return
    const index = pages.findIndex((page) => page.key === focusKey)
    if (index >= 0) {
      setPageIndex(index)
      setFocusKey(null)
    }
  }, [focusKey, pages])

  useEffect(() => {
    if (pageIndex > pages.length - 1) setPageIndex(Math.max(0, pages.length - 1))
  }, [pageIndex, pages.length])

  useEffect(() => {
    if (!doc || openedRef.current === doc.id) return
    openedRef.current = doc.id
    void (async () => {
      const fresh = await db.documents.get(doc.id)
      if (!fresh) return
      await db.documents.update(doc.id, {
        openedCount: fresh.openedCount + 1,
        lastReadAt: Date.now(),
        status: fresh.status === 'unread' ? 'reading' : fresh.status,
      })
    })()
  }, [doc])

  useEffect(() => {
    setPageInput(String(currentIndex + 1))
    setSelection(null)
    setSelectedIds([])
    setActiveObjectId(null)
    window.getSelection()?.removeAllRanges()
  }, [currentIndex])

  useEffect(() => {
    if (!doc || !currentPage) return
    const timer = window.setTimeout(() => {
      void (async () => {
        const fresh = await db.documents.get(doc.id)
        if (!fresh) return
        const total = Math.max(1, pages.length)
        const furthest = Math.max(fresh.progress * total, currentIndex + 1)
        const progress = Math.min(1, furthest / total)
        const status = progress >= 0.999 ? 'done' : fresh.status === 'done' ? 'done' : 'reading'
        const lastPdfPage =
          currentPage.kind === 'pdf'
            ? currentPage.pdfPage ?? 1
            : [...pages.slice(0, currentIndex + 1)]
                .reverse()
                .find((page) => page.kind === 'pdf')?.pdfPage ?? 1
        if (
          fresh.lastKey === currentKey &&
          Math.abs(fresh.progress - progress) < 0.0005 &&
          fresh.status === status
        ) {
          return
        }
        await db.documents.update(doc.id, {
          lastKey: currentKey,
          lastPage: lastPdfPage,
          progress,
          status,
          lastReadAt: Date.now(),
        })
      })()
    }, 350)
    return () => window.clearTimeout(timer)
  }, [doc?.id, currentIndex, currentKey, currentPage, pages])

  useEffect(() => {
    let frame = 0
    let observer: ResizeObserver | null = null
    const attach = () => {
      const stage = stageRef.current
      if (!stage) {
        frame = window.requestAnimationFrame(attach)
        return
      }
      const update = () => {
        const style = window.getComputedStyle(stage)
        const paddingTop = Number.parseFloat(style.paddingTop) || 0
        const paddingBottom = Number.parseFloat(style.paddingBottom) || 0
        setStageSize({
          width: stage.clientWidth,
          height: Math.max(0, stage.clientHeight - paddingTop - paddingBottom),
        })
      }
      update()
      observer = new ResizeObserver(update)
      observer.observe(stage)
    }
    attach()
    return () => {
      window.cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [doc?.id])

  useEffect(() => {
    if (viewMode !== 'continuous') return
    const root = stageRef.current
    if (!root) return
    let frame = 0
    const update = () => {
      frame = 0
      const stageBox = root.getBoundingClientRect()
      if (stageBox.height === 0) return
      const focus = stageBox.top + Math.min(220, stageBox.height * 0.3)
      let containing = -1
      let containingDistance = Number.POSITIVE_INFINITY
      let nearest = -1
      let nearestDistance = Number.POSITIVE_INFINITY
      pages.forEach((page, index) => {
        const element = pageRefs.current.get(page.key)
        if (!element) return
        const box = element.getBoundingClientRect()
        const distanceToTop = Math.abs(box.top - stageBox.top)
        if (distanceToTop < nearestDistance) {
          nearestDistance = distanceToTop
          nearest = index
        }
        if (box.top <= focus && box.bottom > focus) {
          const distance = Math.abs(box.top - focus)
          if (distance < containingDistance) {
            containingDistance = distance
            containing = index
          }
        }
      })
      const next = containing >= 0 ? containing : nearest
      if (next >= 0) setPageIndex((previous) => (previous === next ? previous : next))
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      root.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [viewMode, pages])

  useEffect(() => {
    if (viewMode !== 'continuous') return
    const key = pages[currentIndex]?.key
    if (!key) return
    const timer = window.setTimeout(() => {
      pageRefs.current.get(key)?.scrollIntoView({ block: 'start' })
    }, 90)
    return () => window.clearTimeout(timer)
    // Only align when switching into continuous mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode])

  useEffect(() => {
    if (!selection) return
    const hide = () => setSelection(null)
    window.addEventListener('scroll', hide, true)
    return () => window.removeEventListener('scroll', hide, true)
  }, [selection])

  const pageStep = viewMode === 'spread' ? 2 : 1

  const goToIndex = useCallback(
    (target: number) => {
      const next = clamp(Math.round(target), 0, Math.max(0, pages.length - 1))
      setPageIndex(next)
      if (viewMode === 'continuous') {
        const key = pages[next]?.key
        window.requestAnimationFrame(() => {
          pageRefs.current.get(key)?.scrollIntoView({ block: 'start' })
        })
      }
    },
    [pages, viewMode],
  )

  const goToKey = useCallback(
    (key: string) => {
      const index = pages.findIndex((page) => page.key === key)
      if (index >= 0) {
        goToIndex(index)
      } else {
        toast.show(t('صفحه مقصد پیدا نشد؛ ممکن است حذف شده باشد.', 'Destination page was not found; it may have been deleted.'), { tone: 'error' })
      }
    },
    [pages, goToIndex, toast],
  )

  const modalOpen =
    Boolean(noteTarget) ||
    Boolean(textTarget) ||
    Boolean(pageTemplate) ||
    Boolean(linkRect) ||
    chartOpen ||
    shapeOpen ||
    guideOpen ||
    Boolean(selection)
  useReaderZoomGestures({
    stageRef,
    enabled: !modalOpen && stageSize.width > 0,
    zoom,
    onZoom: setZoom,
    allowDoubleTap: tool === 'select' || tool === 'pan',
  })


  const pageNumber = currentPage?.kind === 'pdf' ? currentPage.pdfPage ?? 1 : 0
  const pageRef = currentKey

  const actions = useReaderActions({
    doc,
    pageRef,
    pageNumber,
    pageCount: pages.length,
    tool,
    penStyle,
    penWidthScale,
    inkColor,
    highlightColor,
    tapeColor,
    category,
  })

  const saveHighlight = async (chosenColor: string, withNote = false) => {
    if (!selection) return
    const annotation = await actions.saveHighlight(selection, chosenColor)
    if (!annotation) return
    setHighlightColor(chosenColor)
    setSelection(null)
    window.getSelection()?.removeAllRanges()
    if (withNote) setNoteTarget({ annotation })
  }

  const addInk = async (points: NormPoint[], pressures: number[]) => {
    await actions.addInk(points, pressures)
  }

  const addTape = async (rect: NormRect) => {
    const id = await actions.addTape(rect)
    if (!id) return
    setActiveObjectId(id)
    setTool('select')
    setSelectedIds([])
  }

  const addText = (point: NormPoint, pageAspect?: number) => {
    setTextTarget({ point, pageAspect })
  }

  const saveText = async (value: {
    text: string
    fontSize: number
    color: string
    textAlign: TextAlign
    verticalAlign: TextVerticalAlign
    textStyle: TextStyle
    category: string
  }) => {
    if (!textTarget) return
    await actions.saveText(
      { ...value, text: value.text.trim() },
      textTarget,
    )
    setTextTarget(null)
    setTool('select')
  }

  const addNote = (point: NormPoint) => {
    setNoteTarget({ point })
  }

  const saveNote = async (text: string, chosenCategory: string) => {
    if (!noteTarget) return
    const saved = await actions.saveNote(text, chosenCategory, noteTarget)
    if (saved) {
      setNoteTarget(null)
      setTool('select')
    }
  }

  const deleteAnnotation = async (annotation: Annotation) => {
    if (activeObjectId === annotation.id) setActiveObjectId(null)
    await actions.deleteAnnotation(annotation)
  }

  const updateAnnotation = async (annotationId: string, patch: Partial<Annotation>) => {
    await actions.updateAnnotation(annotationId, patch)
  }

  const rotateActiveObject = async (delta: number) => {
    if (!activeObject) return
    await actions.rotateTape(activeObject, delta)
  }

  const moveSelected = async (delta: NormPoint) => {
    await actions.moveSelected(delta, selectedIds, annotations)
  }

  const moveAnnotation = async (annotationId: string, delta: NormPoint) => {
    await actions.moveSelected(delta, [annotationId], annotations)
  }

  const deleteSelected = async () => {
    await actions.deleteSelected(selectedIds, annotations)
    setSelectedIds([])
  }

  useReaderKeyboard({
    modalOpen,
    isRtl,
    currentIndex,
    pageStep,
    goToIndex,
    setZoom,
    activeObjectId,
    annotations,
    selectedIds,
    deleteAnnotation,
    deleteSelected: () => {
      void deleteSelected()
    },
    setActiveObjectId,
    setSelectedIds,
    setSelection,
  })

  const recolorSelected = async (chosenColor: string) => {
    await actions.recolorSelected(selectedIds, annotations, chosenColor)
    setHighlightColor(chosenColor)
    setInkColor(chosenColor)
    setTapeColor(chosenColor)
  }

  const placeObject = async (point: NormPoint, pageAspect: number) => {
    const annotation = await actions.placeObject(
      point,
      pageAspect,
      pendingImage,
      pendingChart,
    )
    if (!annotation) return
    if (tool === 'image') setPendingImage(null)
    if (tool === 'chart') setPendingChart(null)
    setActiveObjectId(annotation.id)
    setTool('select')
  }

  const selectTool = (next: ReaderTool) => {
    setTool(next)
    setSelection(null)
    setSelectedIds([])
    setActiveObjectId(null)
    if (next !== 'image') setPendingImage(null)
    if (next !== 'chart') setPendingChart(null)
    if (next !== 'shape') setPendingShape(null)
    if (next !== 'guide') setPendingGuide(null)
    if (next === 'link') {
      toast.show(t('روی برگ بکشید یا کلیک کنید تا ناحیه پیوند ساخته شود.', 'Drag or click on the page to create a link area.'))
    }
    if (next === 'lasso') {
      toast.show(t('دور نشانه‌ها خط بکشید؛ سپس می‌توانید جابه‌جا، رنگ یا حذف کنید.', 'Draw around marks, then move, recolor or delete them.'))
    }
    if (next === 'text') {
      toast.show(t('روی برگ کلیک کنید تا کادر متن ساخته شود.', 'Click on the page to create a text box.'))
    }
    if (next === 'tape') {
      toast.show(t('روی محتوا بکشید تا نوار چسب آن را بپوشاند.', 'Drag over content to cover it with tape.'))
    }
    if (next === 'pan') {
      toast.show(
        t(
          'برای جابه‌جایی صفحه بکشید. با دو انگشت هم می‌توانید زوم و جابه‌جایی کنید.',
          'Drag to pan the page. Pinch with two fingers to zoom and pan.',
        ),
      )
    }
  }

  const submitPageInput = () => {
    const parsed = Number(
      pageInput.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))),
    )
    if (Number.isFinite(parsed) && parsed > 0) goToIndex(parsed - 1)
    else setPageInput(String(currentIndex + 1))
  }
  const toggleDone = async () => {    if (!doc) return
    const nextDone = doc.status !== 'done'
    await db.documents.update(doc.id, {
      status: nextDone ? 'done' : 'reading',
      progress: nextDone ? 1 : Math.min(1, (currentIndex + 1) / Math.max(1, pages.length)),
      lastReadAt: Date.now(),
    })
    toast.show(
      nextDone
        ? t('سند به «تمام‌شده» منتقل شد.', 'Document marked as completed.')
        : t('سند به «در حال مطالعه» برگشت.', 'Document moved back to reading.'),
      { tone: 'success' },
    )
  }

  const reorderAnnotations = async (_pageRef: string, ids: string[]) => {
    await Promise.all(
      ids.map((id, index) =>
        db.annotations.update(id, { sortIndex: index, updatedAt: Date.now() }),
      ),
    )
    toast.show(t('ترتیب نشانه‌ها ذخیره شد.', 'Mark order saved.'), { tone: 'success' })
  }

  const togglePageRead = async (key = currentKey) => {
    await actions.togglePageRead(key)
  }

  const toggleBookmark = async (key = currentKey) => {
    await actions.toggleBookmark(key)
  }

  const saveLinkAnnotation = async (link: LinkInfo) => {
    if (!linkRect) return
    await actions.saveLink(link, linkRect)
    setLinkRect(null)
    setTool('select')
  }

  const pickImage = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.show(t('فایل انتخاب‌شده تصویر نیست.', 'The selected file is not an image.'), { tone: 'error' })
      return
    }
    try {
      const data = await imageFileToDataUrl(file)
      const image = new Image()
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () =>
          reject(new Error(t('خواندن تصویر ناموفق بود.', 'Could not read the image.')))
        image.src = data
      })
      setPendingImage({ data, aspect: image.height / image.width })
      setTool('image')
      toast.show(t('روی برگ کلیک کنید تا تصویر همان‌جا قرار بگیرد.', 'Click on the page to place the image.'))
    } catch (error) {
      toast.show(
        error instanceof Error ? error.message : t('بارگذاری تصویر ناموفق بود.', 'Image upload failed.'),
        { tone: 'error' },
      )
    }
  }

  const chooseChart = (config: ChartConfig) => {
    setChartOpen(false)
    if (chartTarget) {
      void updateAnnotation(chartTarget.id, {
        chart: config,
        color: config.color,
        updatedAt: Date.now(),
      })
      setChartTarget(null)
      toast.show(t('نمودار ویرایش شد.', 'Chart updated.'), { tone: 'success' })
      return
    }
    setPendingChart(config)
    setTool('chart')
    toast.show(t('روی برگ کلیک کنید تا نمودار همان‌جا قرار بگیرد.', 'Click on the page to place the chart.'))
  }

  const chooseShape = (config: ShapeConfig) => {
    setPendingShape(config)
    setShapeOpen(false)
    setTool('shape')
    toast.show(t('روی برگ بکشید تا شکل رسم شود.', 'Drag on the page to draw the shape.'))
  }

  const chooseGuide = (kind: GuideKind) => {
    setPendingGuide(kind)
    setGuideOpen(false)
    setTool('guide')
    toast.show(t('روی برگ کلیک کنید تا ابزار گذاشته شود.', 'Click on the page to place the guide.'))
  }

  const addShape = async (
    rect: NormRect,
    flips: { flipX: boolean; flipY: boolean },
    points?: { start: NormPoint; end: NormPoint },
  ) => {
    if (!pendingShape) return
    const id = await actions.addShape(pendingShape, rect, flips, points)
    if (!id) return
    setPendingShape(null)
    setActiveObjectId(id)
    setTool('select')
  }

  const addGuide = async (point: NormPoint, pageAspect = 1.414) => {
    if (!doc || !pendingGuide) return
    const size =
      pendingGuide === 'ruler'
        ? { w: 0.62, h: 0.09 }
        : pendingGuide === 'protractor'
          ? { w: 0.48, h: 0.48 / (2 * pageAspect) }
          : { w: 0.44, h: 0.44 / (Math.sqrt(3) * pageAspect) }
    const rect = {
      x: point.x - size.w / 2,
      y: point.y - size.h / 2,
      w: size.w,
      h: size.h,
    }
    const now = Date.now()
    const id = newId()
    await db.annotations.add({
      id,
      docId: doc.id,
      pageRef,
      page: pageNumber,
      type: 'guide',
      color: inkColor,
      category,
      rects: [rect],
      guide: { kind: pendingGuide },
      rotation: 0,
      createdAt: now,
      updatedAt: now,
    })
    setPendingGuide(null)
    setActiveObjectId(id)
    setTool('select')
  }

  const openLink = (annotation: Annotation) => {
    const link = annotation.link
    if (!link) return
    if (link.kind === 'external') {
      if (!link.url || !isSafeExternalUrl(link.url)) {
        toast.show(t('آدرس پیوند معتبر نیست.', 'The link address is not valid.'), { tone: 'error' })
        return
      }
      window.open(link.url, '_blank', 'noopener,noreferrer')
      return
    }
    if (link.kind === 'page') {
      if (link.pageKey) goToKey(link.pageKey)
      return
    }
    if (link.kind === 'document') {
      if (!link.docId || !docs.some((item) => item.id === link.docId)) {
        toast.show(t('سند مقصد پیدا نشد.', 'Destination document not found.'), { tone: 'error' })
        return
      }
      navigate(`/read/${link.docId}?pdfPage=${link.page ?? 1}`)
    }
  }

  const createNotebookPage = async (grid: GridType, gridScale = 1) => {
    if (!doc || !currentPage) return
    const afterPage =
      currentPage.kind === 'pdf' ? currentPage.pdfPage ?? 1 : currentPage.notebook?.afterPage ?? 0
    let order = 0
    if (currentPage.kind === 'note' && currentPage.notebook) {
      order = currentPage.notebook.order + 1
      await db.notebookPages
        .where('[docId+afterPage]')
        .equals([doc.id, afterPage])
        .modify((page) => {
          if (page.order >= order) page.order += 1
        })
    } else {
      const siblings = notebookPages.filter((page) => page.afterPage === afterPage)
      order = siblings.length ? Math.max(...siblings.map((page) => page.order)) + 1 : 0
    }
    const pageId = newId()
    const now = Date.now()
    await db.notebookPages.put({
      id: pageId,
      docId: doc.id,
      afterPage,
      order,
      grid,
      gridScale,
      createdAt: now,
      updatedAt: now,
    })
    if (doc.kind === 'note') {
      await db.documents.update(doc.id, { pageCount: notebookPages.length + 1 })
    }
    setPageTemplate(null)
    setFocusKey(notePageKey(pageId))
    toast.show(t('برگه یادداشت درج شد.', 'Notebook page inserted.'), { tone: 'success' })
  }

  const savePageTemplate = async (
    grid: GridType,
    gridScale: number,
    page?: NotebookPage,
  ) => {
    if (page) {
      await db.notebookPages.update(page.id, {
        grid,
        gridScale,
        updatedAt: Date.now(),
      })
      toast.show(t('گرید برگه تغییر کرد.', 'Page grid updated.'), { tone: 'success' })
      setPageTemplate(null)
      return
    }
    await createNotebookPage(grid, gridScale)
  }

  const deleteNotebookPage = async (page: NotebookPage) => {
    if (!doc) return
    if (doc.kind === 'note' && notebookPages.length <= 1) {
      toast.show(t('یادداشت باید حداقل یک صفحه داشته باشد.', 'A note must keep at least one page.'), { tone: 'error' })
      return
    }
    await deleteNotebookPageCascade(page)
    if (doc.kind === 'note') {
      await db.documents.update(doc.id, {
        pageCount: Math.max(1, notebookPages.length - 1),
      })
    }
    setPageTemplate(null)
    setActiveObjectId(null)
    if (doc.kind === 'note') setPageIndex(0)
    else setFocusKey(pdfPageKey(page.afterPage || 1))
    toast.show(t('برگه یادداشت و نشانه‌هایش حذف شد.', 'Notebook page and its marks were deleted.'))
  }

  if (doc === undefined) {
    return <ReaderState variant="loading" onBack={() => navigate('/')} />
  }
  if (!doc) {
    return <ReaderState variant="missing" onBack={() => navigate('/')} />
  }
  if (!currentPage) {
    return <ReaderState variant="building" />
  }
  const collection = collections.find((item) => item.id === doc.collectionId)
  const pagePercent = Math.round(doc.progress * 100)
  const noteTargetTitle = noteTarget?.annotation
    ? t('ویرایش یادداشت', 'Edit note')
    : t('یادداشت جدید', 'New note')
  const usesTapeColor = tool === 'tape' || Boolean(activeTape)
  const usesTextColor = tool === 'text'
  const usesHighlightColor =
    !usesTapeColor &&
    !usesTextColor &&
    (tool === 'marker' ||
      tool === 'highlight' ||
      tool === 'select' ||
      (tool === 'pen' && penStyle === 'marker'))
  const palette = usesTapeColor
    ? TAPE_COLORS
    : usesTextColor
      ? INK_COLORS
      : usesHighlightColor
        ? HIGHLIGHT_COLORS
        : INK_COLORS
  const activeColor = usesTapeColor
    ? activeTape?.color ?? tapeColor
    : usesTextColor
      ? inkColor
      : usesHighlightColor
        ? highlightColor
        : inkColor
  const activePenStyle: PenStyle = tool === 'marker' ? 'marker' : penStyle
  const notebookCount = notebookPages.length
  const pageLabel = pageDisplayLabel(currentPage, currentIndex, pages)
  const selectedAnnotations = annotations.filter((annotation) =>
    selectedIds.includes(annotation.id),
  )
  const readCount = pages.filter((page) => doc.readPages?.[page.key]).length
  const isCurrentRead = Boolean(doc.readPages?.[currentKey])
  const isCurrentBookmarked = doc.bookmarkKey === currentKey
  const bookmarkIndex = doc.bookmarkKey
    ? pages.findIndex((page) => page.key === doc.bookmarkKey)
    : -1
  const effectiveFitMode: FitMode =
    viewMode === 'continuous' ? 'width' : fitMode
  const estimatedPageHeight =
    effectiveFitMode === 'height'
      ? Math.max(240, stageSize.height - 170)
      : Math.round(
          Math.max(240, stageSize.width - 56) *
            (currentPage.kind === 'note'
              ? documentPageSize(doc).height /
                documentPageSize(doc).width
              : 1.414),
        )

  const surface: PageSurfaceProps = {
    pdf: pdf ?? undefined,
    zoom,
    tool,
    color: inkColor,
    highlightColor,
    penStyle: activePenStyle,
    penWidthScale,
    tapeColor,
    notebookSize,
    fitMode: effectiveFitMode,
    viewportHeight: stageSize.height > 0 ? stageSize.height : undefined,
    readingTheme,
    showText,
    selectedIds,
    activeObjectId,
    annotations,
    onTextSelected: setSelection,
    onAddInk: (points, pressures) => {
      void addInk(points, pressures)
    },
    onAddNote: addNote,
    onOpenAnnotation: (annotation) => setNoteTarget({ annotation }),
    onErase: (annotation) => {
      void deleteAnnotation(annotation)
    },
    onAddLink: setLinkRect,
    onAddTape: (rect) => {
      void addTape(rect)
    },
    onAddText: addText,
    onEditText: (annotation, pageAspect) => setTextTarget({ annotation, pageAspect }),
    onEditChart: (annotation) => {
      setChartTarget(annotation)
      setChartOpen(true)
    },
    onLassoSelect: (ids) => {
      setActiveObjectId(null)
      setSelectedIds(ids)
    },
    onMoveSelected: (delta) => {
      void moveSelected(delta)
    },
    onMoveAnnotation: (annotationId, delta) => {
      void moveAnnotation(annotationId, delta)
    },
    onSelectObject: setActiveObjectId,
    onUpdateAnnotation: (annotationId, patch) => {
      void updateAnnotation(annotationId, patch)
    },
    onPlaceObject: (point, pageAspect) => {
      void placeObject(point, pageAspect)
    },
    onAddShape: (rect, flips, points) => {
      void addShape(rect, flips, points)
    },
    onAddGuide: (point, pageAspect) => {
      void addGuide(point, pageAspect)
    },
    pendingShape,
    snapEnabled,
    onOpenLink: openLink,
  }

  return (
    <div
      className={`reader${panelOpen ? ' reader--with-panel' : ''} ${
        showLabels ? 'reader--labels' : 'reader--icons'
      }`}
    >
      <ReaderHeader
        doc={doc}
        pageLabel={pageLabel}
        currentIndex={currentIndex}
        pageCount={pages.length}
        annotationCount={annotations.length}
        panelOpen={panelOpen}
        isCurrentBookmarked={isCurrentBookmarked}
        onBack={() => navigate('/')}
        onToggleDone={() => {
          void toggleDone()
        }}
        onTogglePanel={() => setPanelOpen((value) => !value)}
        onJumpBookmark={() => {
          if (doc.bookmarkKey) goToKey(doc.bookmarkKey)
        }}
      />

      <ReaderToolbar
        tool={tool}
        penStyle={penStyle}
        penWidthScale={penWidthScale}
        activeColor={activeColor}
        palette={palette}
        category={category}
        notebookPage={currentPage.kind === 'note'}
        notebookGridName={
          GRID_TYPES.find((item) => item.id === currentPage.notebook?.grid)?.[
            lang === 'en' ? 'nameEn' : 'name'
          ]
        }
        onSelectTool={selectTool}
        onPenStyle={setPenStyle}
        onPenWidth={setPenWidthScale}
        onColor={(chosenColor) => {
          if (usesTapeColor) {
            setTapeColor(chosenColor)
            if (activeTape) void updateAnnotation(activeTape.id, { color: chosenColor })
          } else if (usesHighlightColor) setHighlightColor(chosenColor)
          else setInkColor(chosenColor)
        }}
        onCategory={setCategory}
        onImage={() => imageInputRef.current?.click()}
        onChart={() => {
          setChartTarget(null)
          setChartOpen(true)
        }}
        onLink={() => selectTool('link')}
        onNote={() => selectTool('note')}
        onShape={() => setShapeOpen(true)}
        onGuide={() => setGuideOpen(true)}
        snapEnabled={snapEnabled}
        onSnap={() => setSnapEnabled((value) => !value)}
        onAddPage={() => setPageTemplate({ mode: 'create' })}
        onEditPage={() => {
          if (currentPage.notebook) setPageTemplate({ mode: 'edit', page: currentPage.notebook })
        }}
      />

      <div className="reader__body">
        <main className="reader__main">
          <div
            ref={stageRef}
            className={`reader__stage${
              viewMode === 'continuous' ? ' reader__stage--continuous' : ''
            }`}
          >
            {loading && currentPage.kind === 'pdf' && (
              <div className="reader-state reader-state--inline">
                <Loader2 size={26} className="spin" />
                <p>{t('در حال آماده‌سازی فایل…', 'Preparing the file…')}</p>
              </div>
            )}
            {error && doc.kind !== 'note' && (
              <div className="reader-state reader-state--inline">
                <h2>{t('فایل باز نشد', 'Could not open file')}</h2>
                <p>{error}</p>
              </div>
            )}
            {!loading && !error && viewMode === 'single' && (
              <PageSlot
                doc={doc}
                page={currentPage}
                index={currentIndex}
                pages={pages}
                currentKey={currentKey}
                mounted
                estimatedHeight={estimatedPageHeight}
                surface={surface}
                onToggleRead={(key) => {
                  void togglePageRead(key)
                }}
                onToggleBookmark={(key) => {
                  void toggleBookmark(key)
                }}
                onMountRef={(key, element) => {
                  if (element) pageRefs.current.set(key, element)
                  else pageRefs.current.delete(key)
                }}
              />
            )}
            {!loading && !error && viewMode === 'spread' && (
              <div className="reader__spread">
                {pages
                  .slice(currentIndex, currentIndex + 2)
                  .map((page, offset) => (
                    <PageSlot
                      key={page.key}
                      doc={doc}
                      page={page}
                      index={currentIndex + offset}
                      pages={pages}
                      currentKey={currentKey}
                      mounted
                      estimatedHeight={estimatedPageHeight}
                      surface={surface}
                      onToggleRead={(key) => {
                        void togglePageRead(key)
                      }}
                      onToggleBookmark={(key) => {
                        void toggleBookmark(key)
                      }}
                      onMountRef={(key, element) => {
                        if (element) pageRefs.current.set(key, element)
                        else pageRefs.current.delete(key)
                      }}
                    />
                  ))}
              </div>
            )}
            {!loading &&
              !error &&
              viewMode === 'continuous' &&
              pages.map((page, index) => (
                <PageSlot
                  key={page.key}
                  doc={doc}
                  page={page}
                  index={index}
                  pages={pages}
                  currentKey={currentKey}
                  mounted={Math.abs(index - currentIndex) <= 2}
                  estimatedHeight={estimatedPageHeight}
                  surface={surface}
                  onToggleRead={(key) => {
                    void togglePageRead(key)
                  }}
                  onToggleBookmark={(key) => {
                    void toggleBookmark(key)
                  }}
                  onMountRef={(key, element) => {
                    if (element) pageRefs.current.set(key, element)
                    else pageRefs.current.delete(key)
                  }}
                />
              ))}
          </div>

          <PageDock
            pageInput={pageInput}
            pageCount={pages.length}
            currentIndex={currentIndex}
            pageLabel={pageLabel}
            pageStep={pageStep}
            pagePercent={pagePercent}
            isRead={isCurrentRead}
            isBookmarked={isCurrentBookmarked}
            zoom={zoom}
            effectiveFitMode={effectiveFitMode}
            viewMode={viewMode}
            fitMode={fitMode}
            readingTheme={readingTheme}
            onZoom={setZoom}
            onViewMode={setViewMode}
            onFitMode={setFitMode}
            onReadingTheme={setReadingTheme}
            showText={showText}
            onShowText={setShowText}
            showLabels={showLabels}
            onShowLabels={setShowLabels}
            onPageInput={setPageInput}
            onSubmitPage={submitPageInput}
            onPrev={() => goToIndex(currentIndex - pageStep)}
            onNext={() => goToIndex(currentIndex + pageStep)}
            onToggleRead={() => {
              void togglePageRead()
            }}
            onToggleBookmark={() => {
              void toggleBookmark()
            }}
          />

          <ReaderBars
            tool={tool}
            activeObject={activeObject}
            selectedAnnotations={selectedAnnotations}
            onRotateObject={(delta) => {
              void rotateActiveObject(delta)
            }}
            onEditObject={(annotation) => {
              if (annotation.type === 'chart') {
                setChartTarget(annotation)
                setChartOpen(true)
              } else if (annotation.type === 'text') {
                setTextTarget({
                  annotation,
                  pageAspect:
                    currentPage.kind === 'note'
                      ? notebookSize.height / notebookSize.width
                      : 1.414,
                })
              }
            }}
            onDeleteObject={(annotation) => {
              void deleteAnnotation(annotation)
            }}
            onCloseObject={() => setActiveObjectId(null)}
            onRecolorSelected={(color) => {
              void recolorSelected(color)
            }}
            onDeleteSelected={() => {
              void deleteSelected()
            }}
            onClearSelection={() => setSelectedIds([])}
          />
        </main>

        {panelOpen && (
          <ReaderPanel
            doc={doc}
            pages={pages}
            annotations={annotations}
            currentKey={currentKey}
            panelTab={panelTab}
            selectedId={activeObjectId}
            collectionName={collection?.name}
            pageSizeName={documentPageSizeLabel(doc)}
            notebookCount={notebookCount}
            readCount={readCount}
            bookmarkIndex={bookmarkIndex}
            exporting={exporting}
            pdfReady={Boolean(pdf)}
            onTab={setPanelTab}
            onClose={() => setPanelOpen(false)}
            onSelect={(annotation) => {
              goToKey(annotation.pageRef)
              setActiveObjectId(annotation.id)
              setSelectedIds([])
            }}
            onEdit={(annotation) => {
              if (annotation.type === 'text') setTextTarget({ annotation })
              else setNoteTarget({ annotation })
            }}
            onDelete={(annotation) => {
              void deleteAnnotation(annotation)
            }}
            onUpdate={(annotationId, patch) => {
              void updateAnnotation(annotationId, patch)
            }}
            onReorder={(ref, ids) => {
              void reorderAnnotations(ref, ids)
            }}
            onExport={() => {
              void exportPdf()
            }}
            onDownloadOriginal={() => {
              void downloadOriginal()
            }}
            onUpdatePage={(patch) => {
              void db.documents.update(doc.id, patch)
            }}
          />
        )}
      </div>

      <SelectionPopover
        selection={selection}
        currentColor={highlightColor}
        onHighlight={(color, withNote) => {
          void saveHighlight(color, withNote)
        }}
        onClose={() => {
          setSelection(null)
          window.getSelection()?.removeAllRanges()
        }}
      />

      <ReaderModals
        doc={doc}
        pages={pages}
        currentPage={currentPage}
        currentIndex={currentIndex}
        currentKey={currentKey}
        notebookPages={notebookPages}
        docs={docs}
        noteTarget={noteTarget}
        noteTargetTitle={noteTargetTitle}
        pageLabel={pageLabel}
        category={category}
        onSaveNote={(text, chosenCategory) => {
          void saveNote(text, chosenCategory)
        }}
        onCloseNote={() => setNoteTarget(null)}
        pageTemplate={pageTemplate}
        onSavePageTemplate={(grid, gridScale) => {
          if (pageTemplate?.mode === 'edit' && pageTemplate.page) {
            void savePageTemplate(grid, gridScale, pageTemplate.page)
          } else {
            void savePageTemplate(grid, gridScale)
          }
        }}
        onDeletePage={(page) => {
          void deleteNotebookPage(page)
        }}
        onClosePageTemplate={() => setPageTemplate(null)}
        linkRect={linkRect}
        onSaveLink={(link) => {
          void saveLinkAnnotation(link)
        }}
        onCloseLink={() => {
          setLinkRect(null)
          setTool('select')
        }}
        chartOpen={chartOpen}
        chartInitial={chartTarget?.chart ?? null}
        onSaveChart={chooseChart}
        onCloseChart={() => {
          setChartOpen(false)
          setChartTarget(null)
        }}
        shapeOpen={shapeOpen}
        onSaveShape={chooseShape}
        onCloseShape={() => setShapeOpen(false)}
        guideOpen={guideOpen}
        onSaveGuide={chooseGuide}
        onCloseGuide={() => setGuideOpen(false)}
        textTarget={textTarget}
        inkColor={inkColor}
        onSaveText={(value) => {
          void saveText(value)
        }}
        onCloseText={() => setTextTarget(null)}
        imageInputRef={imageInputRef}
        onPickImage={(file) => {
          void pickImage(file)
        }}
      />
    </div>
  )
}
