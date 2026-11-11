import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { db, newId, pdfPageKey } from './db'
import { translate } from './lang'
import type { BnoteDocument } from './types'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export { pdfjs }

const MAX_COVER_WIDTH = 420

export interface ImportResult {
  doc: BnoteDocument
  title: string
}

export async function loadPdfFromBlob(blob: Blob) {
  const data = new Uint8Array(await blob.arrayBuffer())
  return pdfjs.getDocument({ data }).promise
}

async function makeCover(pdf: pdfjs.PDFDocumentProxy): Promise<string | undefined> {
  try {
    const page = await pdf.getPage(1)
    const base = page.getViewport({ scale: 1 })
    const scale = Math.min(MAX_COVER_WIDTH / base.width, 1.2)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(viewport.width))
    canvas.height = Math.max(1, Math.floor(viewport.height))
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    await page.render({ canvasContext: ctx, viewport }).promise
    const dataUrl = canvas.toDataURL('image/jpeg', 0.78)
    page.cleanup()
    return dataUrl
  } catch {
    return undefined
  }
}

export async function importPdfFile(
  file: File,
  collectionId?: string,
): Promise<ImportResult> {
  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    throw new Error(translate(`«${file.name}» فایل PDF نیست.`, `“${file.name}” is not a PDF file.`))
  }
  if (file.size === 0) {
    throw new Error(translate(`«${file.name}» خالی است.`, `“${file.name}” is empty.`))
  }

  const original = await file.arrayBuffer()
  const pdfBytes = original.slice(0)

  let pdf: pdfjs.PDFDocumentProxy
  try {
    pdf = await pdfjs.getDocument({ data: new Uint8Array(pdfBytes) }).promise
  } catch {
    throw new Error(translate(`خواندن «${file.name}» ناموفق بود؛ فایل ممکن است رمزدار یا خراب باشد.`, `Could not read “${file.name}”; the file may be encrypted or damaged.`))
  }

  try {
    const meta = await pdf.getMetadata().catch(() => null)
    const info = (meta?.info ?? {}) as { Title?: string; Author?: string }
    const cleanTitle = (info.Title ?? '').trim()
    const baseTitle = file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim()
    const meaningfulMeta =
      cleanTitle.length > 1 &&
      !/^https?:/i.test(cleanTitle) &&
      !/\.(html?|pdf|docx?|txt|indd|pptx?|xlsx?)$/i.test(cleanTitle) &&
      !/^(untitled|unknown|document|microsoft word)$/i.test(cleanTitle)
    const title =
      (meaningfulMeta ? cleanTitle : '') || baseTitle || translate('بدون عنوان', 'Untitled')
    const author = (info.Author ?? '').trim()
    const cover = await makeCover(pdf)
    const id = newId()
    const now = Date.now()

    const doc: BnoteDocument = {
      id,
      kind: 'pdf',
      title,
      author,
      fileName: file.name,
      size: file.size,
      pageCount: pdf.numPages,
      cover,
      autoCover: cover,
      collectionId,
      tags: [],
      favorite: 0,
      status: 'unread',
      lastPage: 1,
      lastKey: pdfPageKey(1),
      progress: 0,
      addedAt: now,
      openedCount: 0,
    }

    await db.transaction('rw', db.documents, db.files, async () => {
      await db.files.put({ id, data: new Blob([original], { type: 'application/pdf' }) })
      await db.documents.put(doc)
    })

    return { doc, title }
  } finally {
    await pdf.destroy()
  }
}

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}
