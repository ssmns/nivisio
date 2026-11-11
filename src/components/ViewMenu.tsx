import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Columns2,
  LayoutTemplate,
  Moon,
  MoveHorizontal,
  MoveVertical,
  Rows3,
  Square,
  Sun,
  CloudSun,
} from 'lucide-react'
import type { FitMode, ReaderTheme, ViewMode } from '../lib/types'
import { useI18n } from '../lib/i18n'

interface ViewMenuProps {
  viewMode: ViewMode
  fitMode: FitMode
  readingTheme: ReaderTheme
  onViewMode: (mode: ViewMode) => void
  onFitMode: (mode: FitMode) => void
  onReadingTheme: (theme: ReaderTheme) => void
  showText: boolean
  onShowText: (show: boolean) => void
}

const VIEWS: { id: ViewMode; label: string; en: string; icon: typeof Square }[] = [
  { id: 'single', label: 'تک‌صفحه', en: 'Single page', icon: Square },
  { id: 'spread', label: 'دو صفحه', en: 'Two pages', icon: Columns2 },
  { id: 'continuous', label: 'پیوسته', en: 'Continuous', icon: Rows3 },
]

const THEMES: { id: ReaderTheme; label: string; en: string; icon: typeof Sun }[] = [
  { id: 'normal', label: 'معمولی', en: 'Normal', icon: Sun },
  { id: 'dim', label: 'کم‌نور', en: 'Dim', icon: CloudSun },
  { id: 'dark', label: 'شب', en: 'Night', icon: Moon },
]

export function ViewMenu({
  viewMode,
  fitMode,
  readingTheme,
  onViewMode,
  onFitMode,
  onReadingTheme,
  showText,
  onShowText,
}: ViewMenuProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{
    left: number
    bottom: number
    width: number
    maxHeight: number
  } | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(300, Math.max(250, Math.round(window.innerWidth * 0.72)))
      const left = Math.min(
        Math.max(12, rect.left + rect.width / 2 - width / 2),
        window.innerWidth - width - 12,
      )
      const bottom = window.innerHeight - rect.top + 8
      const maxHeight = Math.max(140, rect.top - 16)
      setPosition({ left, bottom, width, maxHeight })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [open])

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
    <div className="view-menu" onPointerDown={(event) => event.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        className={`tool-btn view-menu__trigger${open ? ' is-active' : ''}`}
        onClick={() => setOpen((current) => !current)}
        title={t('حالت نمایش و خواندن', 'View & reading mode')}
      >
        <LayoutTemplate size={16} />
        <span>{t('نمایش', 'View')}</span>
      </button>
      {open && (
        <div
          className="popover view-popover"
          style={
            position
              ? {
                  position: 'fixed',
                  top: 'auto',
                  right: 'auto',
                  left: position.left,
                  bottom: position.bottom,
                  width: position.width,
                  minWidth: position.width,
                  maxWidth: position.width,
                  maxHeight: position.maxHeight,
                  overflowY: 'auto',
                  transform: 'none',
                  zIndex: 90,
                }
              : { visibility: 'hidden' }
          }
        >
          <div className="popover__title">{t('چیدمان صفحات', 'Page layout')}</div>
          <div className="view-options">
            {VIEWS.map(({ id, label, en, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={viewMode === id ? 'is-active' : ''}
                onClick={() => {
                  onViewMode(id)
                  setOpen(false)
                }}
              >
                <Icon size={15} />
                {t(label, en)}
              </button>
            ))}
          </div>

          <div className="popover__title">{t('تناسب صفحه', 'Page fit')}</div>
          <div className="view-options view-options--two">
            <button
              type="button"
              className={fitMode === 'width' ? 'is-active' : ''}
              onClick={() => {
                onFitMode('width')
                setOpen(false)
              }}
            >
              <MoveHorizontal size={15} />
              {t('عرض', 'Width')}
            </button>
            <button
              type="button"
              className={fitMode === 'height' ? 'is-active' : ''}
              onClick={() => {
                onFitMode('height')
                setOpen(false)
              }}
              disabled={viewMode === 'continuous'}
              title={
                viewMode === 'continuous'
                  ? t('در حالت پیوسته، تناسب عرض استفاده می‌شود', 'Continuous mode uses fit width')
                  : t('تناسب ارتفاع', 'Fit height')
              }
            >
              <MoveVertical size={15} />
              {t('ارتفاع', 'Height')}
            </button>
          </div>

          <div className="popover__title">{t('حالت خواندن PDF', 'PDF reading theme')}</div>
          <div className="view-options">
            {THEMES.map(({ id, label, en, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={readingTheme === id ? 'is-active' : ''}
                onClick={() => {
                  onReadingTheme(id)
                  setOpen(false)
                }}
              >
                <Icon size={15} />
                {t(label, en)}
              </button>
            ))}
          </div>

          <div className="popover__title">{t('متن‌های روی صفحه', 'Text on the page')}</div>
          <div className="view-options view-options--two">
            <button
              type="button"
              className={showText ? 'is-active' : ''}
              onClick={() => onShowText(true)}
            >
              {t('نمایش', 'Show')}
            </button>
            <button
              type="button"
              className={!showText ? 'is-active' : ''}
              onClick={() => onShowText(false)}
            >
              {t('پنهان', 'Hide')}
            </button>
          </div>

          <p className="view-popover__hint">
            {t(
              'حالت شب فقط نمایش PDF را تیره می‌کند؛ فایل اصلی و خروجی تغییری نمی‌کنند.',
              'Night mode only dims the PDF display; the original file and export are unchanged.',
            )}
          </p>
        </div>
      )}
    </div>
  )
}
