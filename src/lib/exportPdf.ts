import { PDFDocument } from 'pdf-lib'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { drawChartOnCanvas } from './chart'
import { pdfjs } from './pdf'
import { translate } from './lang'
import type {
  Annotation,
  ChartConfig,
  NormRect,
  NotebookPage,
  PenStyle,
} from './types'
import { blobToBase64, pressureWidth, strokeDash } from './utils'
import { drawShapeAnnotation } from './exportShape'
import { wrapText } from './wrapText'

const RENDER_WIDTH = 1100

interface ExportOptions {
  pdf?: pdfjs.PDFDocumentProxy
  pages: { key: string; kind: 'pdf' | 'note'; pdfPage?: number; notebook?: NotebookPage }[]
  annotations: Annotation[]
  title: string
  notebookSize?: { width: number; height: number }
  onProgress?: (done: number, total: number) => void
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('ساخت تصویر صفحه ناموفق بود.'))
          return
        }
        blob.arrayBuffer().then(resolve).catch(reject)
      },
      'image/jpeg',
      0.9,
    )
  })
}

function attachCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
} {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(translate('Canvas 2D در دسترس نیست.', 'Canvas 2D is not available.'))
  return { canvas, ctx }
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: NotebookPage['grid'],
  width: number,
  height: number,
  scale = 1,
): void {
  const unit = width / 595
  ctx.fillStyle = '#fffdf8'
  ctx.fillRect(0, 0, width, height)

  const line = (x1: number, y1: number, x2: number, y2: number, color: string, widthPx = 1) => {
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = widthPx
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  if (grid === 'grid' || grid === 'graph' || grid === 'cornell') {
    const gap = (grid === 'graph' ? 15 : 28) * unit * scale
    ctx.strokeStyle = grid === 'graph' ? '#e8edf5' : '#e1e6ee'
    ctx.lineWidth = 1
    for (let x = gap; x < width; x += gap) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = gap; y < height; y += gap) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  if (grid === 'lined' || grid === 'cornell') {
    const gap = 32 * unit * scale
    for (let y = 48 * unit; y < height; y += gap) {
      line(0, y, width, y, '#dfe6f0', 1)
    }
    line(52 * unit, 0, 52 * unit, height, '#f0c4c4', 1.5)
  }

  if (grid === 'dots') {
    const gap = 26 * unit * scale
    ctx.fillStyle = '#cbd4e2'
    for (let y = gap; y < height; y += gap) {
      for (let x = gap; x < width; x += gap) {
        ctx.beginPath()
        ctx.arc(x, y, 1.2 * unit, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  if (grid === 'cornell') {
    line(0, height * 0.74, width, height * 0.74, '#e2b7b7', 1.5)
    line(width * 0.32, 0, width * 0.32, height * 0.74, '#e2b7b7', 1.5)
  }

  if (grid === 'isometric') {
    const gap = 34 * unit * scale
    const slope = Math.tan(Math.PI / 3)
    ctx.strokeStyle = '#e1e6ee'
    ctx.lineWidth = 1
    for (let x = -height * slope; x < width + height * slope; x += gap) {
      ctx.beginPath()
      ctx.moveTo(x, height)
      ctx.lineTo(x + height * slope, 0)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + height * slope, height)
      ctx.stroke()
    }
  }

  if (grid === 'circular') {
    const cx = width / 2
    const cy = height / 2
    const gap = 38 * unit * scale
    const maxRadius = Math.hypot(width, height) / 2
    ctx.strokeStyle = '#dfe6f0'
    ctx.lineWidth = 1
    for (let r = gap; r < maxRadius; r += gap) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + Math.cos(angle) * maxRadius, cy + Math.sin(angle) * maxRadius)
      ctx.stroke()
    }
  }

  if (grid === 'blank') {
    ctx.strokeStyle = '#ece7dc'
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1)
  }
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

async function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: Annotation,
  width: number,
  height: number,
): Promise<void> {
  const rectPx = (rect: NormRect) => ({
    x: rect.x * width,
    y: rect.y * height,
    w: rect.w * width,
    h: rect.h * height,
  })

  if (annotation.type === 'highlight') {
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.fillStyle = annotation.color
    for (const rect of annotation.rects ?? []) {
      const r = rectPx(rect)
      ctx.fillRect(r.x, r.y, r.w, r.h)
    }
    ctx.restore()
    return
  }

  if (annotation.type === 'ink') {
    const points = annotation.points ?? []
    if (points.length < 2) return
    const style = (annotation.penStyle ?? 'pen') as PenStyle
    const base = annotation.strokeWidth ?? 0.0026
    ctx.save()
    ctx.globalAlpha = annotation.opacity ?? (style === 'marker' ? 0.34 : 1)
    if (style === 'marker') ctx.globalCompositeOperation = 'multiply'
    ctx.strokeStyle = annotation.color
    ctx.lineCap = style === 'marker' ? 'butt' : 'round'
    ctx.lineJoin = 'round'
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1]
      const point = points[index]
      const pressure = annotation.pressures?.[index] ?? annotation.pressures?.[index - 1] ?? 0.55
      ctx.beginPath()
      ctx.lineWidth = pressureWidth(base, pressure, style) * width
      ctx.setLineDash(
        (strokeDash(style, base) ?? '')
          .split(' ')
          .filter(Boolean)
          .map((value) => Number(value) * width),
      )
      ctx.moveTo(previous.x * width, previous.y * height)
      ctx.lineTo(point.x * width, point.y * height)
      ctx.stroke()
    }
    ctx.restore()
    return
  }

  if (annotation.type === 'image' && annotation.image) {
    const rect = annotation.rects?.[0]
    if (!rect) return
    const r = rectPx(rect)
    const img = new Image()
    await new Promise<void>((resolve) => {
      img.onload = () => resolve()
      img.onerror = () => resolve()
      img.src = annotation.image ?? ''
    })
    if (!img.naturalWidth) return
    const angle = ((annotation.rotation ?? 0) * Math.PI) / 180
    const scale = Math.min(r.w / img.naturalWidth, r.h / img.naturalHeight)
    const drawWidth = img.naturalWidth * scale
    const drawHeight = img.naturalHeight * scale
    ctx.save()
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2)
    ctx.rotate(angle)
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
    ctx.restore()
    return
  }

  if (annotation.type === 'chart' && annotation.chart) {
    const rect = annotation.rects?.[0]
    if (!rect) return
    const r = rectPx(rect)
    const angle = ((annotation.rotation ?? 0) * Math.PI) / 180
    ctx.save()
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2)
    ctx.rotate(angle)
    drawChartOnCanvas(
      ctx,
      annotation.chart as ChartConfig,
      -r.w / 2,
      -r.h / 2,
      r.w,
      r.h,
    )
    ctx.restore()
    return
  }

  if (annotation.type === 'tape') {
    const rect = annotation.rects?.[0]
    if (!rect) return
    const r = rectPx(rect)
    const angle = ((annotation.rotation ?? 0) * Math.PI) / 180
    ctx.save()
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2)
    ctx.rotate(angle)
    ctx.globalAlpha = annotation.opacity ?? 0.9
    ctx.fillStyle = annotation.color
    ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h)
    ctx.globalAlpha = 0.22
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = Math.max(2, width * 0.006)
    for (let x = -r.w / 2 - r.h; x < r.w / 2; x += width * 0.018) {
      ctx.beginPath()
      ctx.moveTo(x, r.h / 2)
      ctx.lineTo(x + r.h, -r.h / 2)
      ctx.stroke()
    }
    ctx.restore()
    return
  }

  if (annotation.type === 'text' && annotation.text) {
    const rect = annotation.rects?.[0]
    if (!rect) return
    const r = rectPx(rect)
    const fontSize = (annotation.fontSize ?? 0.024) * width
    ctx.save()
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2)
    ctx.rotate(((annotation.rotation ?? 0) * Math.PI) / 180)
    ctx.fillStyle = annotation.color
    const bold = annotation.textStyle?.includes('bold') ? 700 : 500
    const italic = annotation.textStyle?.includes('italic') ? 'italic ' : ''
    ctx.font = `${italic}${bold} ${fontSize}px Vazirmatn, Tahoma, sans-serif`
    ctx.direction = /[\u0600-\u06FF]/.test(annotation.text) ? 'rtl' : 'ltr'
    const align = annotation.textAlign ?? 'right'
    ctx.textAlign = align
    const x = align === 'right' ? r.w / 2 - 4 : align === 'center' ? 0 : -r.w / 2 + 4
    const lines = wrapText(ctx, annotation.text, r.w - 8, 30)
    const totalHeight = lines.length * fontSize * 1.6
    const vertical = annotation.verticalAlign ?? 'top'
    const firstBaseline =
      vertical === 'middle'
        ? -totalHeight / 2 + fontSize * 1.1
        : vertical === 'bottom'
          ? r.h / 2 - totalHeight + fontSize * 1.1
          : -r.h / 2 + fontSize * 1.1
    lines.forEach((line, index) => {
      ctx.fillText(line, x, firstBaseline + index * fontSize * 1.6)
    })
    ctx.restore()
    return
  }

  if (annotation.type === 'shape' && annotation.shape) {
    const rect = annotation.rects?.[0]
    if (!rect) return
    drawShapeAnnotation(ctx, annotation, width, rectPx(rect))
    return
  }

  if (annotation.type === 'link') {
    const rect = annotation.rects?.[0]
    if (!rect) return
    const r = rectPx(rect)
    ctx.save()
    ctx.fillStyle = 'rgba(225, 29, 72, 0.12)'
    ctx.strokeStyle = '#e11d48'
    ctx.lineWidth = 1.4
    ctx.setLineDash([6, 4])
    ctx.fillRect(r.x, r.y, r.w, r.h)
    ctx.strokeRect(r.x, r.y, r.w, r.h)
    ctx.setLineDash([])
    ctx.fillStyle = '#9f1239'
    ctx.font = `600 ${Math.max(12, width * 0.016)}px Vazirmatn, Tahoma, sans-serif`
    ctx.textAlign = 'right'
    const label =
      annotation.link?.label || annotation.link?.url || translate('پیوند', 'Link')
    ctx.fillText(
      wrapText(ctx, label, r.w - 12, 1)[0] ?? translate('پیوند', 'Link'),
      r.x + r.w - 6,
      r.y + Math.min(r.h - 6, 20),
    )
    ctx.restore()
    return
  }

  if (annotation.type === 'note') {
    const point = annotation.points?.[0]
    if (!point) return
    const cx = point.x * width
    const cy = point.y * height
    const pinRadius = Math.max(9, width * 0.011)
    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = annotation.color
    ctx.arc(cx, cy, pinRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.stroke()

    if (annotation.note) {
      const fontSize = Math.max(11, width * 0.014)
      ctx.font = `400 ${fontSize}px Vazirmatn, Tahoma, sans-serif`
      const boxWidth = Math.min(width * 0.42, 260)
      const lines = wrapText(ctx, annotation.note, boxWidth - 18, 4)
      const boxHeight = 16 + lines.length * fontSize * 1.6
      let bx = cx + pinRadius + 6
      if (bx + boxWidth > width - 8) bx = cx - pinRadius - 6 - boxWidth
      let by = cy - boxHeight / 2
      by = Math.max(8, Math.min(height - boxHeight - 8, by))
      ctx.fillStyle = 'rgba(255, 249, 224, 0.96)'
      ctx.strokeStyle = annotation.color
      ctx.lineWidth = 1.5
      roundedRect(ctx, bx, by, boxWidth, boxHeight, 6)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#4b3f16'
      ctx.direction = /[\u0600-\u06FF]/.test(annotation.note) ? 'rtl' : 'ltr'
      ctx.textAlign = 'right'
      lines.forEach((line, index) => {
        ctx.fillText(line, bx + boxWidth - 9, by + fontSize * 1.4 + index * fontSize * 1.55)
      })
    }
    ctx.restore()
  }
}

export async function exportAnnotatedPdf({
  pdf,
  pages,
  annotations,
  title,
  notebookSize,
  onProgress,
}: ExportOptions): Promise<Blob> {
  if (document.fonts?.ready) await document.fonts.ready
  const out = await PDFDocument.create()
  out.setTitle(title)
  out.setCreator('nivisio')
  const noteWidth = notebookSize?.width ?? 595
  const noteHeight = notebookSize?.height ?? 842

  for (let index = 0; index < pages.length; index += 1) {
    const pageInfo = pages[index]
    const pageAnnotations = annotations.filter((item) => item.pageRef === pageInfo.key)
    let width = RENDER_WIDTH
    let height = Math.round((noteHeight / noteWidth) * RENDER_WIDTH)
    let pointsWidth = noteWidth
    let pointsHeight = noteHeight
    let ctx: CanvasRenderingContext2D
    let canvas: HTMLCanvasElement

    if (pageInfo.kind === 'pdf' && pageInfo.pdfPage) {
      if (!pdf) throw new Error(translate('فایل PDF برای خروجی در دسترس نیست.', 'The PDF file is not available for export.'))
      const page = await pdf.getPage(pageInfo.pdfPage)
      const base = page.getViewport({ scale: 1 })
      const scale = RENDER_WIDTH / base.width
      const viewport = page.getViewport({ scale })
      width = Math.round(viewport.width)
      height = Math.round(viewport.height)
      pointsWidth = base.width
      pointsHeight = base.height
      const created = attachCanvas(width, height)
      canvas = created.canvas
      ctx = created.ctx
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      await page.render({ canvasContext: ctx, viewport }).promise
    } else {
      const created = attachCanvas(width, height)
      canvas = created.canvas
      ctx = created.ctx
      drawGrid(
        ctx,
        pageInfo.notebook?.grid ?? 'lined',
        width,
        height,
        pageInfo.notebook?.gridScale ?? 1,
      )
    }

    for (const annotation of pageAnnotations) {
      if (annotation.type === 'guide') continue
      await drawAnnotation(ctx, annotation, width, height)
    }

    const jpeg = await canvasToJpeg(canvas)
    const image = await out.embedJpg(jpeg)
    const page = out.addPage([pointsWidth, pointsHeight])
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: pointsWidth,
      height: pointsHeight,
    })
    onProgress?.(index + 1, pages.length)
  }

  const bytes = await out.save()
  const copy = new Uint8Array(bytes.length)
  copy.set(bytes)
  return new Blob([copy], { type: 'application/pdf' })
}

export async function saveBlobAsFile(blob: Blob, fileName: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(blob)
    const written = await Filesystem.writeFile({
      path: `nivisio/${fileName}`,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    })
    await Share.share({
      title: fileName,
      url: written.uri,
      dialogTitle: translate('ذخیره یا اشتراک فایل PDF', 'Save or share PDF'),
    })
    return
  }
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function exportFileName(title: string): string {
  const clean = title.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'nivisio'
  return `${clean}-nivisio.pdf`
}
