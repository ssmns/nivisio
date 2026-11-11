import { getLang } from './lang'
import {
  PAGE_SIZES,
  type Annotation,
  AnnotationType,
  ChartConfig,
  DocumentKind,
  LogicalPage,
  NormPoint,
  NormRect,
  NotebookPage,
  PenStyle,
  type BnoteDocument,
} from './types'

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('خواندن فایل ناموفق بود.'))
    reader.readAsDataURL(blob)
  })
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value))
}

function englishUi(): boolean {
  return getLang() === 'en'
}

export function localizedName(item: { name: string; nameEn?: string }): string {
  return englishUi() && item.nameEn ? item.nameEn : item.name
}

export function pageSizeName(key: keyof typeof PAGE_SIZES | undefined): string {
  const preset = PAGE_SIZES[key ?? 'a4'] ?? PAGE_SIZES.a4
  return localizedName(preset)
}

export function formatBytes(bytes: number): string {
  const en = englishUi()
  if (!bytes) return en ? '0 KB' : '۰ کیلوبایت'
  const units = en
    ? ['B', 'KB', 'MB', 'GB']
    : ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / 1024 ** i
  const fixed = value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)
  return `${toFa(fixed)} ${units[i]}`
}

export function toFa(input: number | string): string {
  if (englishUi()) return String(input)
  return String(input).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
}

export function formatDate(ts?: number): string {
  if (!ts) return '—'
  try {
    return new Intl.DateTimeFormat(englishUi() ? 'en-US' : 'fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(ts))
  } catch {
    return '—'
  }
}

export function formatRelative(ts?: number): string {
  const en = englishUi()
  if (!ts) return en ? 'Not opened yet' : 'هنوز باز نشده'
  const diff = Date.now() - ts
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return en ? 'Just now' : 'همین حالا'
  if (diff < hour) return `${toFa(Math.floor(diff / minute))} ${en ? 'min ago' : 'دقیقه پیش'}`
  if (diff < day) return `${toFa(Math.floor(diff / hour))} ${en ? 'hr ago' : 'ساعت پیش'}`
  if (diff < 7 * day) return `${toFa(Math.floor(diff / day))} ${en ? 'days ago' : 'روز پیش'}`
  return formatDate(ts)
}

export function progressLabel(progress: number): string {
  const en = englishUi()
  const percent = Math.round(progress * 100)
  if (percent <= 0) return en ? 'Not started' : 'خوانده نشده'
  if (percent >= 100) return en ? 'Completed' : 'تمام شده'
  return en ? `${percent}% read` : `${toFa(percent)}٪ خوانده شده`
}

export function sortAnnotations(list: Annotation[]): Annotation[] {
  return [...list].sort((a, b) => a.page - b.page || a.createdAt - b.createdAt)
}

export function annotationLabel(a: Annotation): string {
  const en = englishUi()
  if (a.type === 'highlight') return en ? 'Text highlight' : 'هایلایت متن'
  if (a.type === 'ink') return penLabel(a.penStyle)
  if (a.type === 'image') return en ? 'Image' : 'تصویر'
  if (a.type === 'chart') return en ? 'Chart' : 'نمودار'
  if (a.type === 'link') return en ? 'Link' : 'پیوند'
  if (a.type === 'tape') return en ? 'Tape' : 'نوار چسب'
  if (a.type === 'text') return en ? 'Text' : 'متن'
  if (a.type === 'shape') return en ? 'Shape' : 'شکل'
  if (a.type === 'guide') return en ? 'Guide' : 'ابزار اندازه'
  return en ? 'Note' : 'یادداشت'
}

export function annotationTypeLabel(type: AnnotationType): string {
  if (type === 'highlight') return 'هایلایت'
  if (type === 'ink') return 'قلم'
  if (type === 'image') return 'تصویر'
  if (type === 'chart') return 'نمودار'
  if (type === 'link') return 'پیوند'
  if (type === 'tape') return 'نوار'
  if (type === 'text') return 'متن'
  if (type === 'shape') return 'شکل'
  if (type === 'guide') return 'راهنما'
  return 'یادداشت'
}

export function penLabel(style?: PenStyle): string {
  const en = englishUi()
  switch (style) {
    case 'pencil':
      return en ? 'Pencil' : 'مداد'
    case 'brush':
      return en ? 'Soft brush' : 'قلم نرم'
    case 'fountain':
      return en ? 'Fountain' : 'قلم نی'
    case 'marker':
      return en ? 'Marker' : 'ماژیک'
    case 'dashed':
      return en ? 'Dashed' : 'خط‌چین'
    default:
      return en ? 'Pen' : 'خودکار'
  }
}

export function pressureWidth(
  baseWidth: number,
  pressure: number | undefined,
  style: PenStyle | undefined,
): number {
  const p = pressure === undefined || Number.isNaN(pressure) ? 0.55 : pressure
  if (style === 'marker') return baseWidth * (0.8 + p * 0.45)
  if (style === 'brush') return baseWidth * (0.35 + p * 1.65)
  if (style === 'fountain') return baseWidth * (0.25 + p * 1.3)
  if (style === 'pencil') return baseWidth * (0.65 + p * 0.55)
  return baseWidth * (0.55 + p * 0.7)
}

export function strokeDash(style: PenStyle | undefined, baseWidth: number): string | undefined {
  if (style !== 'dashed') return undefined
  const width = baseWidth * 100
  return `${width * 2.4} ${width * 1.6}`
}

export function buildLogicalPages(
  pdfPageCount: number,
  notebookPages: NotebookPage[],
  kind: DocumentKind = 'pdf',
): LogicalPage[] {
  const notes = [...notebookPages].sort(
    (a, b) => a.afterPage - b.afterPage || a.order - b.order,
  )
  if (kind === 'note') {
    return notes.map((page) => ({
      key: `note:${page.id}`,
      kind: 'note',
      notebook: page,
    }))
  }
  const pages: LogicalPage[] = []
  const pushNotes = (afterPage: number) => {
    for (const page of notes) {
      if (page.afterPage === afterPage) {
        pages.push({ key: `note:${page.id}`, kind: 'note', notebook: page })
      }
    }
  }

  pushNotes(0)
  for (let index = 1; index <= Math.max(1, pdfPageCount); index += 1) {
    pages.push({ key: `pdf:${index}`, kind: 'pdf', pdfPage: index })
    pushNotes(index)
  }
  return pages
}

export function findPageIndex(pages: LogicalPage[], key: string | undefined): number {
  if (!key) return 0
  const index = pages.findIndex((page) => page.key === key)
  return index >= 0 ? index : 0
}

export function pageDisplayLabel(
  page: LogicalPage,
  index: number,
  pages?: LogicalPage[],
): string {
  const en = englishUi()
  if (page.kind === 'pdf') return `PDF ${toFa(page.pdfPage ?? 1)}`
  if (pages) {
    const noteNumber = pages
      .slice(0, index + 1)
      .filter((item) => item.kind === 'note').length
    return en ? `Note ${toFa(noteNumber)}` : `یادداشت ${toFa(noteNumber)}`
  }
  return en ? 'Note page' : 'برگه یادداشت'
}

export function coverPresetDataUrl(preset: {
  from: string
  to: string
  shape: string
}): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 820">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${preset.from}"/>
        <stop offset="1" stop-color="${preset.to}"/>
      </linearGradient>
    </defs>
    <rect width="600" height="820" fill="url(#g)"/>
    <circle cx="500" cy="120" r="220" fill="${preset.shape}" opacity=".12"/>
    <circle cx="90" cy="730" r="260" fill="${preset.shape}" opacity=".08"/>
    <path d="M80 620 C 190 500, 300 720, 520 560" fill="none" stroke="${preset.shape}" stroke-width="5" opacity=".5"/>
    <rect x="80" y="120" width="180" height="14" rx="7" fill="${preset.shape}" opacity=".75"/>
    <rect x="80" y="150" width="110" height="10" rx="5" fill="${preset.shape}" opacity=".45"/>
    <rect x="80" y="660" width="240" height="10" rx="5" fill="${preset.shape}" opacity=".35"/>
    <rect x="80" y="680" width="160" height="10" rx="5" fill="${preset.shape}" opacity=".25"/>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function imageFileToDataUrl(file: File, maxSize = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('خواندن تصویر ناموفق بود.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('فرمت تصویر پشتیبانی نمی‌شود.'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(img.width * scale))
        canvas.height = Math.max(1, Math.round(img.height * scale))
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas 2D در دسترس نیست.'))
          return
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const keepsAlpha = /png|webp|gif|svg/i.test(file.type)
        resolve(
          keepsAlpha
            ? canvas.toDataURL('image/png')
            : canvas.toDataURL('image/jpeg', 0.88),
        )
      }
      img.src = String(reader.result ?? '')
    }
    reader.readAsDataURL(file)
  })
}

export function clampRect(rect: NormRect): NormRect {
  const w = clamp(rect.w, 0.06, 1)
  const h = clamp(rect.h, 0.04, 1)
  return {
    x: clamp(rect.x, 0, 1 - w),
    y: clamp(rect.y, 0, 1 - h),
    w,
    h,
  }
}

export function makeRectCentered(
  point: NormPoint,
  width: number,
  height: number,
): NormRect {
  // Objects may intentionally extend past the page edge; the page clips them.
  return {
    x: point.x - width / 2,
    y: point.y - height / 2,
    w: clamp(width, 0.01, 2),
    h: clamp(height, 0.01, 2),
  }
}

export function chartLabel(config: ChartConfig | undefined): string {
  const en = englishUi()
  if (!config) return en ? 'Chart' : 'نمودار'
  if (config.kind === 'bar') return en ? 'Bar chart' : 'نمودار میله‌ای'
  if (config.kind === 'line') return en ? 'Line chart' : 'نمودار خطی'
  return en ? 'Pie chart' : 'نمودار دایره‌ای'
}

export function linkLabel(annotation: Annotation): string {
  const en = englishUi()
  if (annotation.link?.label) return annotation.link.label
  if (annotation.link?.kind === 'external') return annotation.link.url ?? (en ? 'External link' : 'پیوند بیرونی')
  if (annotation.link?.kind === 'page') return en ? 'Link to page' : 'پیوند به صفحه'
  if (annotation.link?.kind === 'document') return en ? 'Link to document' : 'پیوند به سند دیگر'
  return en ? 'Link' : 'پیوند'
}

export function categoryLabel(category?: string): string {
  const value = category ?? 'عمومی'
  if (!englishUi()) return value
  const map: Record<string, string> = {
    'عمومی': 'General',
    'مهم': 'Important',
    'مرور': 'Review',
    'سؤال': 'Question',
    'ایده': 'Idea',
  }
  return map[value] ?? value
}

export function isSafeExternalUrl(value: string): boolean {
  return /^(https?:\/\/|mailto:)/i.test(value.trim())
}

export function hitTestRect(rects: NormRect[] | undefined, p: NormPoint): boolean {
  if (!rects) return false
  return rects.some(
    (r) =>
      p.x >= r.x - 0.004 &&
      p.x <= r.x + r.w + 0.004 &&
      p.y >= r.y - 0.004 &&
      p.y <= r.y + r.h + 0.004,
  )
}

export function rectCenter(rect: NormRect): NormPoint {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }
}

export function annotationCenter(annotation: Annotation): NormPoint | null {
  if (annotation.rects?.length) {
    const rect = annotation.rects[annotation.rects.length - 1]
    return rectCenter(rect)
  }
  const points = annotation.points ?? []
  if (points.length === 0) return null
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  }
}

export function pointInPolygon(point: NormPoint, polygon: NormPoint[]): boolean {
  if (polygon.length < 3) return false
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || Number.EPSILON) + xi
    if (intersects) inside = !inside
  }
  return inside
}

export function annotationHit(annotation: Annotation, point: NormPoint): boolean {
  if (annotation.type === 'note') {
    const notePoint = annotation.points?.[0]
    return Boolean(
      notePoint && Math.hypot(notePoint.x - point.x, notePoint.y - point.y) < 0.035,
    )
  }
  if (annotation.type === 'ink') return hitTestInk(annotation.points, point, 0.022)
  return hitTestRect(annotation.rects, point)
}

export function hitTestInk(
  points: NormPoint[] | undefined,
  p: NormPoint,
  tolerance = 0.018,
): boolean {  if (!points || points.length === 0) return false
  if (points.length === 1) {
    return Math.hypot(points[0].x - p.x, points[0].y - p.y) <= tolerance
  }
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]
    const b = points[i]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const lenSq = dx * dx + dy * dy
    let t = lenSq === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
    t = clamp(t)
    const px = a.x + t * dx
    const py = a.y + t * dy
    if (Math.hypot(p.x - px, p.y - py) <= tolerance) return true
  }
  return false
}

export function pointsToPath(points: NormPoint[]): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${(point.x * 100).toFixed(3)} ${(point.y * 100).toFixed(3)}`)
    .join(' ')
}

export function truncate(value: string, max = 120): string {
  const text = value.replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max)}…` : text
}


export function documentPageSize(doc: BnoteDocument): { width: number; height: number } {
  const fallback = PAGE_SIZES[doc.pageSize ?? 'a4'] ?? PAGE_SIZES.a4
  return {
    width: doc.pageWidth ?? fallback.width,
    height: doc.pageHeight ?? fallback.height,
  }
}

export function documentPageSizeLabel(doc: BnoteDocument): string {
  const size = documentPageSize(doc)
  if (doc.pageSize === 'custom') {
    return `${Math.round((size.width / 72) * 25.4)} × ${Math.round(
      (size.height / 72) * 25.4,
    )} mm`
  }
  const preset = PAGE_SIZES[doc.pageSize ?? 'a4'] ?? PAGE_SIZES.a4
  const orientation =
    size.width > size.height
      ? englishUi()
        ? 'Landscape'
        : 'افقی'
      : englishUi()
        ? 'Portrait'
        : 'عمودی'
  return `${localizedName(preset)} · ${orientation}`
}


export function snapToStep(point: NormPoint, stepX: number, stepY: number): NormPoint {
  return {
    x: Math.round(point.x / stepX) * stepX,
    y: Math.round(point.y / stepY) * stepY,
  }
}

export function polygonPoints(sides: number): string {
  const count = Math.max(3, Math.min(24, Math.round(sides)))
  const points: string[] = []
  for (let i = 0; i < count; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / count
    points.push(`${50 + Math.cos(angle) * 44},${50 + Math.sin(angle) * 44}`)
  }
  return points.join(' ')
}

export function starPoints(pointsCount: number, innerRatio = 0.45): string {
  const count = Math.max(3, Math.min(24, Math.round(pointsCount)))
  const points: string[] = []
  for (let i = 0; i < count * 2; i += 1) {
    const radius = i % 2 === 0 ? 44 : 44 * innerRatio
    const angle = -Math.PI / 2 + (i * Math.PI) / count
    points.push(`${50 + Math.cos(angle) * radius},${50 + Math.sin(angle) * radius}`)
  }
  return points.join(' ')
}
