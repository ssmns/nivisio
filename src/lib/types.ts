export type DocStatus = 'unread' | 'reading' | 'done'
export type DocumentKind = 'pdf' | 'note'
export type PageSizeKey = 'a4' | 'a5' | 'b5' | 'letter' | 'square' | 'custom'
export type PageOrientation = 'portrait' | 'landscape'

export const PAGE_SIZES: Record<
  PageSizeKey,
  { name: string; nameEn: string; width: number; height: number }
> = {
  a4: { name: 'A4', nameEn: 'A4', width: 595, height: 842 },
  a5: { name: 'A5', nameEn: 'A5', width: 420, height: 595 },
  b5: { name: 'B5', nameEn: 'B5', width: 499, height: 709 },
  letter: { name: 'Letter', nameEn: 'Letter', width: 612, height: 792 },
  square: { name: 'مربع', nameEn: 'Square', width: 700, height: 700 },
  custom: { name: 'دلخواه', nameEn: 'Custom', width: 595, height: 842 },
}

export interface BnoteDocument {
  id: string
  kind?: DocumentKind
  pageSize?: PageSizeKey
  pageWidth?: number
  pageHeight?: number
  pageOrientation?: PageOrientation
  defaultGrid?: GridType
  defaultGridScale?: number
  title: string
  author: string
  fileName: string
  size: number
  pageCount: number
  cover?: string
  autoCover?: string
  collectionId?: string
  tags: string[]
  favorite: number
  status: DocStatus
  lastPage: number
  lastKey?: string
  bookmarkKey?: string
  readPages?: Record<string, boolean>
  progress: number
  addedAt: number
  lastReadAt?: number
  openedCount: number
}

export interface StoredFile {
  id: string
  data: Blob
}

export interface Collection {
  id: string
  name: string
  color: string
  createdAt: number
}

export type GridType =
  | 'blank'
  | 'lined'
  | 'grid'
  | 'dots'
  | 'graph'
  | 'cornell'
  | 'isometric'
  | 'tri30'
  | 'circular'

export interface NotebookPage {
  id: string
  docId: string
  /** Inserted after this PDF page (0 = before the first PDF page). */
  afterPage: number
  order: number
  grid: GridType
  gridScale?: number
  title?: string
  createdAt: number
  updatedAt: number
}

export type AnnotationType =
  | 'highlight'
  | 'ink'
  | 'note'
  | 'image'
  | 'chart'
  | 'link'
  | 'tape'
  | 'text'
  | 'shape'
  | 'guide'

export type TextAlign = 'right' | 'left' | 'center'
export type TextVerticalAlign = 'top' | 'middle' | 'bottom'
export type TextStyle = 'normal' | 'bold' | 'italic' | 'bold-italic'

export type PenStyle = 'pen' | 'pencil' | 'brush' | 'marker' | 'fountain' | 'dashed'

export interface PenModel {
  id: PenStyle
  name: string
  nameEn: string
  hint: string
  hintEn: string
  width: number
  opacity: number
}

export interface NormRect {
  x: number
  y: number
  w: number
  h: number
}

export interface NormPoint {
  x: number
  y: number
}

export type ChartKind = 'bar' | 'line' | 'pie'

export interface ChartConfig {
  kind: ChartKind
  title: string
  labels: string[]
  values: number[]
  color: string
  /** Hex color or `transparent`. */
  background?: string
}

export type LinkKind = 'external' | 'page' | 'document'

export type ShapeKind =
  | 'line'
  | 'arrow'
  | 'rect'
  | 'ellipse'
  | 'circle'
  | 'triangle'
  | 'polygon'
  | 'star'

export interface ShapeConfig {
  kind: ShapeKind
  sides?: number
  filled?: boolean
  strokeWidth?: number
  flipX?: boolean
  flipY?: boolean
}

export type GuideKind = 'ruler' | 'protractor' | 'triangle'

export interface GuideConfig {
  kind: GuideKind
  label?: string
}

export interface LinkInfo {
  kind: LinkKind
  url?: string
  pageKey?: string
  docId?: string
  page?: number
  label?: string
}

export interface Annotation {
  id: string
  docId: string
  /** Unified page reference: `pdf:3` or `note:<notebookPageId>`. */
  pageRef: string
  /** PDF page number for backwards compatibility; 0 for notebook pages. */
  page: number
  type: AnnotationType
  color: string
  category?: string
  sortIndex?: number
  rects?: NormRect[]
  points?: NormPoint[]
  pressures?: number[]
  strokeWidth?: number
  penStyle?: PenStyle
  opacity?: number
  /** Clockwise rotation in degrees, used by tape strips (and future objects). */
  rotation?: number
  text?: string
  fontSize?: number
  textAlign?: TextAlign
  verticalAlign?: TextVerticalAlign
  textStyle?: TextStyle
  note?: string
  image?: string
  chart?: ChartConfig
  link?: LinkInfo
  shape?: ShapeConfig
  guide?: GuideConfig
  createdAt: number
  updatedAt: number
}

export type ReaderTool =
  | 'select'
  | 'highlight'
  | 'marker'
  | 'pen'
  | 'note'
  | 'image'
  | 'chart'
  | 'link'
  | 'tape'
  | 'lasso'
  | 'text'
  | 'shape'
  | 'guide'
  | 'erase'

export type ViewMode = 'single' | 'spread' | 'continuous'
export type FitMode = 'width' | 'height'
export type ReaderTheme = 'normal' | 'dim' | 'dark'

export interface LogicalPage {
  key: string
  kind: 'pdf' | 'note'
  pdfPage?: number
  notebook?: NotebookPage
}

export const HIGHLIGHT_COLORS = [
  { name: 'زرد', nameEn: 'Yellow', value: '#f7d154' },
  { name: 'سبز', nameEn: 'Green', value: '#63d9a5' },
  { name: 'آبی', nameEn: 'Blue', value: '#7ab8ff' },
  { name: 'صورتی', nameEn: 'Pink', value: '#ff9ec4' },
  { name: 'نارنجی', nameEn: 'Orange', value: '#ffb066' },
] as const

export const INK_COLORS = [
  { name: 'مشکی', nameEn: 'Black', value: '#232433' },
  { name: 'آبی', nameEn: 'Blue', value: '#3659d6' },
  { name: 'قرمز', nameEn: 'Red', value: '#d64545' },
  { name: 'سبز', nameEn: 'Green', value: '#16875f' },
  { name: 'بنفش', nameEn: 'Purple', value: '#6b4bd6' },
  { name: 'نارنجی', nameEn: 'Orange', value: '#d97706' },
] as const

export const PEN_MODELS: PenModel[] = [
  { id: 'pen', name: 'خودکار', nameEn: 'Pen', hint: 'خط یکنواخت و واضح', hintEn: 'Even, crisp line', width: 0.0026, opacity: 1 },
  { id: 'pencil', name: 'مداد', nameEn: 'Pencil', hint: 'نازک و کمی محو', hintEn: 'Thin and slightly soft', width: 0.0018, opacity: 0.62 },
  { id: 'brush', name: 'قلم نرم', nameEn: 'Soft brush', hint: 'ضخامت حساس به فشار', hintEn: 'Pressure-sensitive width', width: 0.0042, opacity: 0.92 },
  { id: 'fountain', name: 'قلم نی', nameEn: 'Fountain pen', hint: 'پرکنتراست با فشار', hintEn: 'High contrast with pressure', width: 0.0034, opacity: 1 },
  { id: 'marker', name: 'ماژیک', nameEn: 'Marker', hint: 'پهن و نیمه‌شفاف', hintEn: 'Broad and translucent', width: 0.012, opacity: 0.34 },
  { id: 'dashed', name: 'خط‌چین', nameEn: 'Dashed', hint: 'برای دورگیری و تأکید', hintEn: 'Outlines and emphasis', width: 0.0026, opacity: 1 },
]

export const PEN_WIDTHS = [
  { name: 'نازک', nameEn: 'Thin', value: 0.7 },
  { name: 'متوسط', nameEn: 'Medium', value: 1 },
  { name: 'ضخیم', nameEn: 'Thick', value: 1.5 },
] as const

export const TAPE_COLORS = [
  { name: 'شیری', nameEn: 'Cream', value: '#fffdf2' },
  { name: 'زرد', nameEn: 'Yellow', value: '#ffe28a' },
  { name: 'صورتی', nameEn: 'Pink', value: '#ffc7dd' },
  { name: 'آبی', nameEn: 'Blue', value: '#b9ddff' },
  { name: 'سبز', nameEn: 'Green', value: '#c2f0d8' },
  { name: 'نارنجی', nameEn: 'Orange', value: '#ffd3a3' },
] as const

export const TEXT_SIZES = [
  { name: 'کوچک', nameEn: 'Small', value: 0.018 },
  { name: 'متوسط', nameEn: 'Medium', value: 0.024 },
  { name: 'بزرگ', nameEn: 'Large', value: 0.034 },
] as const

export const ANNOTATION_CATEGORIES = ['عمومی', 'مهم', 'مرور', 'سؤال', 'ایده'] as const

export const GRID_TYPES: {
  id: GridType
  name: string
  nameEn: string
  hint: string
  hintEn: string
}[] = [
  { id: 'lined', name: 'خط‌دار', nameEn: 'Lined', hint: 'مناسب نوشتن یادداشت', hintEn: 'Best for writing' },
  { id: 'grid', name: 'شطرنجی', nameEn: 'Grid', hint: 'مناسب ریاضی و نمودار', hintEn: 'Math and charts' },
  { id: 'dots', name: 'نقطه‌ای', nameEn: 'Dotted', hint: 'تمیز و کم‌شلوغ', hintEn: 'Clean and minimal' },
  { id: 'graph', name: 'میلی‌متری', nameEn: 'Graph', hint: 'شبکه ریز مهندسی', hintEn: 'Fine engineering grid' },
  { id: 'cornell', name: 'کورنل', nameEn: 'Cornell', hint: 'با ستون مرور و خلاصه', hintEn: 'Cue column and summary' },
  { id: 'blank', name: 'ساده', nameEn: 'Blank', hint: 'بدون خط و شبکه', hintEn: 'No lines or grid' },
  { id: 'isometric', name: 'ایزومتریک', nameEn: 'Isometric', hint: 'شبکه الماسی و مهندسی', hintEn: 'Diamond isometric grid' },
  { id: 'tri30', name: '۳۰–۶۰', nameEn: '30–60', hint: 'شبکه مثلثی ۳۰ و ۶۰ درجه', hintEn: '30–60 triangular grid' },
  { id: 'circular', name: 'دایره‌ای', nameEn: 'Circular', hint: 'حلقه و شعاع برای نقشه ذهنی', hintEn: 'Rings and spokes for mind maps' },
]

export const SHAPE_KINDS: { id: ShapeKind; name: string; nameEn: string }[] = [
  { id: 'line', name: 'خط مستقیم', nameEn: 'Line' },
  { id: 'arrow', name: 'فلش', nameEn: 'Arrow' },
  { id: 'rect', name: 'مستطیل', nameEn: 'Rectangle' },
  { id: 'ellipse', name: 'بیضی', nameEn: 'Ellipse' },
  { id: 'circle', name: 'دایره', nameEn: 'Circle' },
  { id: 'triangle', name: 'مثلث', nameEn: 'Triangle' },
  { id: 'polygon', name: 'چندضلعی', nameEn: 'Polygon' },
  { id: 'star', name: 'ستاره', nameEn: 'Star' },
]

export const GUIDE_KINDS: { id: GuideKind; name: string; nameEn: string }[] = [
  { id: 'ruler', name: 'خط‌کش', nameEn: 'Ruler' },
  { id: 'protractor', name: 'نقاله', nameEn: 'Protractor' },
  { id: 'triangle', name: 'گونیا', nameEn: 'Set square' },
]

export const GRID_SCALES = [
  { value: 0.7, name: 'ریز', nameEn: 'Fine' },
  { value: 1, name: 'متوسط', nameEn: 'Medium' },
  { value: 1.55, name: 'درشت', nameEn: 'Large' },
] as const

export const COVER_PRESETS = [
  { id: 'flamingo', name: 'فلامینگو', nameEn: 'Flamingo', from: '#ff8fab', to: '#c9184a', shape: '#ffe0ea' },
  { id: 'ocean', name: 'اقیانوس', nameEn: 'Ocean', from: '#0ea5e9', to: '#164e63', shape: '#a5e8ff' },
  { id: 'forest', name: 'جنگل', nameEn: 'Forest', from: '#10b981', to: '#065f46', shape: '#b5f5dd' },
  { id: 'sunset', name: 'غروب', nameEn: 'Sunset', from: '#f43f5e', to: '#7f1d1d', shape: '#ffc7c7' },
  { id: 'amber', name: 'کهربا', nameEn: 'Amber', from: '#f59e0b', to: '#78350f', shape: '#ffe3a3' },
  { id: 'graphite', name: 'گرافیت', nameEn: 'Graphite', from: '#475569', to: '#0f172a', shape: '#cbd5e1' },
  { id: 'rose', name: 'گل', nameEn: 'Rose', from: '#db2777', to: '#831843', shape: '#ffd1e6' },
  { id: 'mint', name: 'نعنایی', nameEn: 'Mint', from: '#14b8a6', to: '#134e4a', shape: '#bff7ef' },
] as const

export const COLLECTION_COLORS = [
  '#f43f5e',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#14b8a6',
  '#ec4899',
  '#64748b',
] as const
