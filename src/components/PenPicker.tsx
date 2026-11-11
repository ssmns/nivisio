import { useEffect, useState } from 'react'
import { ChevronDown, Highlighter, PenLine } from 'lucide-react'
import { PEN_MODELS, PEN_WIDTHS, type PenStyle } from '../lib/types'
import { useI18n } from '../lib/i18n'

interface PenPickerProps {
  value: PenStyle
  widthScale: number
  onChange: (style: PenStyle) => void
  onWidthChange: (scale: number) => void
}

export function PenPicker({ value, widthScale, onChange, onWidthChange }: PenPickerProps) {
  const { lang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const selected = PEN_MODELS.find((model) => model.id === value) ?? PEN_MODELS[0]

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const timer = window.setTimeout(() => {
      window.addEventListener('pointerdown', close, { once: true })
    }, 0)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pointerdown', close)
    }
  }, [open])

  return (
    <div className="pen-picker" onPointerDown={(event) => event.stopPropagation()}>
      <button
        type="button"
        className={`tool-btn tool-btn--pen${open ? ' is-active' : ''}`}
        onClick={() => setOpen((current) => !current)}
        title={t('مدل قلم', 'Pen model')}
      >
        {value === 'marker' ? <Highlighter size={16} /> : <PenLine size={16} />}
        <span>{lang === 'en' ? selected.nameEn : selected.name}</span>
        <ChevronDown size={13} />
      </button>
      {open && (
        <div className="popover pen-menu">
          <div className="popover__title">{t('مدل قلم', 'Pen model')}</div>
          <div className="pen-menu__list">
            {PEN_MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                className={`pen-option${value === model.id ? ' is-active' : ''}`}
                onClick={() => {
                  onChange(model.id)
                  setOpen(false)
                }}
              >
                <span className={`pen-preview pen-preview--${model.id}`} />
                <span>
                  <strong>{lang === 'en' ? model.nameEn : model.name}</strong>
                  <em>{lang === 'en' ? model.hintEn : model.hint}</em>
                </span>
              </button>
            ))}
          </div>
          <div className="popover__title">{t('ضخامت', 'Width')}</div>
          <div className="pen-widths">
            {PEN_WIDTHS.map((width) => (
              <button
                key={lang === 'en' ? width.nameEn : width.name}
                type="button"
                className={widthScale === width.value ? 'is-active' : ''}
                onClick={() => onWidthChange(width.value)}
              >
                {lang === 'en' ? width.nameEn : width.name}
              </button>
            ))}
          </div>
          <p className="pen-menu__hint">
            {t(
              'فشار قلم استایلوس به‌صورت خودکار ضخامت خط را تغییر می‌دهد.',
              'Stylus pressure automatically changes stroke width.',
            )}
          </p>
        </div>
      )}
    </div>
  )
}
