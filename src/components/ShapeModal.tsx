import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { ShapeIcon } from './ShapeIcon'
import { useI18n } from '../lib/i18n'
import { SHAPE_KINDS, type ShapeConfig, type ShapeKind } from '../lib/types'

interface ShapeModalProps {
  open: boolean
  onSave: (config: ShapeConfig) => void
  onClose: () => void
}

export function ShapeModal({ open, onSave, onClose }: ShapeModalProps) {
  const { lang, t } = useI18n()
  const [kind, setKind] = useState<ShapeKind>('line')
  const [sides, setSides] = useState('5')
  const [filled, setFilled] = useState(false)
  const [strokeWidth, setStrokeWidth] = useState('1')
  const [bend, setBend] = useState('0.4')

  useEffect(() => {
    if (!open) return
    setKind('line')
    setSides('5')
    setFilled(false)
    setStrokeWidth('1')
    setBend('0.4')
  }, [open])

  return (
    <Modal
      open={open}
      title={t('افزودن شکل یا خط', 'Add shape or line')}
      subtitle={t('نوع شکل را انتخاب کنید، سپس روی صفحه بکشید.', 'Choose a shape, then drag on the page.')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>{t('انصراف', 'Cancel')}</button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() =>
              onSave({
                kind,
                sides: Number(sides) || 5,
                filled,
                strokeWidth: Number(strokeWidth) || 1,
                bend: kind === 'curve-arrow' ? Number(bend) : undefined,
                bend1: kind === 'bezier-arrow' ? Number(bend) : undefined,
                bend2: kind === 'bezier-arrow' ? Number(bend) : undefined,
              })
            }
          >
            {t('انتخاب و رسم', 'Pick and draw')}
          </button>
        </>
      }
    >
      <div className="shape-picker">
        {SHAPE_KINDS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={kind === item.id ? 'is-active' : ''}
            onClick={() => setKind(item.id)}
          >
            <ShapeIcon kind={item.id} />
            <span>{lang === 'en' ? item.nameEn : item.name}</span>
          </button>
        ))}
      </div>
      <div className="form-grid">
        {(kind === 'polygon' || kind === 'star') && (
          <label className="field">
            <span>{t('تعداد گوشه', 'Sides / points')}</span>
            <input type="number" min={3} max={24} value={sides} onChange={(e) => setSides(e.target.value)} dir="ltr" />
          </label>
        )}
        <label className="field">
          <span>{t('ضخامت خط', 'Stroke width')}</span>
          <select value={strokeWidth} onChange={(e) => setStrokeWidth(e.target.value)}>
            <option value="0.7">{t('نازک', 'Thin')}</option>
            <option value="1">{t('متوسط', 'Medium')}</option>
            <option value="1.8">{t('ضخیم', 'Thick')}</option>
          </select>
        </label>
        {(kind === 'curve-arrow' || kind === 'bezier-arrow') && (
          <label className="field">
            <span>{t('انحنا', 'Curvature')}</span>
            <input
              type="range"
              min={-1.2}
              max={1.2}
              step={0.1}
              value={bend}
              onChange={(e) => setBend(e.target.value)}
              dir="ltr"
            />
          </label>
        )}
        {kind !== 'line' && kind !== 'arrow' && kind !== 'curve-arrow' && kind !== 'bezier-arrow' && kind !== 'spiral' && (
          <label className="field field--check">
            <input type="checkbox" checked={filled} onChange={(e) => setFilled(e.target.checked)} />
            <span>{t('توپر', 'Filled')}</span>
          </label>
        )}
      </div>
    </Modal>
  )
}
