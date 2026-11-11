import { useEffect, useState } from 'react'
import { db } from '../lib/db'
import { translate } from '../lib/lang'
import { pdfjs } from '../lib/pdf'

interface PdfState {
  pdf: pdfjs.PDFDocumentProxy | null
  loading: boolean
  error: string | null
}

export function usePdfDocument(docId: string | undefined, enabled = true) {
  const [state, setState] = useState<PdfState>({ pdf: null, loading: true, error: null })

  useEffect(() => {
    let active = true
    let loaded: pdfjs.PDFDocumentProxy | null = null

    if (!enabled) {
      setState({ pdf: null, loading: false, error: null })
      return
    }

    if (!docId) {
      setState({ pdf: null, loading: false, error: translate('شناسه سند نامعتبر است.', 'Invalid document id.') })
      return
    }

    setState({ pdf: null, loading: true, error: null })
    void (async () => {
      try {
        const record = await db.files.get(docId)
        if (!record) throw new Error(translate('فایل PDF در حافظه پیدا نشد.', 'PDF file not found in storage.'))
        const data = new Uint8Array(await record.data.arrayBuffer())
        const pdf = await pdfjs.getDocument({ data }).promise
        if (!active) {
          void pdf.destroy()
          return
        }
        loaded = pdf
        setState({ pdf, loading: false, error: null })
      } catch (error) {
        if (!active) return
        setState({
          pdf: null,
          loading: false,
          error: error instanceof Error ? error.message : translate('بارگذاری فایل ناموفق بود.', 'Could not load the file.'),
        })
      }
    })()

    return () => {
      active = false
      if (loaded) void loaded.destroy()
    }
  }, [docId, enabled])

  return state
}
