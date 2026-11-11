import { StickyNote, X } from 'lucide-react'
import { HIGHLIGHT_COLORS, type NormRect } from '../../lib/types'
import { clamp } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'

interface SelectionPopoverProps {
  selection: {
    rects: NormRect[]
    text: string
    anchor: { x: number; y: number }
  } | null
  currentColor: string
  onHighlight: (color: string, withNote?: boolean) => void
  onClose: () => void
}

export function SelectionPopover({
  selection,
  currentColor,
  onHighlight,
  onClose,
}: SelectionPopoverProps) {
  const { lang, t } = useI18n()
  if (!selection) return null
  return (
    <div
      className="selection-popover"
      style={{
        left: clamp(selection.anchor.x, 148, Math.max(148, window.innerWidth - 148)),
        top: selection.anchor.y,
      }}
    >
      <span className="selection-popover__label">{t('هایلایت', 'Highlight')}</span>
      {HIGHLIGHT_COLORS.map((item) => (
        <button
          key={item.value}
          type="button"
          className="color-dot color-dot--sm"
          style={{ background: item.value }}
          title={lang === 'en' ? item.nameEn : item.name}
          aria-label={`${t('هایلایت', 'Highlight')} ${lang === 'en' ? item.nameEn : item.name}`}
          onClick={() => onHighlight(item.value)}
        />
      ))}
      <button
        type="button"
        className="selection-popover__note"
        title={t('هایلایت و یادداشت', 'Highlight with note')}
        onClick={() => onHighlight(currentColor, true)}
      >
        <StickyNote size={15} />
      </button>
      <button
        type="button"
        className="icon-btn icon-btn--xs"
        title={t('انصراف', 'Cancel')}
        aria-label={t('انصراف', 'Cancel')}
        onClick={onClose}
      >
        <X size={13} />
      </button>
    </div>
  )
}
