import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
} from 'lucide-react'
import { toFa } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'

interface PageDockProps {
  pageInput: string
  pageCount: number
  currentIndex: number
  pageLabel: string
  pageStep: number
  pagePercent: number
  isRead: boolean
  isBookmarked: boolean
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
  onPageInput,
  onSubmitPage,
  onPrev,
  onNext,
  onToggleRead,
  onToggleBookmark,
}: PageDockProps) {
  const { isRtl, t } = useI18n()
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
