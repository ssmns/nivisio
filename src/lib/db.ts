import Dexie, { type Table } from 'dexie'
import type {
  Annotation,
  BnoteDocument,
  Collection,
  NotebookPage,
  StoredFile,
} from './types'

class BnoteDB extends Dexie {
  documents!: Table<BnoteDocument, string>
  files!: Table<StoredFile, string>
  collections!: Table<Collection, string>
  annotations!: Table<Annotation, string>
  notebookPages!: Table<NotebookPage, string>

  constructor() {
    super('bnote')

    this.version(1).stores({
      documents: 'id, collectionId, lastReadAt, addedAt, status, favorite, *tags',
      files: 'id',
      collections: 'id, createdAt',
      annotations: 'id, docId, page, [docId+page], createdAt',
    })

    this.version(2)
      .stores({
        documents: 'id, collectionId, lastReadAt, addedAt, status, favorite, *tags',
        files: 'id',
        collections: 'id, createdAt',
        notebookPages: 'id, docId, [docId+afterPage], createdAt',
        annotations:
          'id, docId, pageRef, page, [docId+pageRef], createdAt, category',
      })
      .upgrade(async (tx) => {
        await tx
          .table('annotations')
          .toCollection()
          .modify((annotation: Partial<Annotation>) => {
            if (!annotation.pageRef) annotation.pageRef = `pdf:${annotation.page ?? 1}`
            if (!annotation.category) annotation.category = 'عمومی'
          })
        await tx
          .table('documents')
          .toCollection()
          .modify((doc: Partial<BnoteDocument>) => {
            if (!doc.lastKey) doc.lastKey = `pdf:${doc.lastPage ?? 1}`
            if (doc.autoCover === undefined) doc.autoCover = doc.cover
          })
      })
  }
}

export const db = new BnoteDB()

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function pdfPageKey(page: number): string {
  return `pdf:${page}`
}

export function notePageKey(pageId: string): string {
  return `note:${pageId}`
}

export async function deleteDocumentCascade(docId: string): Promise<void> {
  await db.transaction(
    'rw',
    db.documents,
    db.files,
    db.annotations,
    db.notebookPages,
    async () => {
      await db.annotations.where('docId').equals(docId).delete()
      await db.notebookPages.where('docId').equals(docId).delete()
      await db.files.delete(docId)
      await db.documents.delete(docId)
    },
  )
}

export async function deleteNotebookPageCascade(page: NotebookPage): Promise<void> {
  await db.transaction('rw', db.notebookPages, db.annotations, async () => {
    await db.annotations.where('pageRef').equals(notePageKey(page.id)).delete()
    await db.notebookPages.delete(page.id)
  })
}

export async function clearLibrary(): Promise<void> {
  await db.transaction(
    'rw',
    db.documents,
    db.files,
    db.annotations,
    db.collections,
    db.notebookPages,
    async () => {
      await db.documents.clear()
      await db.files.clear()
      await db.annotations.clear()
      await db.collections.clear()
      await db.notebookPages.clear()
    },
  )
}
