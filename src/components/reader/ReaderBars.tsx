import { Bandage, Eraser, Lasso, RotateCcw, RotateCw, Trash2, X } from 'lucide-react'
import { INK_COLORS, type Annotation } from '../../lib/types'
import { toFa } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'

interface ReaderBarsProps {
  tool: string
  activeTape: Annotation | null
  selectedAnnotations: Annotation[]
  onRotateTape: (delta: number) => void
  onDeleteTape: (annotation: Annotation) => void
  onCloseTape: () => void
  onRecolorSelected: (color: string) => void
  onDeleteSelected: () => void
  onClearSelection: () => void
}

export function ReaderBars({
  tool,
  activeTape,
  selectedAnnotations,
  onRotateTape,
  onDeleteTape,
  onCloseTape,
  onRecolorSelected,
  onDeleteSelected,
  onClearSelection,
}: ReaderBarsProps) {
  const { t } = useI18n()
  return (
    <>
      {activeTape && tool === 'select' && (
        <div className="object-bar">
          <span className="object-bar__title">
            <Bandage size={15} />
            {t('نوار چسب', 'Tape')}
          </span>
          <button
            type="button"
            onClick={() => onRotateTape(-15)}
            title={t('چرخش ۱۵ درجه به چپ', 'Rotate 15° left')}
          >
            <RotateCcw size={14} />
            {t('چرخش', 'Rotate')}
          </button>
          <button
            type="button"
            onClick={() => onRotateTape(15)}
            title={t('چرخش ۱۵ درجه به راست', 'Rotate 15° right')}
          >
            <RotateCw size={14} />
            {t('چرخش', 'Rotate')}
          </button>
          <button
            type="button"
            className="object-bar__delete"
            onClick={() => onDeleteTape(activeTape)}
          >
            <Trash2 size={14} />
            {t('حذف', 'Delete')}
          </button>
          <button
            type="button"
            className="object-bar__close"
            onClick={onCloseTape}
            title={t('بستن انتخاب', 'Clear selection')}
            aria-label={t('بستن انتخاب', 'Clear selection')}
          >
            <X size={14} />
          </button>
          <span className="object-bar__hint">
            {t(
              'دستگیره‌ها: تغییر اندازه · دایره بالا: چرخش · رنگ از پالت',
              'Handles: resize · top circle: rotate · palette: color',
            )}
          </span>
        </div>
      )}

      {tool === 'lasso' && selectedAnnotations.length > 0 && (
        <div className="lasso-bar">
          <span className="lasso-bar__count">
            <Lasso size={15} />
            {toFa(selectedAnnotations.length)} {t('نشانه', 'marks')}
          </span>
          <span className="lasso-bar__palette">
            {INK_COLORS.map((item) => (
              <button
                key={item.value}
                type="button"
                className="color-dot color-dot--xs"
                style={{ background: item.value }}
                title={t(`رنگ ${item.name}`, `Color ${item.nameEn}`)}
                aria-label={t(`رنگ ${item.name}`, `Color ${item.nameEn}`)}
                onClick={() => onRecolorSelected(item.value)}
              />
            ))}
          </span>
          <button type="button" className="lasso-bar__delete" onClick={onDeleteSelected}>
            <Eraser size={14} />
            {t('حذف', 'Delete')}
          </button>
          <button
            type="button"
            className="lasso-bar__cancel"
            onClick={onClearSelection}
            title={t('لغو انتخاب', 'Clear selection')}
          >
            <X size={14} />
          </button>
          <span className="lasso-bar__hint">{t('برای جابه‌جایی، انتخاب را بکشید', 'Drag the selection to move it')}</span>
        </div>
      )}
    </>
  )
}
