import type { RefObject } from 'react'
import { ChartModal } from '../ChartModal'
import { GuideModal } from '../GuideModal'
import { LinkModal } from '../LinkModal'
import { NoteEditor } from '../NoteEditor'
import { PageTemplateModal } from '../PageTemplateModal'
import { ShapeModal } from '../ShapeModal'
import { TextModal } from '../TextModal'
import type {
  Annotation,
  BnoteDocument,
  GuideKind,
  LinkInfo,
  LogicalPage,
  NotebookPage,
  ShapeConfig,
} from '../../lib/types'
import { pageDisplayLabel } from '../../lib/utils'
import type { TextValue } from '../../hooks/useReaderActions'
import { useI18n } from '../../lib/i18n'

interface NoteTarget {
  annotation?: Annotation
  point?: { x: number; y: number }
}

interface PageTemplateState {
  mode: 'create' | 'edit'
  page?: NotebookPage
}

interface TextTarget {
  annotation?: Annotation
  point?: { x: number; y: number }
}

interface ReaderModalsProps {
  doc: BnoteDocument
  pages: LogicalPage[]
  currentPage: LogicalPage
  currentIndex: number
  currentKey: string
  notebookPages: NotebookPage[]
  docs: BnoteDocument[]
  noteTarget: NoteTarget | null
  noteTargetTitle: string
  pageLabel: string
  category: string
  onSaveNote: (text: string, category: string) => void
  onCloseNote: () => void
  pageTemplate: PageTemplateState | null
  onSavePageTemplate: (grid: import('../../lib/types').GridType, scale: number) => void
  onDeletePage: (page: NotebookPage) => void
  onClosePageTemplate: () => void
  linkRect: unknown
  onSaveLink: (link: LinkInfo) => void
  onCloseLink: () => void
  chartOpen: boolean
  onSaveChart: (config: import('../../lib/types').ChartConfig) => void
  onCloseChart: () => void
  shapeOpen: boolean
  onSaveShape: (config: ShapeConfig) => void
  onCloseShape: () => void
  guideOpen: boolean
  onSaveGuide: (kind: GuideKind) => void
  onCloseGuide: () => void
  textTarget: TextTarget | null
  inkColor: string
  onSaveText: (value: TextValue) => void
  onCloseText: () => void
  imageInputRef: RefObject<HTMLInputElement | null>
  onPickImage: (file?: File) => void
}

export function ReaderModals({
  doc,
  pages,
  currentPage,
  currentIndex,
  currentKey,
  notebookPages,
  docs,
  noteTarget,
  noteTargetTitle,
  pageLabel,
  category,
  onSaveNote,
  onCloseNote,
  pageTemplate,
  onSavePageTemplate,
  onDeletePage,
  onClosePageTemplate,
  linkRect,
  onSaveLink,
  onCloseLink,
  chartOpen,
  onSaveChart,
  onCloseChart,
  shapeOpen,
  onSaveShape,
  onCloseShape,
  guideOpen,
  onSaveGuide,
  onCloseGuide,
  textTarget,
  inkColor,
  onSaveText,
  onCloseText,
  imageInputRef,
  onPickImage,
}: ReaderModalsProps) {
  const { t } = useI18n()
  return (
    <>
      <NoteEditor
        open={Boolean(noteTarget)}
        title={noteTargetTitle}
        subtitle={`${pageLabel} · ${category}`}
        initialValue={noteTarget?.annotation?.note ?? ''}
        initialCategory={noteTarget?.annotation?.category ?? category}
        onSave={onSaveNote}
        onClose={onCloseNote}
      />

      <PageTemplateModal
        open={Boolean(pageTemplate)}
        mode={pageTemplate?.mode ?? 'create'}
        initialGrid={
          pageTemplate?.page?.grid ??
          (pageTemplate?.mode === 'create'
            ? currentPage.notebook?.grid ?? doc.defaultGrid ?? 'lined'
            : 'lined')
        }
        initialGridScale={
          pageTemplate?.page?.gridScale ??
          currentPage.notebook?.gridScale ??
          doc.defaultGridScale ??
          1
        }
        pageLabel={
          pageTemplate?.page
            ? t(
              `${pageDisplayLabel(currentPage, currentIndex, pages)} — ${notebookPages.length} برگه یادداشت`,
              `${pageDisplayLabel(currentPage, currentIndex, pages)} — ${notebookPages.length} note pages`,
            )
            : undefined
        }
        onSave={onSavePageTemplate}
        onDelete={pageTemplate?.page ? () => onDeletePage(pageTemplate.page as NotebookPage) : undefined}
        onClose={onClosePageTemplate}
      />

      <LinkModal
        open={Boolean(linkRect)}
        docs={docs}
        pages={pages}
        currentDocId={doc.id}
        currentPageKey={currentKey}
        onSave={onSaveLink}
        onClose={onCloseLink}
      />

      <ChartModal open={chartOpen} onSave={onSaveChart} onClose={onCloseChart} />
      <ShapeModal open={shapeOpen} onSave={onSaveShape} onClose={onCloseShape} />
      <GuideModal open={guideOpen} onSave={onSaveGuide} onClose={onCloseGuide} />

      <TextModal
        open={Boolean(textTarget)}
        initialText={textTarget?.annotation?.text ?? ''}
        initialSize={textTarget?.annotation?.fontSize ?? 0.024}
        initialColor={textTarget?.annotation?.color ?? inkColor}
        initialAlign={textTarget?.annotation?.textAlign ?? 'right'}
        initialCategory={textTarget?.annotation?.category ?? category}
        onSave={onSaveText}
        onClose={onCloseText}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          onPickImage(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </>
  )
}
