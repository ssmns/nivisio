import { useEffect, useState } from 'react'
import { BarChart3, ImagePlus, Link2, Plus, Ruler, Shapes, StickyNote } from 'lucide-react'
import { useI18n } from '../lib/i18n'

interface InsertMenuProps {
  onImage: () => void
  onChart: () => void
  onLink: () => void
  onNote: () => void
  onShape: () => void
  onGuide: () => void
  active?: boolean
}

export function InsertMenu({ onImage, onChart, onLink, onNote, onShape, onGuide, active }: InsertMenuProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

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

  const choose = (action: () => void) => {
    setOpen(false)
    action()
  }

  return (
    <div className="insert-menu" onPointerDown={(event) => event.stopPropagation()}>
      <button
        type="button"
        className={`tool-btn${open || active ? ' is-active' : ''}`}
        onClick={() => setOpen((current) => !current)}
        title={t('افزودن تصویر، نمودار یا پیوند', 'Insert image, chart or link')}
      >
        <Plus size={16} />
        <span>{t('افزودن', 'Insert')}</span>
      </button>
      {open && (
        <div className="popover insert-popover">
          <button type="button" onClick={() => choose(onImage)}>
            <ImagePlus size={16} />
            <span>
              <strong>{t('تصویر', 'Image')}</strong>
              <em>{t('از گالری یا فایل', 'From gallery or file')}</em>
            </span>
          </button>
          <button type="button" onClick={() => choose(onChart)}>
            <BarChart3 size={16} />
            <span>
              <strong>{t('نمودار', 'Chart')}</strong>
              <em>{t('میله‌ای، خطی یا دایره‌ای', 'Bar, line or pie')}</em>
            </span>
          </button>
          <button type="button" onClick={() => choose(onLink)}>
            <Link2 size={16} />
            <span>
              <strong>{t('پیوند', 'Link')}</strong>
              <em>{t('وب، صفحه یا سند دیگر', 'Web, page or another document')}</em>
            </span>
          </button>
          <button type="button" onClick={() => choose(onNote)}>
            <StickyNote size={16} />
            <span>
              <strong>{t('یادداشت چسبان', 'Sticky note')}</strong>
              <em>{t('روی هر نقطه از برگ', 'Anywhere on the page')}</em>
            </span>
          </button>
          <button type="button" onClick={() => choose(onShape)}>
            <Shapes size={16} />
            <span>
              <strong>{t('شکل و خط', 'Shape & line')}</strong>
              <em>{t('ستاره، چندضلعی، دایره و…', 'Star, polygon, circle…')}</em>
            </span>
          </button>
          <button type="button" onClick={() => choose(onGuide)}>
            <Ruler size={16} />
            <span>
              <strong>{t('ابزار اندازه', 'Measuring guide')}</strong>
              <em>{t('خط‌کش، گونیا، نقاله', 'Ruler, set square, protractor')}</em>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
