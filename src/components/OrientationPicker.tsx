import { RectangleHorizontal, RectangleVertical } from 'lucide-react'
import type { PageOrientation } from '../lib/types'
import { useI18n } from '../lib/i18n'

interface OrientationPickerProps {
  value: PageOrientation
  onChange: (value: PageOrientation) => void
  compact?: boolean
}

export function OrientationPicker({ value, onChange, compact }: OrientationPickerProps) {
  const { t } = useI18n()
  return (
    <div
      className={`orientation-picker${compact ? ' orientation-picker--compact' : ''}`}
      role="group"
      aria-label={t('جهت صفحه', 'Page orientation')}
    >
      <button
        type="button"
        className={value === 'portrait' ? 'is-active' : ''}
        onClick={() => onChange('portrait')}
        aria-pressed={value === 'portrait'}
        title={t('عمودی', 'Portrait')}
      >
        <RectangleVertical size={15} />
        {!compact && <span>{t('عمودی', 'Portrait')}</span>}
      </button>
      <button
        type="button"
        className={value === 'landscape' ? 'is-active' : ''}
        onClick={() => onChange('landscape')}
        aria-pressed={value === 'landscape'}
        title={t('افقی', 'Landscape')}
      >
        <RectangleHorizontal size={15} />
        {!compact && <span>{t('افقی', 'Landscape')}</span>}
      </button>
    </div>
  )
}
