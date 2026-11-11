import { PAGE_SIZES, type PageSizeKey } from '../lib/types'
import { toFa } from '../lib/utils'
import { useI18n } from '../lib/i18n'

interface PageSizePickerProps {
  value: PageSizeKey
  onChange: (value: PageSizeKey) => void
  compact?: boolean
}

export function PageSizePicker({ value, onChange, compact }: PageSizePickerProps) {
  const { lang, t } = useI18n()
  return (
    <div
      className={`page-size-picker${compact ? ' page-size-picker--compact' : ''}`}
      role="group"
      aria-label={t('اندازه صفحه', 'Page size')}
    >
      {(Object.keys(PAGE_SIZES) as PageSizeKey[]).map((key) => {
        const preset = PAGE_SIZES[key]
        const ratio = key === 'square' ? 1 : preset.height / preset.width
        const widthMm = Math.round((preset.width / 72) * 25.4)
        const heightMm = Math.round((preset.height / 72) * 25.4)
        return (
          <button
            key={key}
            type="button"
            className={value === key ? 'is-active' : ''}
            onClick={() => onChange(key)}
            aria-pressed={value === key}
            title={lang === 'en' ? preset.nameEn : preset.name}
          >
            <span
              className={`page-size-picker__shape${
                key === 'custom' ? ' page-size-picker__shape--custom' : ''
              }`}
              style={key === 'custom' ? undefined : { aspectRatio: `1 / ${ratio}` }}
            />
            <strong>{lang === 'en' ? preset.nameEn : preset.name}</strong>
            {!compact && (
              <em>
                {key === 'custom'
                  ? t('اندازه دلخواه', 'Custom mm')
                  : `${toFa(widthMm)}×${toFa(heightMm)} mm`}
              </em>
            )}
          </button>
        )
      })}
    </div>
  )
}
