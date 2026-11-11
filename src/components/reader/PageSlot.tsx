import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react'
import { PdfPage, type PageViewProps } from '../PdfPage'
import type { BnoteDocument, LogicalPage } from '../../lib/types'
import { pageDisplayLabel, toFa } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'

export type PageSurfaceProps = Omit<
  PageViewProps,
  'pdfPageNumber' | 'notebook' | 'pageKey'
>

interface PageSlotProps {
  doc: BnoteDocument
  page: LogicalPage
  index: number
  pages: LogicalPage[]
  currentKey: string
  mounted: boolean
  estimatedHeight: number
  surface: PageSurfaceProps
  onToggleRead: (key: string) => void
  onToggleBookmark: (key: string) => void
  onMountRef: (key: string, element: HTMLDivElement | null) => void
}

export function PageSlot({
  doc,
  page,
  index,
  pages,
  currentKey,
  mounted,
  estimatedHeight,
  surface,
  onToggleRead,
  onToggleBookmark,
  onMountRef,
}: PageSlotProps) {
  const { t } = useI18n()
  const key = page.key
  const pageIsCurrent = key === currentKey
  const pageRead = Boolean(doc.readPages?.[key])
  const pageBookmarked = doc.bookmarkKey === key
  const pageAnnotations =
    surface.annotations?.filter((annotation) => annotation.pageRef === key) ?? []

  return (
    <div
      className={`page-slot${pageIsCurrent ? ' is-current' : ''}${
        mounted ? '' : ' page-slot--placeholder'
      }`}
      data-page-key={key}
      ref={(element) => onMountRef(key, element)}
    >
      <div className="page-slot__bar">
        <span className="page-slot__label">{pageDisplayLabel(page, index, pages)}</span>
        <span className="page-slot__count">
          {toFa(index + 1)} {t('از', 'of')} {toFa(pages.length)}
        </span>
        <button
          type="button"
          className={`page-slot__toggle${pageRead ? ' is-active' : ''}`}
          onClick={() => onToggleRead(key)}
          aria-pressed={pageRead}
          title={
            pageRead
              ? t('علامت‌گذاری به‌عنوان خوانده‌نشده', 'Mark as unread')
              : t('علامت‌گذاری به‌عنوان خوانده‌شده', 'Mark as read')
          }
        >
          {pageRead ? <CheckCircle2 size={14} /> : <Circle size={14} />}
          {pageRead ? t('خوانده‌شده', 'Read') : t('نخوانده', 'Unread')}
        </button>
        <button
          type="button"
          className={`page-slot__toggle${pageBookmarked ? ' is-active' : ''}`}
          onClick={() => onToggleBookmark(key)}
          aria-pressed={pageBookmarked}
          title={pageBookmarked ? t('برداشتن نشانک', 'Remove bookmark') : t('نشانک این برگ', 'Bookmark this page')}
        >
          {pageBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          {t('نشانک', 'Bookmark')}
        </button>
      </div>

      {mounted ? (
        <PdfPage
          {...surface}
          pageKey={key}
          pdfPageNumber={page.kind === 'pdf' ? page.pdfPage : undefined}
          notebook={page.kind === 'note' ? page.notebook : undefined}
          annotations={pageAnnotations}
        />
      ) : (
        <div className="page-placeholder" style={{ height: estimatedHeight }}>
          <Loader2 size={20} className="spin" />
          <span>{t('برای بارگذاری اسکرول کنید', 'Scroll to load')}</span>
        </div>
      )}
    </div>
  )
}
