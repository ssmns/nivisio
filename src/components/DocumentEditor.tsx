import { useEffect, useState } from 'react'
import { Image, Star } from 'lucide-react'
import { db } from '../lib/db'
import type {
  BnoteDocument,
  Collection,
  DocStatus,
  PageOrientation,
  PageSizeKey,
} from '../lib/types'
import { PAGE_SIZES } from '../lib/types'
import { formatBytes, toFa } from '../lib/utils'
import { CoverPicker } from './CoverPicker'
import { Modal } from './Modal'
import { useToast } from './Toast'
import { useI18n } from '../lib/i18n'

interface DocumentEditorProps {
  doc: BnoteDocument | null
  collections: Collection[]
  open: boolean
  onClose: () => void
}

export function DocumentEditor({ doc, collections, open, onClose }: DocumentEditorProps) {
  const toast = useToast()
  const { lang, t } = useI18n()
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [tags, setTags] = useState('')
  const [status, setStatus] = useState<DocStatus>('unread')
  const [favorite, setFavorite] = useState(false)
  const [saving, setSaving] = useState(false)
  const [coverOpen, setCoverOpen] = useState(false)
  const [pageSize, setPageSize] = useState<PageSizeKey>('a4')
  const [orientation, setOrientation] = useState<PageOrientation>('portrait')
  const [customWidth, setCustomWidth] = useState('148')
  const [customHeight, setCustomHeight] = useState('210')

  useEffect(() => {
    if (!doc) return
    setTitle(doc.title)
    setAuthor(doc.author)
    setCollectionId(doc.collectionId ?? '')
    setTags(doc.tags.join(lang === 'en' ? ', ' : '، '))
    setStatus(doc.status)
    setFavorite(Boolean(doc.favorite))
    setPageSize(doc.pageSize ?? 'a4')
    setOrientation(doc.pageOrientation ?? 'portrait')
    const width = doc.pageWidth ?? PAGE_SIZES[doc.pageSize ?? 'a4'].width
    const height = doc.pageHeight ?? PAGE_SIZES[doc.pageSize ?? 'a4'].height
    setCustomWidth(String(Math.round((width / 72) * 25.4)))
    setCustomHeight(String(Math.round((height / 72) * 25.4)))
  }, [doc, lang])

  if (!doc) return null

  const save = async () => {
    if (!title.trim()) {
      toast.show(t('عنوان نمایشی را وارد کنید.', 'Enter a display title.'), { tone: 'error' })
      return
    }
    setSaving(true)
    const parsedTags = Array.from(
      new Set(
        tags
          .split(/[،,]/)
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ).slice(0, 12)

    let pagePatch: Partial<BnoteDocument> = {}
    if (doc.kind === 'note') {
      const preset = PAGE_SIZES[pageSize] ?? PAGE_SIZES.a4
      let width =
        pageSize === 'custom' ? (Number(customWidth) || 148) * (72 / 25.4) : preset.width
      let height =
        pageSize === 'custom' ? (Number(customHeight) || 210) * (72 / 25.4) : preset.height
      if (orientation === 'landscape' && width < height) [width, height] = [height, width]
      if (orientation === 'portrait' && width > height) [width, height] = [height, width]
      pagePatch = {
        pageSize,
        pageOrientation: orientation,
        pageWidth: width,
        pageHeight: height,
      }
    }
    await db.documents.update(doc.id, {
      title: title.trim(),
      author: author.trim(),
      collectionId: collectionId || undefined,
      tags: parsedTags,
      status,
      favorite: favorite ? 1 : 0,
      ...pagePatch,
    })
    setSaving(false)
    toast.show(t('اطلاعات سند ذخیره شد.', 'Document details saved.'), { tone: 'success' })
    onClose()
  }

  return (
    <>
      <Modal
        open={open}
        title={t('ویرایش سند', 'Edit document')}
        subtitle={
          doc.kind === 'note'
            ? t(
                `یادداشت مستقل · ${toFa(doc.pageCount)} صفحه`,
                `Standalone note · ${toFa(doc.pageCount)} pages`,
              )
            : t(
                `${toFa(doc.pageCount)} صفحه · ${formatBytes(doc.size)}`,
                `${toFa(doc.pageCount)} pages · ${formatBytes(doc.size)}`,
              )
        }
        onClose={onClose}
        wide
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              {t('انصراف', 'Cancel')}
            </button>
            <button type="button" className="btn btn--primary" onClick={save} disabled={saving}>
              {saving ? t('در حال ذخیره…', 'Saving…') : t('ذخیره تغییرات', 'Save changes')}
            </button>
          </>
        }
      >
        <div className="doc-edit">
          <div className="doc-edit__cover">
            <div className="cover-preview cover-preview--small">
              {doc.cover ? <img src={doc.cover} alt="" /> : <Image size={26} />}
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setCoverOpen(true)}
            >
              <Image size={15} />
              {t('تغییر کاور', 'Change cover')}
            </button>
          </div>

          <div className="form-grid doc-edit__fields">
            <label className="field field--full">
              <span>{t('عنوان نمایشی در برنامه', 'Display title in the app')}</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
              <small>
                {t(
                  'این عنوان در کتابخانه دیده می‌شود؛ نام فایل اصلی تغییر نمی‌کند.',
                  'This title appears in the library; the original file name is unchanged.',
                )}
              </small>
            </label>
            <label className="field">
              <span>{t('نویسنده', 'Author')}</span>
              <input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder={t('اختیاری', 'Optional')}
              />
            </label>
            <label className="field">
              <span>{t('دسته / پوشه مطالعاتی', 'Study collection')}</span>
              <select value={collectionId} onChange={(event) => setCollectionId(event.target.value)}>
                <option value="">{t('بدون دسته', 'Uncategorized')}</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </label>
            {doc.kind === 'note' && (
              <>
                <label className="field">
                  <span>{t('اندازه صفحه', 'Page size')}</span>
                  <select
                    value={pageSize}
                    onChange={(event) => setPageSize(event.target.value as PageSizeKey)}
                  >
                    {(Object.keys(PAGE_SIZES) as PageSizeKey[]).map((key) => (
                      <option key={key} value={key}>
                        {lang === 'en' ? PAGE_SIZES[key].nameEn : PAGE_SIZES[key].name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>{t('جهت', 'Orientation')}</span>
                  <select
                    value={orientation}
                    onChange={(event) => setOrientation(event.target.value as PageOrientation)}
                  >
                    <option value="portrait">{t('عمودی', 'Portrait')}</option>
                    <option value="landscape">{t('افقی', 'Landscape')}</option>
                  </select>
                </label>
                {pageSize === 'custom' && (
                  <>
                    <label className="field">
                      <span>{t('عرض (mm)', 'Width (mm)')}</span>
                      <input
                        type="number"
                        value={customWidth}
                        onChange={(event) => setCustomWidth(event.target.value)}
                        dir="ltr"
                      />
                    </label>
                    <label className="field">
                      <span>{t('ارتفاع (mm)', 'Height (mm)')}</span>
                      <input
                        type="number"
                        value={customHeight}
                        onChange={(event) => setCustomHeight(event.target.value)}
                        dir="ltr"
                      />
                    </label>
                  </>
                )}
              </>
            )}
            <label className="field field--full">
              <span>{t('برچسب‌ها', 'Tags')}</span>
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder={t(
                  'مثلاً: برنامه‌نویسی، مرجع، دانشگاه',
                  'e.g. programming, reference, university',
                )}
              />
              <small>{t('برچسب‌ها را با ویرگول جدا کنید.', 'Separate tags with commas.')}</small>
            </label>
            <label className="field">
              <span>{t('وضعیت', 'Status')}</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as DocStatus)}>
                <option value="unread">{t('خوانده‌نشده', 'Unread')}</option>
                <option value="reading">{t('در حال مطالعه', 'Reading')}</option>
                <option value="done">{t('تمام‌شده', 'Completed')}</option>
              </select>
            </label>
            <label className="field field--check">
              <input
                type="checkbox"
                checked={favorite}
                onChange={(event) => setFavorite(event.target.checked)}
              />
              <span>
                <Star size={15} /> {t('موردعلاقه', 'Favorite')}
              </span>
            </label>
            <label className="field field--full">
              <span>
                {doc.kind === 'note'
                  ? t('نوع سند', 'Document type')
                  : t('نام فایل اصلی (ثابت)', 'Original file name (fixed)')}
              </span>
              <input
                value={
                  doc.kind === 'note'
                    ? t('یادداشت مستقل — بدون فایل PDF', 'Standalone note — no PDF file')
                    : doc.fileName
                }
                readOnly
                dir={doc.kind === 'note' ? (lang === 'en' ? 'ltr' : 'rtl') : 'ltr'}
              />
            </label>
          </div>
        </div>
      </Modal>

      <CoverPicker doc={doc} open={coverOpen} onClose={() => setCoverOpen(false)} />
    </>
  )
}
