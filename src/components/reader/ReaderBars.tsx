import {
  Bandage,
  BarChart3,
  Eraser,
  Image as ImageIcon,
  Lasso,
  RotateCcw,
  RotateCw,
  Pencil,
  Ruler,
  Shapes,
  Trash2,
  Type,
  X,
} from 'lucide-react'
import { INK_COLORS, type Annotation } from '../../lib/types'
import { annotationLabel, toFa } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'

interface ReaderBarsProps {
  tool: string
  activeObject: Annotation | null
  selectedAnnotations: Annotation[]
  onRotateObject: (delta: number) => void
  onEditObject: (annotation: Annotation) => void
  onDeleteObject: (annotation: Annotation) => void
  onCloseObject: () => void
  onRecolorSelected: (color: string) => void
  onDeleteSelected: () => void
  onClearSelection: () => void
}

const iconFor = (annotation: Annotation) => {
  if (annotation.type === 'chart') return BarChart3
  if (annotation.type === 'image') return ImageIcon
  if (annotation.type === 'shape') return Shapes
  if (annotation.type === 'guide') return Ruler
  if (annotation.type === 'text') return Type
  return Bandage
}

export function ReaderBars({
  tool,
  activeObject,
  selectedAnnotations,
  onRotateObject,
  onEditObject,
  onDeleteObject,
  onCloseObject,
  onRecolorSelected,
  onDeleteSelected,
  onClearSelection,
}: ReaderBarsProps) {
  const { t } = useI18n()
  const canRotate =
    activeObject &&
    ['tape', 'image', 'chart', 'shape', 'guide', 'text'].includes(activeObject.type)
  const Icon = activeObject ? iconFor(activeObject) : Bandage
  return (
    <>
      {activeObject && tool === 'select' && (
        <div className="object-bar">
          <span className="object-bar__title">
            <Icon size={15} />
            {annotationLabel(activeObject)}
          </span>
          {activeObject.type === 'chart' && (
            <button type="button" onClick={() => onEditObject(activeObject)}>
              <Pencil size={14} />
              {t('ویرایش', 'Edit')}
            </button>
          )}
          {canRotate && (
            <>
              <button
                type="button"
                onClick={() => onRotateObject(-15)}
                title={t('چرخش ۱۵ درجه به چپ', 'Rotate 15° left')}
              >
                <RotateCcw size={14} />
                {t('چرخش', 'Rotate')}
              </button>
              <button
                type="button"
                onClick={() => onRotateObject(15)}
                title={t('چرخش ۱۵ درجه به راست', 'Rotate 15° right')}
              >
                <RotateCw size={14} />
                {t('چرخش', 'Rotate')}
              </button>
            </>
          )}
          <button
            type="button"
            className="object-bar__delete"
            onClick={() => onDeleteObject(activeObject)}
          >
            <Trash2 size={14} />
            {t('حذف', 'Delete')}
          </button>
          <button
            type="button"
            className="object-bar__close"
            onClick={onCloseObject}
            title={t('بستن انتخاب', 'Clear selection')}
            aria-label={t('بستن انتخاب', 'Clear selection')}
          >
            <X size={14} />
          </button>
          <span className="object-bar__hint">
            {canRotate
              ? t(
                  'دستگیره‌ها: تغییر اندازه و چرخش · رنگ از پالت',
                  'Handles: resize and rotate · palette: color',
                )
              : t('برای حذف از دکمهٔ حذف استفاده کنید', 'Use the delete button to remove this mark')}
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
          <span className="lasso-bar__hint">
            {t('برای جابه‌جایی، انتخاب را بکشید', 'Drag the selection to move it')}
          </span>
        </div>
      )}
    </>
  )
}
