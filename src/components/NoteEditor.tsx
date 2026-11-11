import { useEffect, useState } from 'react'
import { ANNOTATION_CATEGORIES } from '../lib/types'
import { categoryLabel } from '../lib/utils'
import { Modal } from './Modal'
import { useI18n } from '../lib/i18n'

interface NoteEditorProps {
  open: boolean
  title: string
  subtitle?: string
  initialValue: string
  initialCategory?: string
  onSave: (text: string, category: string) => void
  onClose: () => void
}

export function NoteEditor({
  open,
  title,
  subtitle,
  initialValue,
  initialCategory,
  onSave,
  onClose,
}: NoteEditorProps) {
  const { t } = useI18n()
  const [value, setValue] = useState(initialValue)
  const [category, setCategory] = useState(initialCategory ?? 'عمومی')

  useEffect(() => {
    if (!open) return
    setValue(initialValue)
    setCategory(initialCategory ?? 'عمومی')
  }, [open, initialValue, initialCategory])

  return (
    <Modal
      open={open}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t('انصراف', 'Cancel')}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onSave(value, category)}
          >
            {t('ذخیره یادداشت', 'Save note')}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="field field--full">
          <span>{t('متن یادداشت', 'Note text')}</span>
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            rows={5}
            autoFocus
            placeholder={t('برداشت، سؤال یا نکته‌ی خود را بنویسید…', 'Write your takeaway, question or idea…')}
          />
        </label>
        <label className="field field--full">
          <span>{t('دسته مطالعاتی', 'Study category')}</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {ANNOTATION_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {categoryLabel(item)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Modal>
  )
}
