import {
  Bandage,
  Magnet,
  Brush,
  Eraser,
  FilePlus2,
  Highlighter,
  Lasso,
  LayoutGrid,
  Minus,
  MousePointer2,
  Pencil,
  PenLine,
  Plus,
  Type,
  Maximize2,
} from 'lucide-react'
import { InsertMenu } from '../InsertMenu'
import { PenPicker } from '../PenPicker'
import { ViewMenu } from '../ViewMenu'
import {
  ANNOTATION_CATEGORIES,
  PEN_WIDTHS,
  type FitMode,
  type PenStyle,
  type ReaderTheme,
  type ReaderTool,
  type ViewMode,
} from '../../lib/types'
import { categoryLabel, toFa } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'

interface PaletteColor {
  name: string
  nameEn?: string
  value: string
}

interface ReaderToolbarProps {
  tool: ReaderTool
  penStyle: PenStyle
  penWidthScale: number
  activeColor: string
  palette: readonly PaletteColor[]
  category: string
  zoom: number
  fitMode: FitMode
  effectiveFitMode: FitMode
  viewMode: ViewMode
  readingTheme: ReaderTheme
  notebookPage: boolean
  notebookGridName?: string
  onSelectTool: (tool: ReaderTool) => void
  onPenStyle: (style: PenStyle) => void
  onPenWidth: (scale: number) => void
  onColor: (color: string) => void
  onCategory: (category: string) => void
  onZoom: (zoom: number) => void
  onViewMode: (mode: ViewMode) => void
  onFitMode: (mode: FitMode) => void
  onReadingTheme: (theme: ReaderTheme) => void
  onImage: () => void
  onChart: () => void
  onLink: () => void
  onNote: () => void
  onShape: () => void
  onGuide: () => void
  snapEnabled: boolean
  onSnap: () => void
  onAddPage: () => void
  onEditPage: () => void
}

export function ReaderToolbar({
  tool,
  penStyle,
  penWidthScale,
  activeColor,
  palette,
  category,
  zoom,
  fitMode,
  effectiveFitMode,
  viewMode,
  readingTheme,
  notebookPage,
  notebookGridName,
  onSelectTool,
  onPenStyle,
  onPenWidth,
  onColor,
  onCategory,
  onZoom,
  onViewMode,
  onFitMode,
  onReadingTheme,
  onImage,
  onChart,
  onLink,
  onNote,
  onShape,
  onGuide,
  snapEnabled,
  onSnap,
  onAddPage,
  onEditPage,
}: ReaderToolbarProps) {
  const { lang, t } = useI18n()
  const tools: {
    key: string
    label: string
    icon: typeof MousePointer2
    active: boolean
    onClick: () => void
  }[] = [
    {
      key: 'select',
      label: t('انتخاب', 'Select'),
      icon: MousePointer2,
      active: tool === 'select',
      onClick: () => onSelectTool('select'),
    },
    {
      key: 'highlight',
      label: t('هایلایت متن', 'Text highlight'),
      icon: Highlighter,
      active: tool === 'highlight',
      onClick: () => onSelectTool('highlight'),
    },
    {
      key: 'pen',
      label: t('قلم', 'Pen'),
      icon: PenLine,
      active: tool === 'pen' && penStyle !== 'pencil',
      onClick: () => {
        onSelectTool('pen')
        onPenStyle('pen')
      },
    },
    {
      key: 'pencil',
      label: t('مداد', 'Pencil'),
      icon: Pencil,
      active: tool === 'pen' && penStyle === 'pencil',
      onClick: () => {
        onSelectTool('pen')
        onPenStyle('pencil')
      },
    },
    {
      key: 'marker',
      label: t('هایلایتر', 'Highlighter'),
      icon: Brush,
      active: tool === 'marker',
      onClick: () => onSelectTool('marker'),
    },
    {
      key: 'tape',
      label: t('نوار چسب', 'Tape'),
      icon: Bandage,
      active: tool === 'tape',
      onClick: () => onSelectTool('tape'),
    },
    {
      key: 'eraser',
      label: t('پاک‌کن', 'Eraser'),
      icon: Eraser,
      active: tool === 'erase',
      onClick: () => onSelectTool('erase'),
    },
    {
      key: 'lasso',
      label: t('لاسو', 'Lasso'),
      icon: Lasso,
      active: tool === 'lasso',
      onClick: () => onSelectTool('lasso'),
    },
    {
      key: 'text',
      label: t('متن', 'Text'),
      icon: Type,
      active: tool === 'text',
      onClick: () => onSelectTool('text'),
    },
  ]

  return (
    <div className="reader__toolbar">
      <div className="tool-group" role="group" aria-label={t('ابزارها', 'Tools')}>
        {tools.map(({ key, label, icon: Icon, active, onClick }) => (
          <button
            key={key}
            type="button"
            className={`tool-btn${active ? ' is-active' : ''}`}
            onClick={onClick}
            title={label}
            aria-label={label}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {tool === 'pen' && (
        <PenPicker
          value={penStyle}
          widthScale={penWidthScale}
          onChange={onPenStyle}
          onWidthChange={onPenWidth}
        />
      )}

      {tool === 'marker' && (
        <div className="marker-widths" role="group" aria-label={t('ضخامت هایلایتر', 'Highlighter width')}>
          {PEN_WIDTHS.map((width) => (
            <button
              key={width.name}
              type="button"
              className={penWidthScale === width.value ? 'is-active' : ''}
              onClick={() => onPenWidth(width.value)}
              title={t(`هایلایتر ${width.name}`, `Highlighter ${width.nameEn}`)}
            >
              {lang === 'en' ? width.nameEn : width.name}
            </button>
          ))}
        </div>
      )}

      {(tool === 'select' ||
        tool === 'highlight' ||
        tool === 'marker' ||
        tool === 'pen' ||
        tool === 'tape' ||
        tool === 'text') && (
        <div className="color-picker" role="group" aria-label={t('رنگ', 'Color')}>
          {palette.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`color-dot color-dot--sm${activeColor === item.value ? ' is-active' : ''}`}
              style={{ background: item.value }}
              onClick={() => onColor(item.value)}
              title={lang === 'en' ? item.nameEn : item.name}
              aria-label={t(`رنگ ${item.name}`, `Color ${item.nameEn}`)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        className={`tool-btn${snapEnabled ? ' is-active' : ''}`}
        onClick={onSnap}
        title={t('چسبیدن به گرید', 'Snap to grid')}
      >
        <Magnet size={16} />
        <span>{t('اسنپ', 'Snap')}</span>
      </button>

      <InsertMenu
        onImage={onImage}
        onChart={onChart}
        onLink={onLink}
        onNote={onNote}
        onShape={onShape}
        onGuide={onGuide}
        active={
          tool === 'note' ||
          tool === 'image' ||
          tool === 'chart' ||
          tool === 'link' ||
          tool === 'shape' ||
          tool === 'guide'
        }
      />

      <button
        type="button"
        className="tool-btn tool-btn--page"
        onClick={onAddPage}
        title={t('افزودن برگه یادداشت بعد از این برگ', 'Insert a note page after this page')}
      >
        <FilePlus2 size={16} />
        <span>{t('برگه جدید', 'New page')}</span>
      </button>

      {notebookPage && (
        <button
          type="button"
          className="tool-btn tool-btn--notebook"
          onClick={onEditPage}
          title={t('تنظیمات برگه یادداشت', 'Note page settings')}
        >
          <LayoutGrid size={16} />
          <span>{notebookGridName ?? t('برگه', 'Page')}</span>
        </button>
      )}

      <label className="category-select">
        <span>{t('دسته', 'Category')}</span>
        <select value={category} onChange={(event) => onCategory(event.target.value)}>
          {ANNOTATION_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {categoryLabel(item)}
            </option>
          ))}
        </select>
      </label>

      <div className="zoom-group">
        <button
          type="button"
          className="icon-btn icon-btn--sm"
          onClick={() => onZoom(Math.max(0.6, zoom - 0.15))}
          title={t('کوچک‌تر', 'Zoom out')}
          aria-label={t('کوچک‌تر', 'Zoom out')}
        >
          <Minus size={15} />
        </button>
        <span className="zoom-value">
          {toFa(Math.round(zoom * 100))}
          {lang === 'en' ? '%' : '٪'}
        </span>
        <button
          type="button"
          className="icon-btn icon-btn--sm"
          onClick={() => onZoom(Math.min(2.4, zoom + 0.15))}
          title={t('بزرگ‌تر', 'Zoom in')}
          aria-label={t('بزرگ‌تر', 'Zoom in')}
        >
          <Plus size={15} />
        </button>
        <button
          type="button"
          className={`icon-btn icon-btn--sm${zoom === 1 ? ' is-active' : ''}`}
          onClick={() => onZoom(1)}
          title={effectiveFitMode === 'height'
            ? t('تناسب با ارتفاع', 'Fit height')
            : t('تناسب با عرض', 'Fit width')}
          aria-label={effectiveFitMode === 'height'
            ? t('تناسب با ارتفاع', 'Fit height')
            : t('تناسب با عرض', 'Fit width')}
        >
          <Maximize2 size={15} />
        </button>
      </div>

      <ViewMenu
        viewMode={viewMode}
        fitMode={fitMode}
        readingTheme={readingTheme}
        onViewMode={onViewMode}
        onFitMode={onFitMode}
        onReadingTheme={onReadingTheme}
      />
    </div>
  )
}
