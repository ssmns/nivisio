import {
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  Check,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import type { BnoteDocument } from '../../lib/types'
import { progressLabel, toFa } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'

interface ReaderHeaderProps {
  doc: BnoteDocument
  pageLabel: string
  currentIndex: number
  pageCount: number
  annotationCount: number
  panelOpen: boolean
  isCurrentBookmarked: boolean
  onBack: () => void
  onToggleDone: () => void
  onTogglePanel: () => void
  onJumpBookmark: () => void
}

export function ReaderHeader({
  doc,
  pageLabel,
  currentIndex,
  pageCount,
  annotationCount,
  panelOpen,
  isCurrentBookmarked,
  onBack,
  onToggleDone,
  onTogglePanel,
  onJumpBookmark,
}: ReaderHeaderProps) {
  const { isRtl, lang, setLang, t } = useI18n()
  return (
    <header className="reader__bar">
      <button
        type="button"
        className="icon-btn reader__back"
        onClick={onBack}
        title={t('بازگشت به کتابخانه', 'Back to library')}
        aria-label={t('بازگشت به کتابخانه', 'Back to library')}
      >
        {isRtl ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
      </button>
      <div className="reader__title">
        <h1>{doc.title}</h1>
        <p>
          {doc.author ? `${doc.author} · ` : ''}
          {t('برگ', 'Page')} {toFa(currentIndex + 1)} {t('از', 'of')} {toFa(pageCount)} · {pageLabel} ·{' '}
          {progressLabel(doc.progress)}
        </p>
      </div>
      <div className="reader__bar-actions">
        <button
          type="button"
          className="btn btn--ghost lang-toggle"
          onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
          title={t('تغییر زبان', 'Switch language')}
        >
          {lang === 'fa' ? 'EN' : 'FA'}
        </button>
        {doc.bookmarkKey && !isCurrentBookmarked && (
          <button
            type="button"
            className="icon-btn"
            onClick={onJumpBookmark}
            title={t('رفتن به نشانک', 'Go to bookmark')}
            aria-label={t('رفتن به نشانک', 'Go to bookmark')}
          >
            <BookmarkCheck size={18} />
          </button>
        )}
        <button
          type="button"
          className={`btn btn--done${doc.status === 'done' ? ' is-done' : ''}`}
          onClick={onToggleDone}
          title={
            doc.status === 'done'
              ? t('برگرداندن به در حال مطالعه', 'Mark as reading')
              : t('علامت‌گذاری به‌عنوان تمام‌شده', 'Mark as completed')
          }
        >
          <Check size={16} />
          <span>{doc.status === 'done' ? t('تمام شد', 'Completed') : t('اتمام مطالعه', 'Complete')}</span>
        </button>
        <button
          type="button"
          className={`icon-btn${panelOpen ? ' is-active' : ''}`}
          onClick={onTogglePanel}
          title={panelOpen
            ? t('بستن پنل نشانه‌ها', 'Close marks panel')
            : t('باز کردن پنل نشانه‌ها', 'Open marks panel')}
          aria-label={t('پنل نشانه‌ها', 'Marks panel')}
        >
          {panelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          {annotationCount > 0 && (
            <span className="icon-badge">{toFa(annotationCount)}</span>
          )}
        </button>
      </div>
    </header>
  )
}
