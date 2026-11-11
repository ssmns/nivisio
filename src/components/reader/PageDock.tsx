import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Maximize2,
  Minus,
  Plus,
} from 'lucide-react'
import type { FitMode, ReaderTheme, ViewMode } from '../../lib/types'
import { MAX_ZOOM, MIN_ZOOM } from '../../lib/zoom'
import { toFa } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'
import { ViewMenu } from '../ViewMenu'

interface PageDockProps {
  pageInput: string
  pageCount: number
  currentIndex: number
  pageLabel: string
  pageStep: number
  pagePercent: number
  isRead: boolean
  isBookmarked: boolean
  zoom: number
  effectiveFitMode: FitMode
  viewMode: ViewMode
  fitMode: FitMode
  readingTheme: ReaderTheme
  onZoom: (zoom: number) => void
  onViewMode: (mode: ViewMode) => void
  onFitMode: (mode: FitMode) => void
  onReadingTheme: (theme: ReaderTheme) => void
  showText: boolean
  onShowText: (show: boolean) => void
  showLabels: boolean
  onShowLabels: (show: boolean) => void
  onPageInput: (value: string) => void
  onSubmitPage: () => void
  onPrev: () => void
  onNext: () => void
  onToggleRead: () => void
  onToggleBookmark: () => void
}

export function PageDock({
  pageInput,
  pageCount,
  currentIndex,
  pageLabel,
  pageStep,
  pagePercent,
  isRead,
  isBookmarked,
  zoom,
  effectiveFitMode,
  viewMode,
  fitMode,
  readingTheme,
  onZoom,
  onViewMode,
  onFitMode,
  onReadingTheme,
  showText,
  onShowText,
  showLabels,
  onShowLabels,
  onPageInput,
  onSubmitPage,
  onPrev,
  onNext,
  onToggleRead,
  onToggleBookmark,
}: PageDockProps) {
  const { isRtl, lang, t } = useI18n()
  return (
    <div className="page-dock">
      <button
        type="button"
        className="icon-btn"
        onClick={onPrev}
        disabled={currentIndex <= 0}
        title={t('برگ قبل', 'Previous page')}
        aria-label={t('برگ قبل', 'Previous page')}
      >
        {isRtl ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}
      </button>
      <label className="page-input">
        <input
          value={pageInput}
          onChange={(event) => onPageInput(event.target.value)}
          onBlur={onSubmitPage}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
          inputMode="numeric"
          aria-label={t('شماره برگ', 'Page number')}
        />
        <span>{t('از', 'of')} {toFa(pageCount)}</span>
      </label>
      <button
        type="button"
        className="icon-btn"
        onClick={onNext}
        disabled={currentIndex + pageStep >= pageCount}
        title={t('برگ بعد', 'Next page')}
        aria-label={t('برگ بعد', 'Next page')}
      >
        {isRtl ? <ChevronLeft size={19} /> : <ChevronRight size={19} />}
      </button>
      <span className="page-dock__zoom" role="group" aria-label={t('بزرگ‌نمایی', 'Zoom')}>
        <button
          type="button"
          className="icon-btn icon-btn--xs"
          onClick={() => onZoom(Math.max(MIN_ZOOM, zoom - 0.15))}
          title={t('کوچک‌تر', 'Zoom out')}
          aria-label={t('کوچک‌تر', 'Zoom out')}
        >
          <Minus size={13} />
        </button>
        <span className="zoom-value">
          {toFa(Math.round(zoom * 100))}
          {lang === 'en' ? '%' : '٪'}
        </span>
        <button
          type="button"
          className="icon-btn icon-btn--xs"
          onClick={() => onZoom(Math.min(MAX_ZOOM, zoom + 0.15))}
          title={t('بزرگ‌تر', 'Zoom in')}
          aria-label={t('بزرگ‌تر', 'Zoom in')}
        >
          <Plus size={13} />
        </button>
        <button
          type="button"
          className={`icon-btn icon-btn--xs${zoom === 1 ? ' is-active' : ''}`}
          onClick={() => onZoom(1)}
          title={effectiveFitMode === 'height' ? t('تناسب با ارتفاع', 'Fit height') : t('تناسب با عرض', 'Fit width')}
          aria-label={effectiveFitMode === 'height' ? t('تناسب با ارتفاع', 'Fit height') : t('تناسب با عرض', 'Fit width')}
        >
          <Maximize2 size={13} />
        </button>
      </span>

      <ViewMenu
        viewMode={viewMode}
        fitMode={fitMode}
        readingTheme={readingTheme}
        onViewMode={onViewMode}
        onFitMode={onFitMode}
        onReadingTheme={onReadingTheme}
        showText={showText}
        onShowText={onShowText}
        showLabels={showLabels}
        onShowLabels={onShowLabels}
      />

      <span className="page-dock__label">{pageLabel}</span>
      <button
        type="button"
        className={`icon-btn icon-btn--sm${isRead ? ' is-active' : ''}`}
        onClick={onToggleRead}
        title={isRead ? t('خوانده‌نشده', 'Mark unread') : t('خوانده‌شده', 'Mark read')}
        aria-label={t('وضعیت خواندن برگ', 'Page read state')}
      >
        {isRead ? <CheckCircle2 size={16} /> : <Circle size={16} />}
      </button>
      <button
        type="button"
        className={`icon-btn icon-btn--sm${isBookmarked ? ' is-active' : ''}`}
        onClick={onToggleBookmark}
        title={isBookmarked ? t('برداشتن نشانک', 'Remove bookmark') : t('نشانک این برگ', 'Bookmark this page')}
        aria-label={t('نشانک برگ', 'Bookmark page')}
      >
        {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
      </button>
      <span className="page-dock__progress">
        <span style={{ width: `${pagePercent}%` }} />
      </span>
    </div>
  )
}
