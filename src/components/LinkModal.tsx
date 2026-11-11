import { useEffect, useMemo, useState } from 'react'
import { FileText, Globe2, Link2, MapPin } from 'lucide-react'
import type { BnoteDocument, LinkInfo, LinkKind, LogicalPage } from '../lib/types'
import { isSafeExternalUrl, pageDisplayLabel, toFa } from '../lib/utils'
import { Modal } from './Modal'
import { useToast } from './Toast'
import { useI18n } from '../lib/i18n'

interface LinkModalProps {
  open: boolean
  docs: BnoteDocument[]
  pages: LogicalPage[]
  currentDocId: string
  currentPageKey: string
  onSave: (link: LinkInfo) => void
  onClose: () => void
}

const KINDS: { id: LinkKind; label: string; labelEn: string; icon: typeof Globe2 }[] = [
  { id: 'external', label: 'آدرس بیرونی', labelEn: 'External URL', icon: Globe2 },
  { id: 'page', label: 'صفحه همین سند', labelEn: 'Page in this document', icon: MapPin },
  { id: 'document', label: 'سند دیگر', labelEn: 'Another document', icon: FileText },
]

export function LinkModal({
  open,
  docs,
  pages,
  currentDocId,
  currentPageKey,
  onSave,
  onClose,
}: LinkModalProps) {
  const toast = useToast()
  const { lang, t } = useI18n()
  const [kind, setKind] = useState<LinkKind>('external')
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [pageKey, setPageKey] = useState(currentPageKey)
  const [docId, setDocId] = useState('')
  const [page, setPage] = useState('1')

  const otherDocs = useMemo(
    () => docs.filter((doc) => doc.id !== currentDocId),
    [docs, currentDocId],
  )

  useEffect(() => {
    if (!open) return
    setKind('external')
    setUrl('')
    setLabel('')
    setPageKey(currentPageKey)
    setDocId(otherDocs[0]?.id ?? '')
    setPage('1')
  }, [open, currentPageKey, otherDocs])

  const save = () => {
    if (kind === 'external') {
      const trimmed = url.trim()
      if (!isSafeExternalUrl(trimmed)) {
        toast.show(t('آدرس باید با http:// یا https:// شروع شود.', 'The address must start with http:// or https://.'), { tone: 'error' })
        return
      }
      onSave({ kind, url: trimmed, label: label.trim() || trimmed })
      return
    }
    if (kind === 'page') {
      onSave({ kind, pageKey, label: label.trim() || t('رفتن به صفحه', 'Go to page') })
      return
    }
    if (!docId) {
      toast.show(t('برای پیوند به سند دیگر، یک سند انتخاب کنید.', 'Choose a document for this link.'), { tone: 'error' })
      return
    }
    const target = otherDocs.find((doc) => doc.id === docId)
    const pageNumber = Math.min(
      Math.max(1, Number(page) || 1),
      Math.max(1, target?.pageCount ?? 1),
    )
    onSave({
      kind,
      docId,
      page: pageNumber,
      label: label.trim() || target?.title || t('رفتن به سند دیگر', 'Go to another document'),
    })
  }

  const selectedDoc = otherDocs.find((doc) => doc.id === docId)

  return (
    <Modal
      open={open}
      title={t('افزودن پیوند', 'Add link')}
      subtitle={t(
        'پیوند به وب، صفحه‌ای از همین سند یا یک PDF دیگر.',
        'Link to the web, a page in this document, or another PDF.',
      )}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {t('انصراف', 'Cancel')}
          </button>
          <button type="button" className="btn btn--primary" onClick={save}>
            <Link2 size={15} />
            {t('ثبت پیوند', 'Save link')}
          </button>
        </>
      }
    >
      <div className="link-kinds">
        {KINDS.map(({ id, label: kindLabel, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={kind === id ? 'is-active' : ''}
            onClick={() => setKind(id)}
          >
            <Icon size={16} />
            {lang === 'en' ? KINDS.find((item) => item.id === id)?.labelEn : kindLabel}
          </button>
        ))}
      </div>

      <div className="form-grid">
        {kind === 'external' && (
          <label className="field field--full">
            <span>{t('آدرس', 'Address')}</span>
            <input
              dir="ltr"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/article"
              autoFocus
            />
          </label>
        )}

        {kind === 'page' && (
          <label className="field field--full">
            <span>{t('مقصد در همین سند', 'Destination in this document')}</span>
            <select value={pageKey} onChange={(event) => setPageKey(event.target.value)}>
              {pages.map((item, index) => (
                <option key={item.key} value={item.key}>
                  {t('برگ', 'Page')} {toFa(index + 1)} — {pageDisplayLabel(item, index, pages)}
                </option>
              ))}
            </select>
          </label>
        )}

        {kind === 'document' && (
          <>
            <label className="field field--full">
              <span>{t('سند مقصد', 'Destination document')}</span>
              <select value={docId} onChange={(event) => setDocId(event.target.value)}>
                {otherDocs.length === 0 && (
                  <option value="">{t('سند دیگری وجود ندارد', 'No other documents')}</option>
                )}
                {otherDocs.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t('شماره صفحه', 'Page number')}</span>
              <input
                type="number"
                min={1}
                max={selectedDoc?.pageCount ?? 1}
                value={page}
                onChange={(event) => setPage(event.target.value)}
                dir="ltr"
              />
            </label>
            <div className="field">
              <span>{t('تعداد صفحات مقصد', 'Destination page count')}</span>
              <input value={toFa(selectedDoc?.pageCount ?? 0)} readOnly />
            </div>
          </>
        )}

        <label className="field field--full">
          <span>{t('برچسب نمایشی (اختیاری)', 'Display label (optional)')}</span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={t('مثلاً: بخش منابع', 'e.g. Resources section')}
          />
        </label>
      </div>
    </Modal>
  )
}
