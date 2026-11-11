import { useEffect, useState } from 'react'
import {
  ANNOTATION_CATEGORIES,
  INK_COLORS,
  TEXT_SIZES,
  type TextAlign,
} from '../lib/types'
import { Modal } from './Modal'
import { useI18n } from '../lib/i18n'
import { categoryLabel } from '../lib/utils'

interface TextModalProps {
  open: boolean
  initialText?: string
  initialSize?: number
  initialColor?: string
  initialAlign?: TextAlign
  initialCategory?: string
  onSave: (value: {
    text: string
    fontSize: number
    color: string
    textAlign: TextAlign
    category: string
  }) => void
  onClose: () => void
}

export function TextModal({
  open,
  initialText,
  initialSize,
  initialColor,
  initialAlign,
  initialCategory,
  onSave,
  onClose,
}: TextModalProps) {
  const { lang, t } = useI18n()
  const [text, setText] = useState('')
  const [size, setSize] = useState(0.024)
  const [color, setColor] = useState<string>(INK_COLORS[0].value)
  const [align, setAlign] = useState<TextAlign>('right')
  const [category, setCategory] = useState('عمومی')

  useEffect(() => {
    if (!open) return
    setText(initialText ?? '')
    setSize(initialSize ?? 0.024)
    setColor(initialColor ?? INK_COLORS[0].value)
    setAlign(initialAlign ?? 'right')
    setCategory(initialCategory ?? 'عمومی')
  }, [open, initialText, initialSize, initialColor, initialAlign, initialCategory])

  return (
    <Modal
      open={open}
      title={initialText ? t('ویرایش متن', 'Edit text') : t('افزودن متن', 'Add text')}
      subtitle={t('فارسی، انگلیسی و متن‌های ترکیبی پشتیبانی می‌شوند.', 'Persian, English and mixed-direction text are supported.')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t('انصراف', 'Cancel')}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onSave({ text, fontSize: size, color, textAlign: align, category })}
            disabled={!text.trim()}
          >
            {t('ذخیره متن', 'Save text')}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="field field--full">
          <span>{t('متن', 'Text')}</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={4}
            autoFocus
            dir="auto"
            placeholder={t('متن فارسی یا English را اینجا بنویسید…', 'Write Persian or English text here…')}
          />
        </label>
        <label className="field">
          <span>{t('اندازه', 'Size')}</span>
          <select value={size} onChange={(event) => setSize(Number(event.target.value))}>
            {TEXT_SIZES.map((item) => (
              <option key={item.name} value={item.value}>
                {lang === 'en' ? item.nameEn : item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t('تراز', 'Align')}</span>
          <select
            value={align}
            onChange={(event) => setAlign(event.target.value as TextAlign)}
          >
            <option value="right">{t('راست', 'Right')}</option>
            <option value="center">{t('وسط', 'Center')}</option>
            <option value="left">{t('چپ', 'Left')}</option>
          </select>
        </label>
        <label className="field">
          <span>{t('دسته مطالعاتی', 'Study category')}</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {ANNOTATION_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {categoryLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>{t('رنگ', 'Color')}</span>
          <div className="color-row">
            {INK_COLORS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`color-dot color-dot--sm${color === item.value ? ' is-active' : ''}`}
                style={{ background: item.value }}
                onClick={() => setColor(item.value)}
                aria-label={lang === 'en' ? item.nameEn : item.name}
              />
            ))}
          </div>
        </div>
        <div className="text-preview" dir="auto" style={{ color, fontSize: 18, textAlign: align }}>
          {text || t('پیش‌نمایش متن', 'Text preview')}
        </div>
      </div>
    </Modal>
  )
}
