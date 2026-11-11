import { db, newId, notePageKey } from './db'
import {
  COVER_PRESETS,
  PAGE_SIZES,
  type BnoteDocument,
  type GridType,
  type PageOrientation,
  type PageSizeKey,
} from './types'
import { coverPresetDataUrl } from './utils'

export interface NewNoteInput {
  title: string
  pageSize: PageSizeKey
  pageOrientation: PageOrientation
  customWidthMm?: number
  customHeightMm?: number
  grid: GridType
  gridScale: number
  pageCount: number
  coverPreset: number
}

const MM_TO_PT = 72 / 25.4

export async function createNoteDocument(input: NewNoteInput): Promise<string> {
  const id = newId()
  const now = Date.now()
  const coverPresetItem = COVER_PRESETS[input.coverPreset] ?? COVER_PRESETS[0]
  const cover = coverPresetDataUrl(coverPresetItem)
  const pagePreset = PAGE_SIZES[input.pageSize] ?? PAGE_SIZES.a4
  let pageWidth =
    input.pageSize === 'custom' && input.customWidthMm
      ? input.customWidthMm * MM_TO_PT
      : pagePreset.width
  let pageHeight =
    input.pageSize === 'custom' && input.customHeightMm
      ? input.customHeightMm * MM_TO_PT
      : pagePreset.height
  if (
    input.pageOrientation === 'landscape' &&
    pageWidth < pageHeight
  ) {
    ;[pageWidth, pageHeight] = [pageHeight, pageWidth]
  }
  if (
    input.pageOrientation === 'portrait' &&
    pageWidth > pageHeight
  ) {
    ;[pageWidth, pageHeight] = [pageHeight, pageWidth]
  }
  const pages = Array.from({ length: input.pageCount }, (_, index) => ({
    id: newId(),
    docId: id,
    afterPage: 0,
    order: index,
    grid: input.grid,
    gridScale: input.gridScale,
    createdAt: now,
    updatedAt: now,
  }))
  const doc: BnoteDocument = {
    id,
    kind: 'note',
    pageSize: input.pageSize,
    pageWidth,
    pageHeight,
    pageOrientation: input.pageOrientation,
    defaultGrid: input.grid,
    defaultGridScale: input.gridScale,
    title: input.title,
    author: '',
    fileName: '',
    size: 0,
    pageCount: pages.length,
    cover,
    autoCover: cover,
    tags: [],
    favorite: 0,
    status: 'unread',
    lastPage: 1,
    lastKey: notePageKey(pages[0].id),
    progress: 0,
    addedAt: now,
    openedCount: 0,
  }
  await db.transaction('rw', db.documents, db.notebookPages, async () => {
    await db.documents.put(doc)
    await db.notebookPages.bulkPut(pages)
  })
  return id
}
