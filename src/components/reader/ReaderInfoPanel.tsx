import { useEffect, useState } from 'react'
import { BookOpen, Download } from 'lucide-react'
import {
  PAGE_SIZES,
  type BnoteDocument,
  type PageOrientation,
  type PageSizeKey,
} from '../../lib/types'
import {
  formatBytes,
  formatDate,
  formatRelative,
  documentPageSize,
  pageDisplayLabel,
  progressLabel,
  toFa,
} from '../../lib/utils'
import type { LogicalPage } from '../../lib/types'
import { useI18n } from '../../lib/i18n'

interface ReaderInfoPanelProps {
  doc: BnoteDocument
  collectionName?: string
  pageSizeName: string
  pages: LogicalPage[]
  notebookCount: number
  readCount: number
  bookmarkIndex: number
  annotationCount: number
  exporting: { done: number; total: number } | null
  pdfReady: boolean
  onExport: () => void
  onDownloadOriginal: () => void
  onUpdatePage: (patch: Partial<BnoteDocument>) => void
}

export function ReaderInfoPanel({
  doc,
  collectionName,
  pageSizeName,
  pages,
  notebookCount,
  readCount,
  bookmarkIndex,
  annotationCount,
  exporting,
  pdfReady,
  onExport,
  onDownloadOriginal,
  onUpdatePage,
}: ReaderInfoPanelProps) {
  const { lang, t } = useI18n()
  const [customWidth, setCustomWidth] = useState('148')
  const [customHeight, setCustomHeight] = useState('210')

  useEffect(() => {
    if (doc.kind !== 'note') return
    const size = documentPageSize(doc)
    setCustomWidth(String(Math.round((size.width / 72) * 25.4)))
    setCustomHeight(String(Math.round((size.height / 72) * 25.4)))
  }, [doc.kind, doc.pageWidth, doc.pageHeight])

  const applyPageSize = (
    nextSize: PageSizeKey,
    nextOrientation: PageOrientation,
    widthMm = customWidth,
    heightMm = customHeight,
  ) => {
    const preset = PAGE_SIZES[nextSize] ?? PAGE_SIZES.a4
    let width =
      nextSize === 'custom' ? (Number(widthMm) || 148) * (72 / 25.4) : preset.width
    let height =
      nextSize === 'custom' ? (Number(heightMm) || 210) * (72 / 25.4) : preset.height
    if (nextOrientation === 'landscape' && width < height) [width, height] = [height, width]
    if (nextOrientation === 'portrait' && width > height) [width, height] = [height, width]
    onUpdatePage({
      pageSize: nextSize,
      pageOrientation: nextOrientation,
      pageWidth: width,
      pageHeight: height,
    })
  }
  return (
    <div className="doc-info">
      {doc.cover && <img src={doc.cover} alt="" className="doc-info__cover" />}
      <h3>{doc.title}</h3>
      {doc.author && <p className="doc-info__author">{doc.author}</p>}
      <dl>
        <div>
          <dt>{t('نوع سند', 'Document type')}</dt>
          <dd>{doc.kind === 'note' ? t('یادداشت مستقل', 'Standalone note') : 'PDF'}</dd>
        </div>
        {doc.kind !== 'note' && (
          <div>
            <dt>{t('صفحات PDF', 'PDF pages')}</dt>
            <dd>{toFa(doc.pageCount)}</dd>
          </div>
        )}
        <div>
          <dt>{t('برگه‌های یادداشت', 'Note pages')}</dt>
          <dd>{toFa(notebookCount)}</dd>
        </div>
        <div>
          <dt>{t('کل برگ‌ها', 'Total pages')}</dt>
          <dd>{toFa(pages.length)}</dd>
        </div>
        <div>
          <dt>{t('خوانده‌شده', 'Read')}</dt>
          <dd>
            {lang === 'en'
              ? `${toFa(readCount)} of ${toFa(pages.length)}`
              : `${toFa(readCount)} از ${toFa(pages.length)}`}
          </dd>
        </div>
        <div>
          <dt>{t('نشانک', 'Bookmark')}</dt>
          <dd>
            {bookmarkIndex >= 0
              ? pageDisplayLabel(pages[bookmarkIndex], bookmarkIndex, pages)
              : t('ندارد', 'None')}
          </dd>
        </div>
        {doc.kind !== 'note' && (
          <div>
            <dt>{t('حجم فایل', 'File size')}</dt>
            <dd>{formatBytes(doc.size)}</dd>
          </div>
        )}
        {doc.kind === 'note' && (
          <div>
            <dt>{t('اندازه صفحه', 'Page size')}</dt>
            <dd>{pageSizeName}</dd>
          </div>
        )}
        <div>
          <dt>{t('پیشرفت', 'Progress')}</dt>
          <dd>{progressLabel(doc.progress)}</dd>
        </div>
        <div>
          <dt>{t('دسته', 'Category')}</dt>
          <dd>{collectionName ?? t('بدون دسته', 'Uncategorized')}</dd>
        </div>
        <div>
          <dt>{t('وضعیت', 'Status')}</dt>
          <dd>
            {doc.status === 'done'
              ? t('تمام‌شده', 'Completed')
              : doc.status === 'reading'
                ? t('در حال مطالعه', 'Reading')
                : t('خوانده‌نشده', 'Unread')}
          </dd>
        </div>
        <div>
          <dt>{t('افزوده شده', 'Added')}</dt>
          <dd>{formatDate(doc.addedAt)}</dd>
        </div>
        <div>
          <dt>{t('آخرین مطالعه', 'Last read')}</dt>
          <dd>{formatRelative(doc.lastReadAt)}</dd>
        </div>
        <div>
          <dt>{t('نشانه‌ها', 'Marks')}</dt>
          <dd>{toFa(annotationCount)}</dd>
        </div>
      </dl>
      {doc.kind === 'note' && (
        <div className="doc-info__setup">
          <span className="doc-info__setup-title">{t('تنظیم اندازه صفحه', 'Page setup')}</span>
          <div className="doc-info__setup-row">
            <label>
              <span>{t('اندازه', 'Size')}</span>
              <select
                value={doc.pageSize ?? 'a4'}
                onChange={(event) =>
                  applyPageSize(
                    event.target.value as PageSizeKey,
                    doc.pageOrientation ?? 'portrait',
                  )
                }
              >
                {(Object.keys(PAGE_SIZES) as PageSizeKey[]).map((key) => (
                  <option key={key} value={key}>
                    {lang === 'en' ? PAGE_SIZES[key].nameEn : PAGE_SIZES[key].name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t('جهت', 'Orientation')}</span>
              <select
                value={doc.pageOrientation ?? 'portrait'}
                onChange={(event) =>
                  applyPageSize(
                    doc.pageSize ?? 'a4',
                    event.target.value as PageOrientation,
                  )
                }
              >
                <option value="portrait">{t('عمودی', 'Portrait')}</option>
                <option value="landscape">{t('افقی', 'Landscape')}</option>
              </select>
            </label>
          </div>
          {doc.pageSize === 'custom' && (
            <div className="doc-info__setup-row">
              <label>
                <span>{t('عرض (mm)', 'Width (mm)')}</span>
                <input
                  type="number"
                  dir="ltr"
                  value={customWidth}
                  onChange={(event) => setCustomWidth(event.target.value)}
                />
              </label>
              <label>
                <span>{t('ارتفاع (mm)', 'Height (mm)')}</span>
                <input
                  type="number"
                  dir="ltr"
                  value={customHeight}
                  onChange={(event) => setCustomHeight(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() =>
                  applyPageSize('custom', doc.pageOrientation ?? 'portrait')
                }
              >
                {t('اعمال', 'Apply')}
              </button>
            </div>
          )}
        </div>
      )}

      {doc.tags.length > 0 && (
        <div className="doc-info__tags">
          {doc.tags.map((tag) => (
            <span key={tag} className="mini-chip">
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="doc-info__file" dir={doc.kind === 'note' ? (lang === 'en' ? 'ltr' : 'rtl') : 'ltr'}>
        {doc.kind === 'note' ? t('سند یادداشت — فایل PDF ندارد', 'Note document — no PDF file') : doc.fileName}
      </p>
      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={onExport}
        disabled={Boolean(exporting) || (doc.kind !== 'note' && !pdfReady)}
      >
        <Download size={16} />
        {exporting
          ? t(
              `در حال ساخت PDF… ${toFa(exporting.done)}/${toFa(exporting.total)}`,
              `Building PDF… ${toFa(exporting.done)}/${toFa(exporting.total)}`,
            )
          : t('خروجی PDF با نشانه‌ها و برگه‌ها', 'Export PDF with marks and pages')}
      </button>
      {doc.kind !== 'note' && (
        <button type="button" className="btn btn--ghost btn--block" onClick={onDownloadOriginal}>
          <Download size={16} />
          {t('ذخیره نسخه اصلی PDF', 'Save original PDF')}
        </button>
      )}
      <div className="doc-info__hint">
        <BookOpen size={15} />
        <span>
          {t(
            'همه داده‌ها فقط روی همین دستگاه ذخیره می‌شوند. خروجی PDF شامل برگه‌های یادداشت، تصویرها، نمودارها و هایلایت‌هاست.',
            'All data stays on this device. The exported PDF includes note pages, images, charts and highlights.',
          )}
        </span>
      </div>
    </div>
  )
}
