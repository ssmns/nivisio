import type { GridType, PageOrientation, PageSizeKey } from './types'

export interface NoteTemplate {
  id: string
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  pageSize: PageSizeKey
  grid: GridType
  gridScale?: number
  orientation?: PageOrientation
  pageCount: number
  coverPreset: number
  tag: string
  tagEn: string
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'cornell-a4',
    name: 'یادداشت کورنل',
    nameEn: 'Cornell Notes',
    description: 'ستون مرور، بخش یادداشت و خلاصه پایین صفحه؛ مناسب مطالعه عمیق.',
    descriptionEn: 'Cue column, note area and a summary strip for deep study.',
    pageSize: 'a4',
    grid: 'cornell',
    gridScale: 1,
    pageCount: 2,
    coverPreset: 0,
    tag: 'مطالعه',
    tagEn: 'Study',
  },
  {
    id: 'study-lined-a5',
    name: 'دفتر مطالعه',
    nameEn: 'Study Notebook',
    description: 'صفحه‌های A5 خط‌دار برای خلاصه‌نویسی و مرور سریع.',
    descriptionEn: 'A5 lined pages for summaries and quick revision.',
    pageSize: 'a5',
    grid: 'lined',
    gridScale: 1,
    pageCount: 4,
    coverPreset: 2,
    tag: 'مطالعه',
    tagEn: 'Study',
  },
  {
    id: 'meeting-grid',
    name: 'صورت‌جلسه',
    nameEn: 'Meeting Notes',
    description: 'چند صفحه شطرنجی برای دستور جلسه، تصمیم‌ها و کارهای بعدی.',
    descriptionEn: 'Grid pages for agenda, decisions and follow-up tasks.',
    pageSize: 'a4',
    grid: 'grid',
    gridScale: 1,
    pageCount: 3,
    coverPreset: 1,
    tag: 'کار',
    tagEn: 'Work',
  },
  {
    id: 'daily-dots',
    name: 'برنامه روزانه',
    nameEn: 'Daily Plan',
    description: 'صفحه نقطه‌ای برای برنامه روز، اولویت‌ها و یادداشت آزاد.',
    descriptionEn: 'Dotted page for the day plan, priorities and free notes.',
    pageSize: 'a4',
    grid: 'dots',
    gridScale: 0.7,
    pageCount: 1,
    coverPreset: 3,
    tag: 'برنامه‌ریزی',
    tagEn: 'Planning',
  },
  {
    id: 'math-graph',
    name: 'دفتر محاسبات',
    nameEn: 'Math Workbook',
    description: 'شبکه میلی‌متری A5 برای محاسبه، نمودار و ترسیم دقیق.',
    descriptionEn: 'A5 graph paper for calculations, charts and precise sketches.',
    pageSize: 'a5',
    grid: 'graph',
    gridScale: 0.7,
    pageCount: 6,
    coverPreset: 4,
    tag: 'ریاضی',
    tagEn: 'Math',
  },
  {
    id: 'sketch-square',
    name: 'دفتر طراحی',
    nameEn: 'Sketchbook',
    description: 'صفحه مربع ساده برای طراحی آزاد، نقشه ذهنی و ایده‌پردازی.',
    descriptionEn: 'Square blank pages for free drawing, mind maps and ideas.',
    pageSize: 'square',
    grid: 'blank',
    gridScale: 1,
    pageCount: 3,
    coverPreset: 6,
    tag: 'خلاقیت',
    tagEn: 'Creative',
  },
  {
    id: 'project-grid',
    name: 'طرح پروژه',
    nameEn: 'Project Plan',
    description: 'صفحه‌های A4 شطرنجی برای اهداف، زمان‌بندی و پیگیری کارها.',
    descriptionEn: 'A4 grid pages for goals, timeline and task tracking.',
    pageSize: 'a4',
    grid: 'grid',
    gridScale: 1.55,
    pageCount: 5,
    coverPreset: 5,
    tag: 'کار',
    tagEn: 'Work',
  },
  {
    id: 'letter-blank',
    name: 'برگ نامه',
    nameEn: 'Letter Sheet',
    description: 'صفحه Letter ساده برای نامه، متن رسمی یا یادداشت بلند.',
    descriptionEn: 'Blank Letter pages for letters, formal text or long notes.',
    pageSize: 'letter',
    grid: 'blank',
    gridScale: 1,
    pageCount: 1,
    coverPreset: 7,
    tag: 'نوشتن',
    tagEn: 'Writing',
  },
  {
    id: 'isometric-a4',
    name: 'شبکه ایزومتریک',
    nameEn: 'Isometric Grid',
    description: 'شبکه الماسی برای طراحی فنی، ایزومتریک و نقشه‌های سه‌بعدی.',
    descriptionEn: 'Diamond grid for technical, isometric and 3D sketches.',
    pageSize: 'a4',
    grid: 'isometric',
    gridScale: 1,
    pageCount: 2,
    coverPreset: 1,
    tag: 'مهندسی',
    tagEn: 'Engineering',
  },
  {
    id: 'tri30-a4',
    name: 'شبکه ۳۰–۶۰',
    nameEn: '30–60 Grid',
    description: 'شبکه مثلثی ۳۰ و ۶۰ درجه برای ترسیم فنی با گونیا و خط‌کش.',
    descriptionEn: '30–60 triangular grid for technical drawing with set square and ruler.',
    pageSize: 'a4',
    grid: 'tri30',
    gridScale: 1,
    pageCount: 2,
    coverPreset: 1,
    tag: 'مهندسی',
    tagEn: 'Engineering',
  },
  {
    id: 'mindmap-circular',
    name: 'نقشه ذهنی دایره‌ای',
    nameEn: 'Circular Mind Map',
    description: 'حلقه‌های متحدالمرکز و شعاع‌ها برای ایده‌پردازی و نقشه ذهنی.',
    descriptionEn: 'Concentric rings and spokes for brainstorming and mind maps.',
    pageSize: 'square',
    grid: 'circular',
    gridScale: 1,
    pageCount: 2,
    coverPreset: 6,
    tag: 'ایده',
    tagEn: 'Ideas',
  },
  {
    id: 'landscape-board',
    name: 'تخته افقی',
    nameEn: 'Landscape Board',
    description: 'صفحه A4 افقی نقطه‌ای برای جلسه، تخته سفید و زمان‌بندی.',
    descriptionEn: 'A4 landscape dotted page for meetings, whiteboards and timelines.',
    pageSize: 'a4',
    grid: 'dots',
    gridScale: 1,
    orientation: 'landscape',
    pageCount: 1,
    coverPreset: 0,
    tag: 'کار',
    tagEn: 'Work',
  },
]

export function templateTitle(template: NoteTemplate, lang: 'fa' | 'en'): string {
  const base = lang === 'en' ? template.nameEn : template.name
  const date = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date())
  return `${base} — ${date}`
}
