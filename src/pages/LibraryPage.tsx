import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  FileText,
  FolderOpen,
  Grid3X3,
  LayoutGrid,
  List,
  Menu,
  NotebookPen,
  Plus,
  Search,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react'
import { db, deleteDocumentCascade } from '../lib/db'
import { importPdfFile, isPdfFile } from '../lib/pdf'
import type { BnoteDocument, Collection } from '../lib/types'
import { toFa } from '../lib/utils'
import type { ThemeMode } from '../hooks/useTheme'
import { useI18n } from '../lib/i18n'
import { Sidebar, type StatusFilter } from '../components/Sidebar'
import { DocumentCard } from '../components/DocumentCard'
import { DocumentEditor } from '../components/DocumentEditor'
import { CollectionModal } from '../components/CollectionModal'
import { NoteDocumentModal, type NewNoteInput } from '../components/NoteDocumentModal'
import { createNoteDocument } from '../lib/noteDocument'
import { ConfirmDialog } from '../components/Modal'
import { useToast } from '../components/Toast'

type SortMode = 'recent' | 'added' | 'title' | 'progress'
type LibraryView = 'large' | 'compact' | 'list'

const FILTER_TITLES: Record<StatusFilter, { fa: string; en: string }> = {
  all: { fa: 'همه اسناد', en: 'All documents' },
  reading: { fa: 'در حال مطالعه', en: 'Reading' },
  done: { fa: 'تمام‌شده‌ها', en: 'Completed' },
  unread: { fa: 'خوانده‌نشده‌ها', en: 'Unread' },
  favorites: { fa: 'موردعلاقه‌ها', en: 'Favorites' },
}

interface LibraryPageProps {
  theme: ThemeMode
  onTheme: (theme: ThemeMode) => void
}

export function LibraryPage({ theme, onTheme }: LibraryPageProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)

  const docs = useLiveQuery(() => db.documents.toArray(), []) ?? []
  const collections = useLiveQuery(() => db.collections.orderBy('createdAt').toArray(), []) ?? []
  const annotations = useLiveQuery(() => db.annotations.toArray(), []) ?? []

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [activeCollection, setActiveCollection] = useState('all')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('recent')
  const [viewMode, setViewMode] = useState<LibraryView>(() => {
    const stored = localStorage.getItem('bnote-library-view')
    return stored === 'compact' || stored === 'list' ? stored : 'large'
  })
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState<{ done: number; total: number } | null>(null)
  const [editing, setEditing] = useState<BnoteDocument | null>(null)
  const [deleting, setDeleting] = useState<BnoteDocument | null>(null)
  const [collectionModal, setCollectionModal] = useState(false)
  const [noteModal, setNoteModal] = useState(false)
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null)

  useEffect(() => {
    localStorage.setItem('bnote-library-view', viewMode)
  }, [viewMode])

  const annotationCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const annotation of annotations) {
      map.set(annotation.docId, (map.get(annotation.docId) ?? 0) + 1)
    }
    return map
  }, [annotations])

  const visibleDocs = useMemo(() => {
    const normalize = (value: string) =>
      value
        .toLocaleLowerCase('fa')
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/[\u200c\u200e\u200f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    const needle = normalize(search)
    let list = docs.filter((doc) => {
      if (filter === 'favorites' && !doc.favorite) return false
      if (filter === 'reading' && doc.status !== 'reading') return false
      if (filter === 'done' && doc.status !== 'done') return false
      if (filter === 'unread' && doc.status !== 'unread') return false
      if (activeCollection !== 'all' && doc.collectionId !== activeCollection) return false
      if (activeTag && !doc.tags.includes(activeTag)) return false
      if (needle) {
        const haystack = normalize([doc.title, doc.author, doc.fileName, ...doc.tags].join(' '))
        if (!haystack.includes(needle)) return false
      }
      return true
    })
    list = [...list]
    list.sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title, 'fa')
      if (sort === 'progress') return b.progress - a.progress
      if (sort === 'added') return b.addedAt - a.addedAt
      return Math.max(b.lastReadAt ?? 0, b.addedAt) - Math.max(a.lastReadAt ?? 0, a.addedAt)
    })
    return list
  }, [docs, filter, activeCollection, activeTag, search, sort])

  const continueDoc = useMemo(() => {
    return [...docs]
      .filter((doc) => doc.progress > 0 && doc.progress < 1)
      .sort((a, b) => (b.lastReadAt ?? 0) - (a.lastReadAt ?? 0))[0]
  }, [docs])

  const activeCollectionName =
    activeCollection === 'all'
      ? null
      : collections.find((collection) => collection.id === activeCollection)?.name ?? null
  const heading =
    activeCollectionName ??
    (activeTag
      ? t(`برچسب «${activeTag}»`, `Tag “${activeTag}”`)
      : t(FILTER_TITLES[filter].fa, FILTER_TITLES[filter].en))

  const runImport = async (files: File[], targetCollection?: string) => {
    const pdfs = files.filter(isPdfFile)
    if (pdfs.length === 0) {
      toast.show(t('فقط فایل PDF قابل افزودن است.', 'Only PDF files can be added.'), { tone: 'error' })
      return
    }
    setImporting({ done: 0, total: pdfs.length })
    let ok = 0
    const failures: string[] = []
    for (const file of pdfs) {
      try {
        await importPdfFile(file, targetCollection)
        ok += 1
      } catch (error) {
        failures.push(
          error instanceof Error
            ? error.message
            : t(`افزودن «${file.name}» ناموفق بود.`, `Could not add “${file.name}”.`),
        )
      }
      setImporting((current) =>
        current ? { ...current, done: current.done + 1 } : current,
      )
    }
    setImporting(null)
    if (ok > 0) {
      toast.show(
        ok === 1
          ? t('یک سند به کتابخانه اضافه شد.', 'One document added to the library.')
          : t(
              `${toFa(ok)} سند به کتابخانه اضافه شد.`,
              `${toFa(ok)} documents added to the library.`,
            ),
        { tone: 'success' },
      )
    }
    for (const message of failures.slice(0, 2)) {
      toast.show(message, { tone: 'error', duration: 6500 })
    }
  }

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    void runImport(
      Array.from(fileList),
      activeCollection !== 'all' ? activeCollection : undefined,
    )
  }

  const importSample = async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}samples/niviso-guide.pdf`)
      if (!response.ok) throw new Error('not found')
      const blob = await response.blob()
      const file = new File([blob], t('راهنمای نی‌ویسو.pdf', 'NIVISO guide.pdf'), { type: 'application/pdf' })
      await runImport([file])
    } catch {
      toast.show(t('فایل نمونه در دسترس نیست.', 'Sample file is not available.'), { tone: 'error' })
    }
  }

  const createNote = async (input: NewNoteInput) => {
    const id = await createNoteDocument(input)
    setNoteModal(false)
    toast.show(t('یادداشت جدید ساخته شد.', 'New note created.'), { tone: 'success' })
    navigate(`/read/${id}`)
  }

  const updateFavorite = async (doc: BnoteDocument) => {
    await db.documents.update(doc.id, { favorite: doc.favorite ? 0 : 1 })
  }

  const removeDocument = async () => {
    if (!deleting) return
    const title = deleting.title
    await deleteDocumentCascade(deleting.id)
    toast.show(t(`«${title}» حذف شد.`, `“${title}” deleted.`), { tone: 'success' })
  }

  const removeCollection = async () => {
    if (!deletingCollection) return
    await db.transaction('rw', db.collections, db.documents, async () => {
      await db.documents
        .where('collectionId')
        .equals(deletingCollection.id)
        .modify({ collectionId: undefined })
      await db.collections.delete(deletingCollection.id)
    })
    if (activeCollection === deletingCollection.id) setActiveCollection('all')
    toast.show(
      t(
        'دسته حذف شد؛ اسناد آن به «بدون دسته» منتقل شدند.',
        'Category deleted; its documents moved to Uncategorized.',
      ),
    )
  }

  const hasFilters =
    filter !== 'all' || activeCollection !== 'all' || Boolean(activeTag) || search.trim().length > 0

  return (
    <div
      className="app-shell"
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setDragging(false)
        }
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        handleFiles(event.dataTransfer.files)
      }}
    >
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        docs={docs}
        collections={collections}
        filter={filter}
        onFilter={(next) => {
          setFilter(next)
          setActiveCollection('all')
          setActiveTag(null)
        }}
        activeCollection={activeCollection}
        onCollection={(collection) => {
          setActiveCollection(collection)
          setFilter('all')
          setActiveTag(null)
        }}
        activeTag={activeTag}
        onTag={setActiveTag}
        onAddCollection={() => setCollectionModal(true)}
        onDeleteCollection={setDeletingCollection}
        onImport={() => inputRef.current?.click()}
        onNewNote={() => setNoteModal(true)}
        theme={theme}
        onTheme={onTheme}
        annotationCount={annotations.length}
      />

      <main className="library">
        <header className="library__topbar">
          <button
            type="button"
            className="icon-btn library__menu"
            onClick={() => setSidebarOpen(true)}
            aria-label={t('باز کردن منو', 'Open menu')}
          >
            <Menu size={20} />
          </button>
          <label className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('جستجو در عنوان، نویسنده یا برچسب…', 'Search title, author or tag…')}
              type="search"
            />
            {search && (
              <button
                type="button"
                className="icon-btn icon-btn--xs"
                onClick={() => setSearch('')}
                aria-label={t('پاک کردن جستجو', 'Clear search')}
              >
                <X size={13} />
              </button>
            )}
          </label>
          <div className="library__topbar-actions">
            <div
              className="view-switch"
              role="group"
              aria-label={t('حالت نمایش کتابخانه', 'Library view')}
            >
              {[
                { id: 'large' as const, icon: LayoutGrid, label: t('کارت بزرگ', 'Large cards') },
                { id: 'compact' as const, icon: Grid3X3, label: t('کارت کوچک', 'Compact cards') },
                { id: 'list' as const, icon: List, label: t('لیست', 'List') },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  className={viewMode === id ? 'is-active' : ''}
                  onClick={() => setViewMode(id)}
                  title={label}
                  aria-label={label}
                  aria-pressed={viewMode === id}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
            <label className="sort-select">
              <span>{t('مرتب‌سازی', 'Sort')}</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
                <option value="recent">{t('آخرین مطالعه', 'Last read')}</option>
                <option value="added">{t('تاریخ افزودن', 'Date added')}</option>
                <option value="title">{t('عنوان', 'Title')}</option>
                <option value="progress">{t('بیشترین پیشرفت', 'Progress')}</option>
              </select>
            </label>
            <button
              type="button"
              className="btn btn--ghost library__note-btn"
              onClick={() => setNoteModal(true)}
            >
              <NotebookPen size={17} />
              <span>{t('یادداشت جدید', 'New note')}</span>
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => inputRef.current?.click()}
            >
              <Plus size={17} />
              <span>{t('افزودن PDF', 'Add PDF')}</span>
            </button>
          </div>
        </header>

        <div className="library__inner">
          <div className="library__heading">
            <div>
              <p className="eyebrow">
                <Sparkles size={13} /> {t('کتابخانه شخصی', 'Personal library')}
              </p>
              <h1>{heading}</h1>
              <p className="library__subtitle">
                {toFa(visibleDocs.length)} {visibleDocs.length === 1 ? t('سند', 'doc') : t('سند', 'docs')}
                {activeTag ? t(` با برچسب «${activeTag}»`, ` tagged “${activeTag}”`) : ''}
                {search ? t(` برای «${search}»`, ` for “${search}”`) : ''}
              </p>
            </div>
            {activeTag && (
              <button type="button" className="chip-btn" onClick={() => setActiveTag(null)}>
                <X size={13} /> {t('حذف فیلتر برچسب', 'Clear tag filter')}
              </button>
            )}
          </div>

          {continueDoc && !search && filter === 'all' && activeCollection === 'all' && !activeTag && (
            <button
              type="button"
              className="continue-card"
              onClick={() => navigate(`/read/${continueDoc.id}`)}
            >
              <span className="continue-card__cover">
                {continueDoc.cover ? (
                  <img src={continueDoc.cover} alt="" />
                ) : (
                  <FileText size={26} />
                )}
              </span>
              <span className="continue-card__body">
                <span className="continue-card__label">
                  <BookOpen size={14} /> {t('ادامه مطالعه', 'Continue reading')}
                </span>
                <strong>{continueDoc.title}</strong>
                <span className="continue-card__progress">
                  <span>
                    <span style={{ width: `${Math.round(continueDoc.progress * 100)}%` }} />
                  </span>
                  <em>
                    {t('صفحه', 'Page')} {toFa(continueDoc.lastPage)} {t('از', 'of')} {toFa(continueDoc.pageCount)}
                  </em>
                </span>
              </span>
              <span className="continue-card__cta">{t('ادامه', 'Continue')}</span>
            </button>
          )}

          {docs.length === 0 ? (
            <section className="empty-library">
              <div className="empty-library__art">
                <span className="empty-library__sheet empty-library__sheet--back" />
                <span className="empty-library__sheet empty-library__sheet--mid" />
                <span className="empty-library__sheet empty-library__sheet--front">
                  <FileText size={36} />
                  <i />
                  <i />
                  <i />
                </span>
                <span className="empty-library__spark">
                  <Sparkles size={20} />
                </span>
              </div>
              <h2>{t('اولین سند خود را به نی‌ویسو بیاورید', 'Bring your first document to NIVISO')}</h2>
              <p>
                {t(
                  'PDF اضافه کنید یا یک یادداشت مستقل با اندازه و گرید دلخواه بسازید. همه فایل‌ها، پیشرفت مطالعه و هایلایت‌ها فقط روی همین دستگاه می‌مانند.',
                  'Add a PDF or create a standalone note with your preferred size and grid. Files, reading progress and highlights stay on this device only.',
                )}
              </p>
              <div className="empty-library__actions">
                <button
                  type="button"
                  className="btn btn--primary btn--lg"
                  onClick={() => inputRef.current?.click()}
                >
                  <UploadCloud size={18} />
                  {t('انتخاب فایل PDF', 'Choose PDF file')}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--lg"
                  onClick={() => setNoteModal(true)}
                >
                  <NotebookPen size={17} />
                  {t('ساخت یادداشت جدید', 'Create new note')}
                </button>
                <button type="button" className="btn btn--ghost btn--lg" onClick={importSample}>
                  <Sparkles size={17} />
                  {t('افزودن راهنمای نمونه', 'Add sample guide')}
                </button>
              </div>
              <span className="empty-library__hint">
                {t('بدون سرور، بدون حساب کاربری — همه‌چیز محلی و آفلاین', 'No server, no account — local and offline')}
              </span>
            </section>
          ) : visibleDocs.length === 0 ? (
            <section className="empty-results">
              <FolderOpen size={30} />
              <h3>{t('چیزی پیدا نشد', 'Nothing found')}</h3>
              <p>{t('فیلترها یا عبارت جستجو را تغییر دهد.', 'Try changing filters or search terms.')}</p>
              {hasFilters && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setFilter('all')
                    setActiveCollection('all')
                    setActiveTag(null)
                    setSearch('')
                  }}
                >
                  {t('پاک کردن فیلترها', 'Clear filters')}
                </button>
              )}
            </section>
          ) : (
            <div className={`doc-grid doc-grid--${viewMode}`}>
              {visibleDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  collection={collections.find((item) => item.id === doc.collectionId)}
                  annotations={annotationCounts.get(doc.id) ?? 0}
                  onOpen={() => navigate(`/read/${doc.id}`)}
                  onEdit={() => setEditing(doc)}
                  onDelete={() => setDeleting(doc)}
                  onToggleFavorite={() => {
                    void updateFavorite(doc)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ''
        }}
      />

      {dragging && (
        <div className="drop-overlay">
          <div className="drop-overlay__card">
            <UploadCloud size={34} />
            <h2>{t('فایل‌های PDF را رها کنید', 'Drop PDF files here')}</h2>
            <p>{t('همه فایل‌ها به کتابخانه اضافه می‌شوند.', 'All files will be added to the library.')}</p>
          </div>
        </div>
      )}

      {importing && (
        <div className="import-toast" role="status">
          <span className="spinner spinner--dark" />
          <div>
            <strong>{t('در حال افزودن PDF…', 'Adding PDF…')}</strong>
            <span>
              {t(
                `${toFa(importing.done)} از ${toFa(importing.total)}`,
                `${toFa(importing.done)} of ${toFa(importing.total)}`,
              )}
            </span>
            <span className="import-toast__bar">
              <span style={{ width: `${(importing.done / Math.max(1, importing.total)) * 100}%` }} />
            </span>
          </div>
        </div>
      )}

      <DocumentEditor
        doc={editing}
        collections={collections}
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
      />

      <CollectionModal
        open={collectionModal}
        onClose={() => setCollectionModal(false)}
      />

      <NoteDocumentModal
        open={noteModal}
        onSave={(input) => {
          void createNote(input)
        }}
        onClose={() => setNoteModal(false)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title={t('حذف سند', 'Delete document')}
        message={t(
          `«${deleting?.title ?? ''}» با همه هایلایت‌ها و یادداشت‌هایش حذف شود؟ این کار قابل بازگشت نیست.`,
          `Delete “${deleting?.title ?? ''}” with all highlights and notes? This cannot be undone.`,
        )}
        confirmLabel={t('حذف سند', 'Delete document')}
        danger
        onConfirm={() => {
          void removeDocument()
        }}
        onClose={() => setDeleting(null)}
      />

      <ConfirmDialog
        open={Boolean(deletingCollection)}
        title={t('حذف دسته', 'Delete category')}
        message={t(
          `دسته «${deletingCollection?.name ?? ''}» حذف شود؟ اسناد داخل آن حذف نمی‌شوند و به «بدون دسته» منتقل می‌شوند.`,
          `Delete “${deletingCollection?.name ?? ''}”? Its documents are kept and moved to Uncategorized.`,
        )}
        confirmLabel={t('حذف دسته', 'Delete category')}
        danger
        onConfirm={() => {
          void removeCollection()
        }}
        onClose={() => setDeletingCollection(null)}
      />
    </div>
  )
}
