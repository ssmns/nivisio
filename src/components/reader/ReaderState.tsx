import { Loader2 } from 'lucide-react'
import { useI18n } from '../../lib/i18n'

type ReaderStateVariant = 'loading' | 'missing' | 'building'

interface ReaderStateProps {
  variant: ReaderStateVariant
  onBack?: () => void
}

export function ReaderState({ variant, onBack }: ReaderStateProps) {
  const { t } = useI18n()
  if (variant === 'missing') {
    return (
      <div className="reader-state">
        <h2>{t('سند پیدا نشد', 'Document not found')}</h2>
        <p>{t('ممکن است حذف شده باشد.', 'It may have been deleted.')}</p>
        <button type="button" className="btn btn--primary" onClick={onBack}>
          {t('بازگشت به کتابخانه', 'Back to library')}
        </button>
      </div>
    )
  }
  return (
    <div className="reader-state">
      <Loader2 size={26} className="spin" />
      <p>
        {variant === 'loading'
          ? t('در حال باز کردن سند…', 'Opening document…')
          : t('در حال ساخت صفحات…', 'Building pages…')}
      </p>
      {variant === 'loading' && onBack && (
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          {t('بازگشت به کتابخانه', 'Back to library')}
        </button>
      )}
    </div>
  )
}
