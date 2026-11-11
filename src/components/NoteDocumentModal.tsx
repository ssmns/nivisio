import { useEffect, useState } from 'react'
import { FilePlus2 } from 'lucide-react'
import {
  COVER_PRESETS,
  GRID_SCALES,
  GRID_TYPES,
  type GridType,
  type PageOrientation,
  type PageSizeKey,
} from '../lib/types'
import type { NewNoteInput } from '../lib/noteDocument'
import { Modal } from './Modal'
import { OrientationPicker } from './OrientationPicker'
import { PageSizePicker } from './PageSizePicker'
import { useToast } from './Toast'
import { useI18n } from '../lib/i18n'

export type { NewNoteInput }

interface NoteDocumentModalProps {
  open: boolean
  onSave: (input: NewNoteInput) => void
  onClose: () => void
}

export function NoteDocumentModal({ open, onSave, onClose }: NoteDocumentModalProps) {
  const toast = useToast()
  const { lang, t } = useI18n()
  const [title, setTitle] = useState('')
  const [pageSize, setPageSize] = useState<PageSizeKey>('a4')
  const [grid, setGrid] = useState<GridType>('lined')
  const [pageCount, setPageCount] = useState('1')
  const [coverPreset, setCoverPreset] = useState(0)
  const [orientation, setOrientation] = useState<PageOrientation>('portrait')
  const [gridScale, setGridScale] = useState(1)
  const [customWidth, setCustomWidth] = useState('148')
  const [customHeight, setCustomHeight] = useState('210')

  useEffect(() => {
    if (!open) return
    setTitle('')
    setPageSize('a4')
    setGrid('lined')
    setPageCount('1')
    setCoverPreset(0)
    setOrientation('portrait')
    setGridScale(1)
    setCustomWidth('148')
    setCustomHeight('210')
  }, [open])

  const save = () => {
    if (!title.trim()) {
      toast.show(t('عنوان یادداشت را وارد کنید.', 'Enter a note title.'), { tone: 'error' })
      return
    }
    const count = Math.min(30, Math.max(1, Number(pageCount) || 1))
    onSave({
      title: title.trim(),
      pageSize,
      pageOrientation: orientation,
      customWidthMm: Number(customWidth) || 148,
      customHeightMm: Number(customHeight) || 210,
      grid,
      gridScale,
      pageCount: count,
      coverPreset,
    })
  }

  return (
    <Modal
      open={open}
      title={t('یادداشت جدید', 'New note')}
      subtitle={t('یک سند مستقل بدون PDF؛ اندازه و گرید پیش‌فرض را انتخاب کنید.', 'A standalone note without a PDF; choose size and default grid.')}
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t('انصراف', 'Cancel')}
          </button>
          <button type="button" className="btn btn--primary" onClick={save}>
            <FilePlus2 size={15} />
            {t('ساخت یادداشت', 'Create note')}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="field field--full">
          <span>{t('عنوان یادداشت', 'Note title')}</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t('مثلاً: یادداشت‌های جلسه', 'e.g. Meeting notes')}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') save()
            }}
          />
        </label>
        <div className="field field--full">
          <span>{t('اندازه صفحه', 'Page size')}</span>
          <PageSizePicker value={pageSize} onChange={setPageSize} />
        </div>
        <div className="field">
          <span>{t('جهت صفحه', 'Orientation')}</span>
          <OrientationPicker value={orientation} onChange={setOrientation} />
        </div>
        <label className="field">
          <span>{t('تراکم گرید', 'Grid density')}</span>
          <select
            value={gridScale}
            onChange={(event) => setGridScale(Number(event.target.value))}
          >
            {GRID_SCALES.map((item) => (
              <option key={item.value} value={item.value}>
                {lang === 'en' ? item.nameEn : item.name}
              </option>
            ))}
          </select>
        </label>
        {pageSize === 'custom' && (
          <>
            <label className="field">
              <span>{t('عرض (میلی‌متر)', 'Width (mm)')}</span>
              <input
                type="number"
                min={50}
                max={1000}
                value={customWidth}
                onChange={(event) => setCustomWidth(event.target.value)}
                dir="ltr"
              />
            </label>
            <label className="field">
              <span>{t('ارتفاع (میلی‌متر)', 'Height (mm)')}</span>
              <input
                type="number"
                min={50}
                max={1000}
                value={customHeight}
                onChange={(event) => setCustomHeight(event.target.value)}
                dir="ltr"
              />
            </label>
          </>
        )}
        <label className="field">
          <span>{t('تعداد صفحات اولیه', 'Initial pages')}</span>
          <input
            type="number"
            min={1}
            max={30}
            value={pageCount}
            onChange={(event) => setPageCount(event.target.value)}
            dir="ltr"
          />
        </label>
      </div>

      <div className="field" style={{ marginTop: 14 }}>
        <span>{t('گرید پیش‌فرض همه صفحات', 'Default grid for all pages')}</span>
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
      </div>

      <div className="field" style={{ marginTop: 14 }}>
        <span>{t('رنگ کاور', 'Cover color')}</span>
        <div className="cover-picker__grid cover-picker__grid--compact">
          {COVER_PRESETS.map((preset, index) => (
            <button
              key={preset.id}
              type="button"
              className={`cover-option${coverPreset === index ? ' is-active' : ''}`}
              onClick={() => setCoverPreset(index)}
              title={lang === 'en' ? preset.nameEn : preset.name}
            >
              <span
                className="cover-option__art cover-option__art--solid"
                style={{
                  background: `linear-gradient(145deg, ${preset.from}, ${preset.to})`,
                }}
              />
              <span>{lang === 'en' ? preset.nameEn : preset.name}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="note-size-hint">
        {t(
          'هر صفحه بعداً می‌تواند گرید خودش را داشته باشد؛ اندازه صفحه برای کل یادداشت است.',
          'Each page can change its grid later; page size applies to the whole note.',
        )}
      </p>
    </Modal>
  )
}
