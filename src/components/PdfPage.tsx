import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { ShapeGuideLayer } from './page/ShapeGuideLayer'
import { ObjectLayer } from './page/ObjectLayer'
import { TextAnnotations } from './page/TextAnnotations'
import { TapeLayer } from './page/TapeLayer'
import { InkLayer } from './page/InkLayer'
import { LinkNoteLayer } from './page/LinkNoteLayer'
import { NotebookGrid } from './page/NotebookGrid'
import { useShapeDraft } from '../hooks/useShapeDraft'
import { useShapeEndpoints } from '../hooks/useShapeEndpoints'
import { usePagePan } from '../hooks/usePagePan'
import { isLineShape } from '../lib/shapes'
import { pdfjs } from '../lib/pdf'
import type {
  Annotation,
  NormPoint,
  NormRect,
  NotebookPage,
  PenStyle,
  ReaderTool,
  ShapeConfig,
} from '../lib/types'
import {
  annotationCenter,
  annotationHit,
  clamp,
  pointInPolygon,
  rectCenter,
} from '../lib/utils'
import { snapPointWithGuides } from '../lib/pageSnap'
import type { TapeDrag, TapeGeometry } from './page/transformTypes'
import { translate } from '../lib/lang'

interface SelectionPayload {
  rects: NormRect[]
  text: string
  anchor: { x: number; y: number }
}

export interface PageViewProps {
  pdf?: pdfjs.PDFDocumentProxy
  pdfPageNumber?: number
  notebook?: NotebookPage
  pageKey: string
  zoom: number
  tool: ReaderTool
  color: string
  highlightColor: string
  penStyle: PenStyle
  penWidthScale: number
  tapeColor: string
  notebookSize?: { width: number; height: number }
  fitMode?: 'width' | 'height'
  viewportHeight?: number
  readingTheme?: 'normal' | 'dim' | 'dark'
  showText?: boolean
  selectedIds: string[]
  activeObjectId: string | null
  annotations: Annotation[]
  onTextSelected: (payload: SelectionPayload) => void
  onAddInk: (points: NormPoint[], pressures: number[]) => void
  onAddNote: (point: NormPoint) => void
  onOpenAnnotation: (annotation: Annotation) => void
  onErase: (annotation: Annotation) => void
  onAddLink: (rect: NormRect) => void
  onAddTape: (rect: NormRect) => void
  onAddText: (point: NormPoint, pageAspect: number) => void
  onEditText: (annotation: Annotation, pageAspect: number) => void
  onEditChart: (annotation: Annotation) => void
  onLassoSelect: (ids: string[]) => void
  onMoveSelected: (delta: NormPoint) => void
  onMoveAnnotation: (id: string, delta: NormPoint) => void
  onSelectObject: (id: string | null) => void
  onUpdateAnnotation: (id: string, patch: Partial<Annotation>) => void
  onPlaceObject: (point: NormPoint, pageAspect: number) => void
  onAddShape: (
    rect: NormRect,
    flips: { flipX: boolean; flipY: boolean },
    points?: { start: NormPoint; end: NormPoint },
  ) => void
  onAddGuide: (point: NormPoint, pageAspect: number) => void
  pendingShape?: ShapeConfig | null
  snapEnabled?: boolean
  onOpenLink: (annotation: Annotation) => void
}

const NOTEBOOK_WIDTH = 595
const NOTEBOOK_HEIGHT = 842

export function PdfPage({
  pdf,
  pdfPageNumber,
  notebook,
  pageKey,
  zoom,
  tool,
  color,
  highlightColor,
  penStyle,
  penWidthScale,
  tapeColor,
  notebookSize,
  fitMode = 'width',
  viewportHeight,
  readingTheme = 'normal',
  showText = true,
  selectedIds,
  activeObjectId,
  annotations,
  onTextSelected,
  onAddInk,
  onAddNote,
  onOpenAnnotation,
  onErase,
  onAddLink,
  onAddTape,
  onAddText,
  onEditText,
  onEditChart,
  onLassoSelect,
  onMoveSelected,
  onMoveAnnotation,
  onSelectObject,
  onUpdateAnnotation,
  onPlaceObject,
  onAddShape,
  onAddGuide,
  pendingShape,
  snapEnabled = false,
  onOpenLink,
}: PageViewProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const [availableWidth, setAvailableWidth] = useState(0)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [pagePoints, setPagePoints] = useState({ width: 595, height: 842 })
  const [rendering, setRendering] = useState(true)
  const [draft, setDraft] = useState<NormPoint[]>([])
  const [draftPressures, setDraftPressures] = useState<number[]>([])
  const [linkDraft, setLinkDraft] = useState<NormRect | null>(null)
  const [tapeDraft, setTapeDraft] = useState<NormRect | null>(null)
  const [lassoPath, setLassoPath] = useState<NormPoint[]>([])
  const [moveDelta, setMoveDelta] = useState<NormPoint>({ x: 0, y: 0 })
  const [objectDelta, setObjectDelta] = useState<NormPoint>({ x: 0, y: 0 })
  const [tapePreview, setTapePreview] = useState<{ id: string; geometry: TapeGeometry } | null>(
    null,
  )
  const drawingRef = useRef(false)
  const draftPointsRef = useRef<NormPoint[]>([])
  const draftPressuresRef = useRef<number[]>([])
  const linkStartRef = useRef<NormPoint | null>(null)
  const tapeStartRef = useRef<NormPoint | null>(null)
  const lassoRef = useRef<NormPoint[]>([])
  const moveStartRef = useRef<NormPoint | null>(null)
  const objectDragRef = useRef<{ id: string; start: NormPoint } | null>(null)
  const objectDragMovedRef = useRef(false)
  const eraseRef = useRef(false)
  const erasedIdsRef = useRef<Set<string>>(new Set())
  const boxDragCleanupRef = useRef<(() => void) | null>(null)
  const objectDragCleanupRef = useRef<(() => void) | null>(null)
  const tapeDragRef = useRef<TapeDrag | null>(null)
  const tapePreviewRef = useRef<{ id: string; geometry: TapeGeometry } | null>(null)
  const lastPenAtRef = useRef(0)
  const isNotebook = Boolean(notebook)
  const selectedSet = new Set(selectedIds)
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const update = () => setAvailableWidth(host.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!availableWidth || availableWidth < 120) return
    setDraft([])
    setDraftPressures([])
    setLinkDraft(null)
    setTapeDraft(null)
    setLassoPath([])
    setMoveDelta({ x: 0, y: 0 })
    setObjectDelta({ x: 0, y: 0 })
    objectDragRef.current = null
    objectDragCleanupRef.current?.()
    objectDragCleanupRef.current = null
    boxDragCleanupRef.current?.()
    boxDragCleanupRef.current = null
    eraseRef.current = false
    erasedIdsRef.current.clear()
    setTapePreview(null)
    tapePreviewRef.current = null
    tapeDragRef.current = null

    const stageHeight =
      viewportHeight ??
      (hostRef.current?.closest('.reader__stage') as HTMLElement | null)?.clientHeight ??
      0
    const heightTarget = stageHeight > 0 ? Math.max(180, stageHeight - 110) : 0

    if (isNotebook) {
      const fitWidth = Math.max(220, availableWidth - 28)
      const baseWidth = notebookSize?.width ?? NOTEBOOK_WIDTH
      const baseHeight = notebookSize?.height ?? NOTEBOOK_HEIGHT
      const widthScale = fitWidth / baseWidth
      const fitScale =
        fitMode === 'height' && heightTarget > 100
          ? Math.min((heightTarget - 20) / baseHeight, 2.5)
          : Math.min(widthScale, 1.8)
      setPagePoints({ width: baseWidth, height: baseHeight })
      setSize({
        width: baseWidth * fitScale * zoom,
        height: baseHeight * fitScale * zoom,
      })
      setRendering(false)
      return
    }

    if (!pdf || !pdfPageNumber) return

    let cancelled = false
    let renderTask: pdfjs.RenderTask | null = null
    let textLayer: pdfjs.TextLayer | null = null
    setRendering(true)

    void (async () => {
      try {
        const page = await pdf.getPage(pdfPageNumber)
        if (cancelled) return

        const base = page.getViewport({ scale: 1 })
        setPagePoints({ width: base.width, height: base.height })
        const fitWidth = Math.max(220, availableWidth - 28)
        const widthScale = fitWidth / base.width
        const fitScale =
          fitMode === 'height' && heightTarget > 100
            ? Math.min((heightTarget - 20) / base.height, 2.5)
            : Math.min(widthScale, 1.8)
        const viewport = page.getViewport({ scale: fitScale * zoom })
        const canvas = canvasRef.current
        const textLayerDiv = textLayerRef.current
        if (!canvas || !textLayerDiv || cancelled) return

        const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
        canvas.width = Math.max(1, Math.floor(viewport.width * dpr))
        canvas.height = Math.max(1, Math.floor(viewport.height * dpr))
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`
        const context = canvas.getContext('2d')
        if (!context) throw new Error(translate('Canvas 2D در دسترس نیست.', 'Canvas 2D is not available.'))
        context.setTransform(1, 0, 0, 1, 0, 0)
        context.clearRect(0, 0, canvas.width, canvas.height)

        setSize({ width: viewport.width, height: viewport.height })
        pageRef.current?.style.setProperty('--scale-factor', String(viewport.scale))

        renderTask = page.render({
          canvasContext: context,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        })
        await renderTask.promise
        if (cancelled) return

        textLayerDiv.replaceChildren()
        textLayer = new pdfjs.TextLayer({
          textContentSource: page.streamTextContent(),
          container: textLayerDiv,
          viewport,
        })
        await textLayer.render()
        if (cancelled) {
          textLayer.cancel()
          return
        }
        setRendering(false)
      } catch (error) {
        if (
          cancelled ||
          (error instanceof Error && error.name === 'RenderingCancelledException')
        ) {
          return
        }
        setRendering(false)
      }
    })()

    return () => {
      cancelled = true
      renderTask?.cancel()
      textLayer?.cancel()
    }
  }, [
    pdf,
    pdfPageNumber,
    zoom,
    availableWidth,
    isNotebook,
    notebook?.id,
    notebookSize,
    fitMode,
    viewportHeight,
  ])

  const pointFromClient = (clientX: number, clientY: number): NormPoint | null => {
    const box = pageRef.current?.getBoundingClientRect()
    if (!box || box.width === 0 || box.height === 0) return null
    return {
      x: (clientX - box.left) / box.width,
      y: (clientY - box.top) / box.height,
    }
  }

  const snapPoint = (point: NormPoint, anchor?: NormPoint | null): NormPoint =>
    snapPointWithGuides(point, {
      enabled: snapEnabled,
      isNotebook,
      grid: notebook?.grid,
      gridScale: notebook?.gridScale,
      width: size.width || NOTEBOOK_WIDTH,
      height: size.height || NOTEBOOK_HEIGHT,
      anchor,
      annotations,
    })

  const { shapeDraft, beginShape, moveShape, finishShape } = useShapeDraft({
    pendingShape,
    pointFromClient,
    snapPoint,
    onAddShape,
  })

  const { preview: shapeEndpointPreview, beginShapeEndpoint } = useShapeEndpoints({
    pointFromClient,
    snapPoint,
    getPageBox: () => pageRef.current?.getBoundingClientRect() ?? null,
    onUpdateAnnotation,
  })

  const { beginPan, movePan, finishPan } = usePagePan()

  const captureSelection = () => {
    if (isNotebook || (tool !== 'select' && tool !== 'highlight')) return
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.rangeCount) return
    const range = selection.getRangeAt(0)
    if (!textLayerRef.current?.contains(range.commonAncestorContainer)) return
    const box = pageRef.current?.getBoundingClientRect()
    if (!box) return

    const rects: NormRect[] = []
    for (const rect of Array.from(range.getClientRects())) {
      const left = Math.max(rect.left, box.left)
      const top = Math.max(rect.top, box.top)
      const right = Math.min(rect.right, box.right)
      const bottom = Math.min(rect.bottom, box.bottom)
      if (right - left < 1 || bottom - top < 1) continue
      rects.push({
        x: clamp((left - box.left) / box.width),
        y: clamp((top - box.top) / box.height),
        w: clamp((right - left) / box.width),
        h: clamp((bottom - top) / box.height),
      })
    }

    const text = selection.toString().trim()
    if (!rects.length || !text) return
    const bounds = range.getBoundingClientRect()
    onTextSelected({
      rects,
      text,
      anchor: { x: bounds.left + bounds.width / 2, y: Math.max(64, bounds.top - 8) },
    })
  }

  const pressureOf = (event: ReactPointerEvent<HTMLDivElement>): number => {
    if (event.pointerType === 'pen') {
      return Math.max(0.04, Math.min(1, event.pressure || 0.35))
    }
    return 0.55
  }

  const beginStroke = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'pen') lastPenAtRef.current = Date.now()
    if (!event.isPrimary) {
      if (event.pointerType === 'touch' && Date.now() - lastPenAtRef.current >= 1800) {
        drawingRef.current = false
        draftPointsRef.current = []
        draftPressuresRef.current = []
        setDraft([])
        setDraftPressures([])
      }
      return
    }
    if (event.pointerType === 'touch' && Date.now() - lastPenAtRef.current < 1800) return
    if (event.button !== 0 && event.pointerType === 'mouse') return
    const point = pointFromClient(event.clientX, event.clientY)
    if (!point) return
    const snapped = snapPoint(point)
    event.currentTarget.setPointerCapture(event.pointerId)
    drawingRef.current = true
    draftPointsRef.current = [snapped]
    draftPressuresRef.current = [pressureOf(event)]
    setDraft([snapped])
    setDraftPressures([pressureOf(event)])
  }

  const moveStroke = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drawingRef.current) return
    const point = pointFromClient(event.clientX, event.clientY)
    if (!point) return
    const current = draftPointsRef.current
    const last = current[current.length - 1]
    const snapped = snapPoint(point, last)
    if (last && Math.hypot(last.x - snapped.x, last.y - snapped.y) < 0.0012) return
    current.push(snapped)
    draftPressuresRef.current.push(pressureOf(event))
    setDraft([...current])
    setDraftPressures([...draftPressuresRef.current])
  }

  const finishStroke = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drawingRef.current) return
    drawingRef.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const points = draftPointsRef.current
    if (points.length > 1) {
      const pressures = points.map(
        (_, index) => draftPressuresRef.current[index] ?? 0.55,
      )
      onAddInk(points, pressures)
    } else if (points.length === 1) {
      const pressure = draftPressuresRef.current[0] ?? 0.55
      onAddInk(
        [
          { x: points[0].x - 0.0006, y: points[0].y - 0.0006 },
          { x: points[0].x + 0.0006, y: points[0].y + 0.0006 },
        ],
        [pressure, pressure],
      )
    }
    draftPointsRef.current = []
    draftPressuresRef.current = []
    setDraft([])
    setDraftPressures([])
  }

  const beginLink = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return
    const point = pointFromClient(event.clientX, event.clientY)
    if (!point) return
    event.currentTarget.setPointerCapture(event.pointerId)
    linkStartRef.current = point
    setLinkDraft({ x: point.x, y: point.y, w: 0, h: 0 })
  }

  const moveLink = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = linkStartRef.current
    if (!start) return
    const point = pointFromClient(event.clientX, event.clientY)
    if (!point) return
    setLinkDraft({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      w: Math.abs(point.x - start.x),
      h: Math.abs(point.y - start.y),
    })
  }

  const finishLink = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = linkStartRef.current
    if (!start) return
    linkStartRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const rect = linkDraft
    setLinkDraft(null)
    if (rect && rect.w > 0.012 && rect.h > 0.008) {
      onAddLink(rect)
    } else {
      onAddLink({
        x: start.x - 0.16,
        y: start.y - 0.025,
        w: 0.32,
        h: 0.05,
      })
    }
  }

  const beginTape = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return
    const point = pointFromClient(event.clientX, event.clientY)
    if (!point) return
    event.currentTarget.setPointerCapture(event.pointerId)
    tapeStartRef.current = point
    setTapeDraft({ x: point.x, y: point.y, w: 0, h: 0 })
  }

  const moveTape = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = tapeStartRef.current
    if (!start) return
    const point = pointFromClient(event.clientX, event.clientY)
    if (!point) return
    setTapeDraft({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      w: Math.abs(point.x - start.x),
      h: Math.abs(point.y - start.y),
    })
  }

  const finishTape = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = tapeStartRef.current
    if (!start) return
    tapeStartRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const rect = tapeDraft
    setTapeDraft(null)
    if (rect && rect.w > 0.01 && rect.h > 0.006) {
      onAddTape(rect)
    } else {
      onAddTape({
        x: start.x - 0.17,
        y: start.y - 0.018,
        w: 0.34,
        h: 0.036,
      })
    }
  }

  const tapeGeometryFor = (annotation: Annotation): TapeGeometry => {
    const rect = annotation.rects?.[0] ?? { x: 0, y: 0, w: 0.3, h: 0.04 }
    if (tapePreview?.id === annotation.id) return tapePreview.geometry
    return { ...rect, rotation: annotation.rotation ?? 0 }
  }

  const beginTapeTransform = (
    event: ReactPointerEvent<HTMLDivElement>,
    annotation: Annotation,
  ) => {
    if (tool !== 'select') return
    const shapeHandle = (event.target as HTMLElement).closest(
      '[data-shape-handle]',
    ) as HTMLElement | null
    if (shapeHandle && annotation.type === 'shape' && isLineShape(annotation.shape?.kind)) {
      const handle = shapeHandle.dataset.shapeHandle
      if (
        handle === 'start' ||
        handle === 'end' ||
        handle === 'bend' ||
        handle === 'bend1' ||
        handle === 'bend2'
      ) {
        beginShapeEndpoint(event, annotation, handle)
        return
      }
    }
    event.stopPropagation()
    event.preventDefault()
    onSelectObject(annotation.id)
    const box = pageRef.current?.getBoundingClientRect()
    if (!box) return
    const target = (event.target as HTMLElement).closest(
      '[data-tape-handle]',
    ) as HTMLElement | null
    const handle = target?.dataset.tapeHandle ?? 'move'
    const geometry = tapeGeometryFor(annotation)
    const drag: TapeDrag = {
      id: annotation.id,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      geometry,
      box,
    }
    tapeDragRef.current = drag
    const preview = { id: annotation.id, geometry }
    tapePreviewRef.current = preview
    setTapePreview(preview)
    ;(event.currentTarget as Element).setPointerCapture(event.pointerId)

    const move = (pointerEvent: PointerEvent) => {
      moveTapeTransform(pointerEvent as unknown as ReactPointerEvent<HTMLDivElement>)
    }
    const finish = (pointerEvent: PointerEvent) => {
      move(pointerEvent)
      commitTapeTransform()
      cleanup()
    }
    const cancel = () => {
      tapeDragRef.current = null
      tapePreviewRef.current = null
      setTapePreview(null)
      cleanup()
    }
    const cleanup = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('mousemove', move as EventListener)
      window.removeEventListener('mouseup', finish as EventListener)
      boxDragCleanupRef.current = null
    }
    boxDragCleanupRef.current = cleanup
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('mousemove', move as EventListener)
    window.addEventListener('mouseup', finish as EventListener)
  }

  const moveTapeTransform = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = tapeDragRef.current
    if (!drag) return
    const dxPx = event.clientX - drag.startX
    const dyPx = event.clientY - drag.startY
    const box = drag.box
    const geometry = drag.geometry
    let next: TapeGeometry = { ...geometry }

    if (drag.handle === 'rotate') {
      const centerX = box.left + (geometry.x + geometry.w / 2) * box.width
      const centerY = box.top + (geometry.y + geometry.h / 2) * box.height
      let angle = (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI + 90
      if (event.shiftKey) angle = Math.round(angle / 15) * 15
      next.rotation = ((angle + 180) % 360 + 360) % 360 - 180
    } else if (drag.handle === 'move') {
      next.x = geometry.x + dxPx / box.width
      next.y = geometry.y + dyPx / box.height
    } else {
      const theta = (geometry.rotation * Math.PI) / 180
      const cos = Math.cos(theta)
      const sin = Math.sin(theta)
      const localX = dxPx * cos + dyPx * sin
      const localY = -dxPx * sin + dyPx * cos
      const edgeX = drag.handle.includes('e') ? 1 : drag.handle.includes('w') ? -1 : 0
      const edgeY = drag.handle.includes('s') ? 1 : drag.handle.includes('n') ? -1 : 0
      let newW = clamp(geometry.w + (edgeX * localX) / box.width, 0.02, 3)
      let newH = clamp(geometry.h + (edgeY * localY) / box.height, 0.015, 3)
      const guideKind = annotations.find((item) => item.id === drag.id)?.guide?.kind
      const physicalRatio =
        guideKind === 'protractor' ? 2 : guideKind === 'triangle' ? Math.sqrt(3) : null
      const pageAspect = box.height / Math.max(1, box.width)
      const guideRatio = physicalRatio ? physicalRatio * pageAspect : null
      if (guideRatio) {
        if (drag.handle.includes('e') || drag.handle.includes('w')) {
          newH = newW / guideRatio
        } else if (drag.handle.includes('n') || drag.handle.includes('s')) {
          newW = newH * guideRatio
        }
        newW = clamp(newW, 0.06, 2)
        newH = clamp(newH, 0.03, 2)
      }
      const deltaW = (newW - geometry.w) * box.width
      const deltaH = (newH - geometry.h) * box.height
      const shiftLocalX = (edgeX * deltaW) / 2
      const shiftLocalY = (edgeY * deltaH) / 2
      const shiftScreenX = shiftLocalX * cos - shiftLocalY * sin
      const shiftScreenY = shiftLocalX * sin + shiftLocalY * cos
      const centerX = geometry.x + geometry.w / 2 + shiftScreenX / box.width
      const centerY = geometry.y + geometry.h / 2 + shiftScreenY / box.height
      next = {
        x: centerX - newW / 2,
        y: centerY - newH / 2,
        w: newW,
        h: newH,
        rotation: geometry.rotation,
      }
    }

    const preview = { id: drag.id, geometry: next }
    tapePreviewRef.current = preview
    setTapePreview(preview)
  }

  const commitTapeTransform = () => {
    const drag = tapeDragRef.current
    if (!drag) return
    const preview = tapePreviewRef.current
    tapeDragRef.current = null
    tapePreviewRef.current = null
    setTapePreview(null)
    if (!preview || preview.id !== drag.id) return
    const next = preview.geometry
    const previous = drag.geometry
    const changed =
      Math.abs(next.x - previous.x) > 0.0005 ||
      Math.abs(next.y - previous.y) > 0.0005 ||
      Math.abs(next.w - previous.w) > 0.0005 ||
      Math.abs(next.h - previous.h) > 0.0005 ||
      Math.abs(next.rotation - previous.rotation) > 0.1
    if (!changed) return
    const patch: Partial<Annotation> = {
      rects: [{ x: next.x, y: next.y, w: next.w, h: next.h }],
      rotation: next.rotation,
    }
    const target = annotations.find((annotation) => annotation.id === drag.id)
    if (target?.type === 'text' && drag.geometry.w > 0.01) {
      const scale = next.w / drag.geometry.w
      patch.fontSize = clamp(
        (target.fontSize ?? 0.024) * scale,
        0.008,
        0.24,
      )
    }
    onUpdateAnnotation(drag.id, patch)
  }

  const beginLasso = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return
    const point = pointFromClient(event.clientX, event.clientY)
    if (!point) return
    const hitsSelection =
      selectedIds.length > 0 &&
      annotations.some(
        (annotation) => selectedSet.has(annotation.id) && annotationHit(annotation, point),
      )
    event.currentTarget.setPointerCapture(event.pointerId)
    if (hitsSelection) {
      moveStartRef.current = point
      setMoveDelta({ x: 0, y: 0 })
      return
    }
    lassoRef.current = [point]
    setLassoPath([point])
  }

  const moveLasso = (event: ReactPointerEvent<HTMLDivElement>) => {
    const point = pointFromClient(event.clientX, event.clientY)
    if (!point) return
    const start = moveStartRef.current
    if (start) {
      setMoveDelta({ x: point.x - start.x, y: point.y - start.y })
      return
    }
    if (lassoRef.current.length === 0) return
    const last = lassoRef.current[lassoRef.current.length - 1]
    if (last && Math.hypot(last.x - point.x, last.y - point.y) < 0.002) return
    lassoRef.current = [...lassoRef.current, point]
    setLassoPath(lassoRef.current)
  }

  const finishLasso = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const start = moveStartRef.current
    if (start) {
      moveStartRef.current = null
      const point = pointFromClient(event.clientX, event.clientY)
      if (point && Math.hypot(point.x - start.x, point.y - start.y) > 0.0015) {
        onMoveSelected({ x: point.x - start.x, y: point.y - start.y })
      }
      setMoveDelta({ x: 0, y: 0 })
      return
    }
    const polygon = lassoRef.current
    if (polygon.length >= 3) {
      const ids = annotations
        .filter((annotation) => {
          const center = annotationCenter(annotation)
          const pointsInside = annotation.points?.some((point) =>
            pointInPolygon(point, polygon),
          )
          const rectsInside = annotation.rects?.some(
            (rect) =>
              pointInPolygon(rectCenter(rect), polygon) ||
              pointInPolygon({ x: rect.x, y: rect.y }, polygon) ||
              pointInPolygon({ x: rect.x + rect.w, y: rect.y + rect.h }, polygon),
          )
          return Boolean(
            pointsInside || rectsInside || (center && pointInPolygon(center, polygon)),
          )
        })
        .map((annotation) => annotation.id)
      onLassoSelect(ids)
    }
    lassoRef.current = []
    setLassoPath([])
  }

  const commitObjectDrag = (clientX: number, clientY: number) => {
    const drag = objectDragRef.current
    if (!drag) return
    const point = pointFromClient(clientX, clientY)
    objectDragRef.current = null
    const delta = point ? { x: point.x - drag.start.x, y: point.y - drag.start.y } : null
    setObjectDelta({ x: 0, y: 0 })
    if (delta && (Math.abs(delta.x) > 0.001 || Math.abs(delta.y) > 0.001)) {
      onMoveAnnotation(drag.id, delta)
    }
  }

  const beginObjectDrag = (
    event: ReactPointerEvent<Element>,
    annotation: Annotation,
  ) => {
    if (tool !== 'select') return
    event.stopPropagation()
    event.preventDefault()
    objectDragCleanupRef.current?.()
    onSelectObject(annotation.id)
    const point = pointFromClient(event.clientX, event.clientY)
    if (!point) return
    objectDragRef.current = { id: annotation.id, start: point }
    objectDragMovedRef.current = false
    setObjectDelta({ x: 0, y: 0 })
    const move = (pointerEvent: PointerEvent) => {
      const drag = objectDragRef.current
      if (!drag) return
      const current = pointFromClient(pointerEvent.clientX, pointerEvent.clientY)
      if (!current) return
      const delta = { x: current.x - drag.start.x, y: current.y - drag.start.y }
      if (Math.abs(delta.x) > 0.0015 || Math.abs(delta.y) > 0.0015) {
        objectDragMovedRef.current = true
      }
      setObjectDelta(delta)
    }
    const finish = (pointerEvent: PointerEvent) => {
      commitObjectDrag(pointerEvent.clientX, pointerEvent.clientY)
      cleanup()
    }
    const cancel = () => {
      objectDragRef.current = null
      setObjectDelta({ x: 0, y: 0 })
      cleanup()
    }
    const cleanup = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('mousemove', move as EventListener)
      window.removeEventListener('mouseup', finish as EventListener)
      objectDragCleanupRef.current = null
    }
    objectDragCleanupRef.current = cleanup
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('mousemove', move as EventListener)
    window.addEventListener('mouseup', finish as EventListener)
  }

  const eraseAtPoint = (point: NormPoint) => {
    const ordered = [...annotations].reverse()
    for (const annotation of ordered) {
      if (erasedIdsRef.current.has(annotation.id)) continue
      if (annotationHit(annotation, point)) {
        erasedIdsRef.current.add(annotation.id)
        onErase(annotation)
        return
      }
    }
  }

  const beginErase = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return
    const point = pointFromClient(event.clientX, event.clientY)
    if (!point) return
    event.currentTarget.setPointerCapture(event.pointerId)
    eraseRef.current = true
    erasedIdsRef.current.clear()
    eraseAtPoint(point)
  }

  const moveErase = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!eraseRef.current) return
    const point = pointFromClient(event.clientX, event.clientY)
    if (point) eraseAtPoint(point)
  }

  const finishErase = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!eraseRef.current) return
    eraseRef.current = false
    erasedIdsRef.current.clear()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleInteractionClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const point = pointFromClient(event.clientX, event.clientY)
    if (!point) return
    if (tool === 'note') {
      onAddNote(point)
      return
    }
    if (tool === 'text') {
      onAddText(point, size.height / Math.max(1, size.width))
      return
    }
    if (tool === 'image' || tool === 'chart') {
      onPlaceObject(point, size.height / Math.max(1, size.width))
      return
    }
    if (tool === 'guide') {
      onAddGuide(snapPoint(point), size.height / Math.max(1, size.width))
    }
  }

  const highlights = annotations.filter((annotation) => annotation.type === 'highlight')
  const interactive = tool === 'select'
  const boxHandles = (active: boolean) =>
    active ? (
      <>
        <span className="tape-handle tape-handle--nw" data-tape-handle="nw" />
        <span className="tape-handle tape-handle--n" data-tape-handle="n" />
        <span className="tape-handle tape-handle--ne" data-tape-handle="ne" />
        <span className="tape-handle tape-handle--e" data-tape-handle="e" />
        <span className="tape-handle tape-handle--se" data-tape-handle="se" />
        <span className="tape-handle tape-handle--s" data-tape-handle="s" />
        <span className="tape-handle tape-handle--sw" data-tape-handle="sw" />
        <span className="tape-handle tape-handle--w" data-tape-handle="w" />
        <span
          className="tape-rotate-handle"
          data-tape-handle="rotate"
          title={translate('چرخش (با Shift در ۱۵ درجه)', 'Rotate (Shift for 15° steps)')}
        />
      </>
    ) : null
  const moveStyle = (annotation: Annotation): CSSProperties | undefined => {
    if (!selectedSet.has(annotation.id)) return undefined
    if (!moveDelta.x && !moveDelta.y) return undefined
    return {
      transform: `translate(${moveDelta.x * size.width}px, ${moveDelta.y * size.height}px)`,
    }
  }
  const selectedClass = (annotation: Annotation): string =>
    selectedSet.has(annotation.id) ? ' is-lasso-selected' : ''

  return (
    <div ref={hostRef} className="pdf-host">
      <div
        ref={pageRef}
        className={`pdf-page pdf-page--tool-${tool}${
          isNotebook ? ' pdf-page--notebook' : ''
        } pdf-page--theme-${readingTheme}`}
        style={{ width: size.width || undefined, height: size.height || undefined }}
        onMouseUp={captureSelection}
        onTouchEnd={captureSelection}
        onPointerDown={(event) => {
          if (
            tool === 'select' &&
            activeObjectId &&
            !(event.target as HTMLElement).closest(
              '.tape-annotation, .text-annotation, .ink-layer',
            )
          ) {
            onSelectObject(null)
            if (selectedIds.length > 0) onLassoSelect([])
          }
        }}
        data-page={pageKey}
      >
        {isNotebook ? (
          <NotebookGrid notebook={notebook} width={size.width} height={size.height} />
        ) : (
          <canvas ref={canvasRef} className="pdf-canvas" />
        )}

        <div className="annotation-layer" aria-hidden={false}>
          {highlights.map((annotation) =>
            (annotation.rects ?? []).map((rect, index) => (
              <span
                key={`${annotation.id}-${index}`}
                className={`highlight-rect${selectedClass(annotation)}${
                  activeObjectId === annotation.id ? ' is-object-selected' : ''
                }`}
                style={{
                  left: `${rect.x * 100}%`,
                  top: `${rect.y * 100}%`,
                  width: `${rect.w * 100}%`,
                  height: `${rect.h * 100}%`,
                  background: annotation.color,
                  ...moveStyle(annotation),
                }}
                title={annotation.note || annotation.text}
              />
            )),
          )}

          <InkLayer
            annotations={annotations}
            activeObjectId={activeObjectId}
            interactive={interactive}
            objectDelta={objectDelta}
            size={size}
            selectedClass={selectedClass}
            moveStyle={moveStyle}
            beginObjectDrag={beginObjectDrag}
            draft={draft}
            draftPressures={draftPressures}
            penStyle={penStyle}
            penWidthScale={penWidthScale}
            color={color}
            highlightColor={highlightColor}
          />

          <ObjectLayer
            annotations={annotations}
            showCaptions={showText}
            tool={tool}
            activeObjectId={activeObjectId}
            selectedClass={selectedClass}
            moveStyle={moveStyle}
            tapeGeometryFor={tapeGeometryFor}
            boxHandles={boxHandles}
            beginTapeTransform={beginTapeTransform}
            onEditChart={onEditChart}
          />

          <TextAnnotations
            annotations={annotations}
            visible={showText}
            tool={tool}
            activeObjectId={activeObjectId}
            selectedClass={selectedClass}
            size={size}
            tapeGeometryFor={tapeGeometryFor}
            boxHandles={boxHandles}
            beginTapeTransform={beginTapeTransform}
            onEditText={onEditText}
          />

          <TapeLayer
            annotations={annotations}
            tool={tool}
            activeObjectId={activeObjectId}
            selectedClass={selectedClass}
            moveStyle={moveStyle}
            tapeGeometryFor={tapeGeometryFor}
            boxHandles={boxHandles}
            beginTapeTransform={beginTapeTransform}
          />

          <ShapeGuideLayer
            annotations={annotations}
            tool={tool}
            activeObjectId={activeObjectId}
            selectedClass={selectedClass}
            moveStyle={moveStyle}
            tapeGeometryFor={tapeGeometryFor}
            boxHandles={boxHandles}
            beginTapeTransform={beginTapeTransform}
            pageSize={size}
            pagePoints={pagePoints}
            shapePreview={shapeEndpointPreview}
          />

          <LinkNoteLayer
            annotations={annotations}
            showText={showText}
            interactive={interactive}
            activeObjectId={activeObjectId}
            selectedClass={selectedClass}
            moveStyle={moveStyle}
            selectedIds={selectedIds}
            moveDelta={moveDelta}
            size={size}
            onOpenLink={onOpenLink}
            onOpenAnnotation={(annotation) => {
              if (objectDragMovedRef.current) {
                objectDragMovedRef.current = false
                return
              }
              onOpenAnnotation(annotation)
            }}
            beginObjectDrag={beginObjectDrag}
            linkDraft={linkDraft}
            tapeDraft={tapeDraft}
            tapeColor={tapeColor}
            shapeDraft={shapeDraft}
            lassoPath={lassoPath}
          />
        </div>

        {!isNotebook && <div ref={textLayerRef} className="textLayer" />}

        {tool !== 'select' && tool !== 'highlight' && (
          <div
            className={`pdf-interaction pdf-interaction--${tool}`}
            onPointerDown={
              tool === 'pen' || tool === 'marker'
                ? beginStroke
                : tool === 'link'
                  ? beginLink
                  : tool === 'tape'
                    ? beginTape
                    : tool === 'lasso'
                      ? beginLasso
                      : tool === 'erase'
                        ? beginErase
                        : tool === 'shape'
                          ? beginShape
                          : tool === 'pan'
                            ? beginPan
                            : undefined
            }
            onPointerMove={
              tool === 'pen' || tool === 'marker'
                ? moveStroke
                : tool === 'link'
                  ? moveLink
                  : tool === 'tape'
                    ? moveTape
                    : tool === 'lasso'
                      ? moveLasso
                      : tool === 'erase'
                        ? moveErase
                        : tool === 'shape'
                          ? moveShape
                          : tool === 'pan'
                            ? movePan
                            : undefined
            }
            onPointerUp={
              tool === 'pen' || tool === 'marker'
                ? finishStroke
                : tool === 'link'
                  ? finishLink
                  : tool === 'tape'
                    ? finishTape
                    : tool === 'lasso'
                      ? finishLasso
                      : tool === 'erase'
                        ? finishErase
                        : tool === 'shape'
                          ? finishShape
                          : tool === 'pan'
                            ? finishPan
                            : undefined
            }
            onPointerCancel={
              tool === 'pen' || tool === 'marker'
                ? finishStroke
                : tool === 'link'
                  ? finishLink
                  : tool === 'tape'
                    ? finishTape
                    : tool === 'lasso'
                      ? finishLasso
                      : tool === 'erase'
                        ? finishErase
                        : tool === 'shape'
                          ? finishShape
                          : tool === 'pan'
                            ? finishPan
                            : undefined
            }
            onClick={
              tool === 'note' ||
              tool === 'image' ||
              tool === 'chart' ||
              tool === 'text' ||
              tool === 'guide'
                ? handleInteractionClick
                : undefined
            }
          />
        )}

        {rendering && (
          <div className="page-loading">
            <span className="spinner" />
            <em>{translate('در حال آماده‌سازی صفحه…', 'Preparing page…')}</em>
          </div>
        )}
      </div>
    </div>
  )
}
