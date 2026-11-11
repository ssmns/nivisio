import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  Bandage,
  Magnet,
  Brush,
  Eraser,
  FilePlus2,
  Highlighter,
  Lasso,
  LayoutGrid,
  MousePointer2,
  Pencil,
  PenLine,
  Type,
  SlidersHorizontal,
} from 'lucide-react'
import { InsertMenu } from '../InsertMenu'
import { PenPicker } from '../PenPicker'
import { StrokeWidthIcon } from '../StrokeWidthIcon'
import {
  ANNOTATION_CATEGORIES,
  PEN_WIDTHS,
  type PenStyle,
  type ReaderTool,
} from '../../lib/types'
import { categoryLabel } from '../../lib/utils'
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
  notebookPage: boolean
  notebookGridName?: string
  onSelectTool: (tool: ReaderTool) => void
  onPenStyle: (style: PenStyle) => void
  onPenWidth: (scale: number) => void
  onColor: (color: string) => void
  onCategory: (category: string) => void
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
  notebookPage,
  notebookGridName,
  onSelectTool,
  onPenStyle,
  onPenWidth,
  onColor,
  onCategory,
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
  const [tablet, setTablet] = useState(
    () => typeof window !== 'undefined' && window.innerWidth > 720 && window.innerWidth <= 1180,
  )
  const [toolbarWidth, setToolbarWidth] = useState(() => {
    const stored = Number(localStorage.getItem('bnote-toolbar-width'))
    return Number.isFinite(stored) && stored >= 320 ? stored : 760
  })
  const [expanded, setExpanded] = useState(
    () => localStorage.getItem('bnote-toolbar-expanded') === '1',
  )

  useEffect(() => {
    const onResize = () =>
      setTablet(window.innerWidth > 720 && window.innerWidth <= 1180)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    localStorage.setItem('bnote-toolbar-width', String(toolbarWidth))
  }, [toolbarWidth])

  useEffect(() => {
    localStorage.setItem('bnote-toolbar-expanded', expanded ? '1' : '0')
  }, [expanded])

  const startToolbarResize = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!tablet) return
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const startWidth = toolbarWidth
    const move = (pointerEvent: PointerEvent) => {
      const max = Math.min(window.innerWidth - 24, 1100)
      setToolbarWidth(
        Math.min(max, Math.max(320, startWidth + (pointerEvent.clientX - startX))),
      )
    }
    const finish = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', finish)
  }

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
    <div
      className={`reader__toolbar${tablet ? ' reader__toolbar--floating' : ''}${
        tablet && !expanded ? ' reader__toolbar--compact' : ''
      }`}
      style={tablet ? { width: `${Math.min(toolbarWidth, 1100)}px` } : undefined}
    >
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
              <StrokeWidthIcon scale={width.value} />
              <span>{lang === 'en' ? width.nameEn : width.name}</span>
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
        className={`tool-btn toolbar-snap${snapEnabled ? ' is-active' : ''}`}
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
        className="tool-btn tool-btn--page toolbar-page"
        onClick={onAddPage}
        title={t('افزودن برگه یادداشت بعد از این برگ', 'Insert a note page after this page')}
      >
        <FilePlus2 size={16} />
        <span>{t('برگه جدید', 'New page')}</span>
      </button>

      {notebookPage && (
        <button
          type="button"
          className="tool-btn tool-btn--notebook toolbar-page"
          onClick={onEditPage}
          title={t('تنظیمات برگه یادداشت', 'Note page settings')}
        >
          <LayoutGrid size={16} />
          <span>{notebookGridName ?? t('برگه', 'Page')}</span>
        </button>
      )}

      {tablet && (
        <button
          type="button"
          className={`tool-btn toolbar-more${expanded ? ' is-active' : ''}`}
          onClick={() => setExpanded((value) => !value)}
          title={expanded ? t('حالت خلاصه', 'Compact mode') : t('نمایش همه ابزارها', 'Show all tools')}
        >
          <SlidersHorizontal size={16} />
          <span>{expanded ? t('خلاصه', 'Compact') : t('همه ابزارها', 'All tools')}</span>
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

      {tablet && (
        <span
          className="toolbar-resize"
          onPointerDown={startToolbarResize}
          title={t('تغییر عرض نوار ابزار', 'Resize toolbar')}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
