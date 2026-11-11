import { useRef, useState } from 'react'
import { ImagePlus, RotateCcw, Upload } from 'lucide-react'
import { db } from '../lib/db'
import { COVER_PRESETS, type BnoteDocument } from '../lib/types'
import { coverPresetDataUrl, imageFileToDataUrl } from '../lib/utils'
import { Modal } from './Modal'
import { useToast } from './Toast'
import { useI18n } from '../lib/i18n'

interface CoverPickerProps {
  doc: BnoteDocument
  open: boolean
  onClose: () => void
}

export function CoverPicker({ doc, open, onClose }: CoverPickerProps) {
  const toast = useToast()
  const { lang, t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const applyCover = async (cover?: string, messageFa = 'کاور تغییر کرد.', messageEn = 'Cover updated.') => {
    await db.documents.update(doc.id, { cover })
    toast.show(t(messageFa, messageEn), { tone: 'success' })
  }

  const upload = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.show(t('فایل انتخاب‌شده تصویر نیست.', 'The selected file is not an image.'), { tone: 'error' })
      return
    }
    setBusy(true)
    try {
      const dataUrl = await imageFileToDataUrl(file, 900)
      await applyCover(
        dataUrl,
        'کاور سفارشی ذخیره شد.',
        'Custom cover saved.',
      )
    } catch (error) {
      toast.show(
        error instanceof Error ? error.message : t('بارگذاری تصویر ناموفق بود.', 'Image upload failed.'),
        { tone: 'error' },
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title={t('انتخاب کاور', 'Choose cover')}
      subtitle={t(
        'کاور فقط ظاهر کارت کتابخانه را تغییر می‌دهد و روی فایل PDF اثری ندارد.',
        'The cover only changes the library card; it does not modify the PDF file.',
      )}
      onClose={onClose}
      wide
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              void applyCover(
                doc.autoCover,
                'کاور اصلی PDF بازگردانده شد.',
                'Original PDF cover restored.',
              )
            }}
          >
            <RotateCcw size={15} />
            {t('کاور اصلی PDF', 'Original PDF cover')}
          </button>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            {t('بستن', 'Close')}
          </button>
        </>
      }
    >
      <div className="cover-picker">
        <div className="cover-picker__current">
          <div className="cover-preview">
            {doc.cover ? <img src={doc.cover} alt={t('کاور فعلی', 'Current cover')} /> : <ImagePlus size={30} />}
          </div>
          <div>
            <strong>{doc.title}</strong>
            <p>{t('کاور فعلی', 'Current cover')}</p>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              <Upload size={15} />
              {busy ? t('در حال ذخیره…', 'Saving…') : t('بارگذاری تصویر', 'Upload image')}
            </button>
          </div>
        </div>

        <div className="cover-picker__grid">
          {COVER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="cover-option"
              onClick={() => {
                void applyCover(
                  coverPresetDataUrl(preset),
                  'کاور آماده انتخاب شد.',
                  'Preset cover applied.',
                )
              }}
              title={lang === 'en' ? preset.nameEn : preset.name}
            >
              <span className="cover-option__art">
                <img src={coverPresetDataUrl(preset)} alt="" />
              </span>
              <span>{lang === 'en' ? preset.nameEn : preset.name}</span>
            </button>
          ))}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          void upload(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </Modal>
  )
}
