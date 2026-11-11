import { useState } from 'react'
import { db, newId } from '../lib/db'
import { COLLECTION_COLORS } from '../lib/types'
import { Modal } from './Modal'
import { useToast } from './Toast'
import { useI18n } from '../lib/i18n'

interface CollectionModalProps {
  open: boolean
  onClose: () => void
}

export function CollectionModal({ open, onClose }: CollectionModalProps) {
  const toast = useToast()
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(COLLECTION_COLORS[0])

  const reset = () => {
    setName('')
    setColor(COLLECTION_COLORS[0])
  }

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.show(t('نام دسته را وارد کنید.', 'Enter a category name.'), { tone: 'error' })
      return
    }
    const id = newId()
    await db.collections.put({ id, name: trimmed, color, createdAt: Date.now() })
    toast.show(t(`دسته «${trimmed}» ساخته شد.`, `Category “${trimmed}” created.`), { tone: 'success' })
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      title={t('دسته جدید', 'New category')}
      subtitle={t('مطالعات مختلف را در دسته‌های موضوعی جدا کنید.', 'Separate different studies into categories.')}
      onClose={() => {
        reset()
        onClose()
      }}
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            {t('انصراف', 'Cancel')}
          </button>
          <button type="button" className="btn btn--primary" onClick={save}>
            {t('ساخت دسته', 'Create category')}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="field field--full">
          <span>{t('نام دسته', 'Category name')}</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('مثلاً: دانشگاه', 'e.g. University')}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') void save()
            }}
          />
        </label>
        <div className="field field--full">
          <span>{t('رنگ', 'Color')}</span>
          <div className="color-row">
            {COLLECTION_COLORS.map((item) => (
              <button
                key={item}
                type="button"
                className={`color-dot${color === item ? ' is-active' : ''}`}
                style={{ background: item }}
                onClick={() => setColor(item)}
                aria-label={t(`رنگ ${item}`, `Color ${item}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
