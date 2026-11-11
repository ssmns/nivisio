import { useState } from 'react'
import { useToast } from '../components/Toast'
import { useI18n } from '../lib/i18n'
import { db } from '../lib/db'
import { documentPageSize } from '../lib/utils'
import type { Annotation, BnoteDocument, LogicalPage } from '../lib/types'

export function useReaderExport(
  doc: BnoteDocument | undefined,
  pdf: import('pdfjs-dist').PDFDocumentProxy | null,
  pages: LogicalPage[],
  annotations: Annotation[],
) {
  const toast = useToast()
  const { t } = useI18n()
  const [exporting, setExporting] = useState<{ done: number; total: number } | null>(null)

  const downloadOriginal = async () => {
    if (!doc) return
    const record = await db.files.get(doc.id)
    if (!record) {
      toast.show(t('نسخه اصلی فایل پیدا نشد.', 'Original file not found.'), { tone: 'error' })
      return
    }
    try {
      const { saveBlobAsFile } = await import('../lib/exportPdf')
      await saveBlobAsFile(record.data, doc.fileName)
    } catch {
      toast.show(t('ذخیره فایل ناموفق بود.', 'Could not save the file.'), { tone: 'error' })
    }
  }

  const exportPdf = async () => {
    if (!doc || (doc.kind !== 'note' && !pdf)) {
      toast.show(t('فایل PDF هنوز آماده نیست.', 'The PDF is not ready yet.'), { tone: 'error' })
      return
    }
    setExporting({ done: 0, total: pages.length })
    try {
      const { exportAnnotatedPdf, exportFileName, saveBlobAsFile } = await import(
        '../lib/exportPdf'
      )
      const blob = await exportAnnotatedPdf({
        pdf: pdf ?? undefined,
        pages,
        annotations,
        title: doc.title,
        notebookSize: documentPageSize(doc),
        onProgress: (done, total) => setExporting({ done, total }),
      })
      await saveBlobAsFile(blob, exportFileName(doc.title))
      toast.show(t('خروجی PDF با برگه‌ها و نشانه‌ها ذخیره شد.', 'Annotated PDF exported.'), { tone: 'success' })
    } catch (error) {
      toast.show(error instanceof Error ? error.message : t('ساخت خروجی PDF ناموفق بود.', 'PDF export failed.'), {
        tone: 'error',
        duration: 6500,
      })
    } finally {
      setExporting(null)
    }
  }

  return { exporting, exportPdf, downloadOriginal }
}
