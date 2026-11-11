import { useEffect, useState } from 'react'
import { Bold, Italic } from 'lucide-react'
import {
  ANNOTATION_CATEGORIES,
  INK_COLORS,
  TEXT_SIZES,
  type TextAlign,
  type TextStyle,
  type TextVerticalAlign,
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
  initialVerticalAlign?: TextVerticalAlign
  initialTextStyle?: TextStyle
  initialCategory?: string
  onSave: (value: {
    text: string
    fontSize: number
    color: string
    textAlign: TextAlign
    verticalAlign: TextVerticalAlign
    textStyle: TextStyle
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
  initialVerticalAlign,
  initialTextStyle,
  initialCategory,
  onSave,
  onClose,
}: TextModalProps) {
  const { lang, t } = useI18n()
  const [text, setText] = useState('')
  const [size, setSize] = useState(0.024)
  const [color, setColor] = useState<string>(INK_COLORS[0].value)
  const [align, setAlign] = useState<TextAlign>('right')
  const [verticalAlign, setVerticalAlign] = useState<TextVerticalAlign>('top')
  const [textStyle, setTextStyle] = useState<TextStyle>('normal')
  const [category, setCategory] = useState('عمومی')

  useEffect(() => {
    if (!open) return
    setText(initialText ?? '')
    setSize(initialSize ?? 0.024)
    setColor(initialColor ?? INK_COLORS[0].value)
    setAlign(initialAlign ?? 'right')
    setVerticalAlign(initialVerticalAlign ?? 'top')
    setTextStyle(initialTextStyle ?? 'normal')
    setCategory(initialCategory ?? 'عمومی')
  }, [open, initialText, initialSize, initialColor, initialAlign, initialVerticalAlign, initialTextStyle, initialCategory])

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
            onClick={() =>
              onSave({
                text,
                fontSize: size,
                color,
                textAlign: align,
                verticalAlign,
                textStyle,
                category,
              })
            }
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
        <div className="field field--full">
          <span>{t('اندازه فونت', 'Font size')}</span>
          <div className="font-size-control">
            <input
              type="range"
              min="0.012"
              max="0.08"
              step="0.002"
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
              aria-label={t('اندازه فونت', 'Font size')}
            />
            <strong>{Math.round(size * 1000)}</strong>
          </div>
          <div className="font-size-presets">
            {TEXT_SIZES.map((item) => (
              <button
                key={item.name}
                type="button"
                className={Math.abs(size - item.value) < 0.001 ? 'is-active' : ''}
                onClick={() => setSize(item.value)}
              >
                {lang === 'en' ? item.nameEn : item.name}
              </button>
            ))}
            <button
              type="button"
              className={size >= 0.05 ? 'is-active' : ''}
              onClick={() => setSize(0.05)}
            >
              {t('خیلی بزرگ', 'XL')}
            </button>
          </div>
        </div>
        <div className="field field--full">
          <span>{t('استایل متن', 'Text style')}</span>
          <div className="text-style-picker">
            <button
              type="button"
              className={textStyle === 'normal' ? 'is-active' : ''}
              onClick={() => setTextStyle('normal')}
            >
              {t('عادی', 'Normal')}
            </button>
            <button
              type="button"
              className={textStyle === 'bold' ? 'is-active' : ''}
              onClick={() => setTextStyle('bold')}
            >
              <Bold size={13} /> {t('بولد', 'Bold')}
            </button>
            <button
              type="button"
              className={textStyle === 'italic' ? 'is-active' : ''}
              onClick={() => setTextStyle('italic')}
            >
              <Italic size={13} /> {t('ایتالیک', 'Italic')}
            </button>
            <button
              type="button"
              className={textStyle === 'bold-italic' ? 'is-active' : ''}
              onClick={() => setTextStyle('bold-italic')}
            >
              <Bold size={13} />
              <Italic size={13} />
            </button>
          </div>
        </div>
        <label className="field">
          <span>{t('تراز افقی', 'Horizontal align')}</span>
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
          <span>{t('تراز عمودی', 'Vertical align')}</span>
          <select
            value={verticalAlign}
            onChange={(event) => setVerticalAlign(event.target.value as TextVerticalAlign)}
          >
            <option value="top">{t('بالا', 'Top')}</option>
            <option value="middle">{t('وسط', 'Middle')}</option>
            <option value="bottom">{t('پایین', 'Bottom')}</option>
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
        <div
          className="text-preview"
          dir="auto"
          style={{
            color,
            fontSize: Math.max(14, Math.min(38, Math.round(size * 600))),
            textAlign: align,
            fontWeight: textStyle.includes('bold') ? 700 : 500,
            fontStyle: textStyle.includes('italic') ? 'italic' : 'normal',
          }}
        >
          {text || t('پیش‌نمایش متن', 'Text preview')}
        </div>
      </div>
    </Modal>
  )
}
