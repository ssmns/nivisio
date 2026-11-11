import { Highlighter, Info, LibraryBig, X } from 'lucide-react'
import type { Annotation, BnoteDocument, LogicalPage } from '../../lib/types'
import { useI18n } from '../../lib/i18n'
import { AnnotationsPanel } from '../AnnotationsPanel'
import { ReaderAssetsPanel } from './ReaderAssetsPanel'
import { ReaderInfoPanel } from './ReaderInfoPanel'

interface ReaderPanelProps {
  doc: BnoteDocument
  pages: LogicalPage[]
  annotations: Annotation[]
  currentKey: string
  panelTab: 'notes' | 'info' | 'assets'
  selectedId: string | null
  collectionName?: string
  pageSizeName: string
  notebookCount: number
  readCount: number
  bookmarkIndex: number
  exporting: { done: number; total: number } | null
  pdfReady: boolean
  onTab: (tab: 'notes' | 'info' | 'assets') => void
  onClose: () => void
  onSelect: (annotation: Annotation) => void
  onEdit: (annotation: Annotation) => void
  onDelete: (annotation: Annotation) => void
  onUpdate: (id: string, patch: Partial<Annotation>) => void
  onReorder: (pageRef: string, ids: string[]) => void
  onExport: () => void
  onDownloadOriginal: () => void
  onUpdatePage: (patch: Partial<BnoteDocument>) => void
}

export function ReaderPanel({
  doc,
  pages,
  annotations,
  currentKey,
  panelTab,
  selectedId,
  collectionName,
  pageSizeName,
  notebookCount,
  readCount,
  bookmarkIndex,
  exporting,
  pdfReady,
  onTab,
  onClose,
  onSelect,
  onEdit,
  onDelete,
  onUpdate,
  onReorder,
  onExport,
  onDownloadOriginal,
  onUpdatePage,
}: ReaderPanelProps) {
  const { t } = useI18n()
  return (
    <aside className="reader__panel">
      <div className="panel-tabs">
        <button
          type="button"
          className={panelTab === 'notes' ? 'is-active' : ''}
          onClick={() => onTab('notes')}
        >
          <Highlighter size={15} />
          {t('نشانه‌ها', 'Marks')}
        </button>
        <button
          type="button"
          className={panelTab === 'info' ? 'is-active' : ''}
          onClick={() => onTab('info')}
        >
          <Info size={15} />
          {t('اطلاعات', 'Info')}
        </button>
        <button
          type="button"
          className={panelTab === 'assets' ? 'is-active' : ''}
          onClick={() => onTab('assets')}
        >
          <LibraryBig size={15} />
          {t('دارایی‌ها', 'Assets')}
        </button>
        <button
          type="button"
          className="panel-close"
          onClick={onClose}
          aria-label={t('بستن پنل', 'Close panel')}
          title={t('بستن پنل', 'Close panel')}
        >
          <X size={16} />
        </button>
      </div>

      {panelTab === 'notes' ? (
        <AnnotationsPanel
          annotations={annotations}
          pages={pages}
          currentPageKey={currentKey}
          selectedId={selectedId}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onReorder={onReorder}
        />
      ) : panelTab === 'assets' ? (
        <ReaderAssetsPanel />
      ) : (
        <ReaderInfoPanel
          doc={doc}
          collectionName={collectionName}
          pageSizeName={pageSizeName}
          pages={pages}
          notebookCount={notebookCount}
          readCount={readCount}
          bookmarkIndex={bookmarkIndex}
          annotationCount={annotations.length}
          exporting={exporting}
          pdfReady={pdfReady}
          onExport={onExport}
          onDownloadOriginal={onDownloadOriginal}
          onUpdatePage={onUpdatePage}
        />
      )}
    </aside>
  )
}
