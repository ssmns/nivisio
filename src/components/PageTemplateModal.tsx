import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { GRID_SCALES, GRID_TYPES, type GridType } from '../lib/types'
import { Modal } from './Modal'
import { useI18n } from '../lib/i18n'

interface PageTemplateModalProps {
  open: boolean
  mode: 'create' | 'edit'
  initialGrid?: GridType
  initialGridScale?: number
  pageLabel?: string
  onSave: (grid: GridType, gridScale: number) => void
  onDelete?: () => void
  onClose: () => void
}

export function PageTemplateModal({
  open,
  mode,
  initialGrid = 'lined',
  initialGridScale = 1,
  pageLabel,
  onSave,
  onDelete,
  onClose,
}: PageTemplateModalProps) {
  const { lang, t } = useI18n()
  const [grid, setGrid] = useState<GridType>(initialGrid)
  const [gridScale, setGridScale] = useState(initialGridScale)

  useEffect(() => {
    if (open) {
      setGrid(initialGrid)
      setGridScale(initialGridScale)
    }
  }, [open, initialGrid, initialGridScale])

  return (
    <Modal
      open={open}
      title={mode === 'create' ? t('افزودن برگه یادداشت', 'Add note page') : t('تنظیمات برگه', 'Page settings')}
      subtitle={
        mode === 'create'
          ? t('یک برگه با گرید دلخواه بعد از صفحه فعلی درج می‌شود.', 'A page with your chosen grid is inserted after the current page.')
          : pageLabel
      }
      onClose={onClose}
      footer={
        <>
          {mode === 'edit' && onDelete && (
            <button
              type="button"
              className="btn btn--danger btn--block-start"
              onClick={onDelete}
            >
              <Trash2 size={15} />
              {t('حذف برگه', 'Delete page')}
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t('انصراف', 'Cancel')}
          </button>
          <button type="button" className="btn btn--primary" onClick={() => onSave(grid, gridScale)}>
            {mode === 'create' ? t('درج برگه', 'Insert page') : t('ذخیره', 'Save')}
          </button>
        </>
      }
    >
      <div className="grid-picker">
        {GRID_TYPES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`grid-option${grid === item.id ? ' is-active' : ''}`}
            onClick={() => setGrid(item.id)}
          >
            <span className={`grid-preview grid-preview--${item.id}`} />
            <strong>{lang === 'en' ? item.nameEn : item.name}</strong>
            <em>{lang === 'en' ? item.hintEn : item.hint}</em>
          </button>
        ))}
      </div>
      <div className="field" style={{ marginTop: 14 }}>
        <span>{t('تراکم گرید', 'Grid density')}</span>
        <div className="density-options">
          {GRID_SCALES.map((item) => (
            <button
              key={item.value}
              type="button"
              className={gridScale === item.value ? 'is-active' : ''}
              onClick={() => setGridScale(item.value)}
            >
              {lang === 'en' ? item.nameEn : item.name}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
