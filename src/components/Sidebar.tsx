import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  CheckCircle2,
  FolderPlus,
  Heart,
  Info,
  Library,
  LayoutTemplate,
  Moon,
  NotebookPen,
  Plus,
  Sparkles,
  Sun,
  Tags,
  Trash2,
  X,
  Monitor,
} from 'lucide-react'
import type { BnoteDocument, Collection } from '../lib/types'
import type { ThemeMode } from '../hooks/useTheme'
import { toFa } from '../lib/utils'
import { useI18n } from '../lib/i18n'

export type StatusFilter = 'all' | 'reading' | 'done' | 'unread' | 'favorites'

interface SidebarProps {
  open: boolean
  onClose: () => void
  docs: BnoteDocument[]
  collections: Collection[]
  filter: StatusFilter
  onFilter: (filter: StatusFilter) => void
  activeCollection: string
  onCollection: (id: string) => void
  activeTag: string | null
  onTag: (tag: string | null) => void
  onAddCollection: () => void
  onDeleteCollection: (collection: Collection) => void
  onImport: () => void
  onNewNote: () => void
  theme: ThemeMode
  onTheme: (theme: ThemeMode) => void
  annotationCount: number
}

const FILTERS: { id: StatusFilter; label: string; en: string; icon: typeof Library }[] = [
  { id: 'all', label: 'همه اسناد', en: 'All documents', icon: Library },
  { id: 'reading', label: 'در حال مطالعه', en: 'Reading', icon: BookOpen },
  { id: 'done', label: 'تمام‌شده', en: 'Completed', icon: CheckCircle2 },
  { id: 'unread', label: 'خوانده‌نشده', en: 'Unread', icon: Sparkles },
  { id: 'favorites', label: 'موردعلاقه', en: 'Favorites', icon: Heart },
]

export function Sidebar({
  open,
  onClose,
  docs,
  collections,
  filter,
  onFilter,
  activeCollection,
  onCollection,
  activeTag,
  onTag,
  onAddCollection,
  onDeleteCollection,
  onImport,
  onNewNote,
  theme,
  onTheme,
  annotationCount,
}: SidebarProps) {
  const navigate = useNavigate()
  const { lang, setLang, t } = useI18n()
  const [tagOpen, setTagOpen] = useState(false)
  const allTags = Array.from(new Set(docs.flatMap((doc) => doc.tags))).sort((a, b) =>
    a.localeCompare(b, 'fa'),
  )
  const count = (id: StatusFilter) => {
    if (id === 'all') return docs.length
    if (id === 'favorites') return docs.filter((doc) => doc.favorite).length
    if (id === 'reading') return docs.filter((doc) => doc.status === 'reading').length
    if (id === 'done') return docs.filter((doc) => doc.status === 'done').length
    return docs.filter((doc) => doc.status === 'unread').length
  }
  const pagesRead = docs.reduce(
    (sum, doc) => sum + Math.round(doc.progress * doc.pageCount),
    0,
  )

  return (
    <>
      {open && (
        <button
          type="button"
          className="scrim"
          aria-label={t('بستن منو', 'Close menu')}
          onClick={onClose}
        />
      )}
      <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <img className="brand-mark brand-mark--logo" src="/icon-192.png" alt="" aria-hidden="true" />
          <div>
            <strong>NIVISO</strong>
            <p>{t('کتابخانه و یادداشت PDF', 'PDF library & notes')}</p>
          </div>
          <button type="button" className="icon-btn sidebar__close" onClick={onClose} aria-label={t('بستن', 'Close')}>
            <X size={18} />
          </button>
        </div>

        <button type="button" className="btn btn--primary sidebar__import" onClick={onImport}>
          <Plus size={18} />
          {t('افزودن PDF', 'Add PDF')}
        </button>
        <button type="button" className="btn btn--ghost sidebar__note" onClick={onNewNote}>
          <NotebookPen size={17} />
          {t('یادداشت جدید', 'New note')}
        </button>

        <nav className="sidebar__nav" aria-label={t('فیلترها', 'Filters')}>
          {FILTERS.map(({ id, label, en, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-item${filter === id ? ' is-active' : ''}`}
              onClick={() => {
                onFilter(id)
                onClose()
              }}
            >
              <Icon size={17} />
              <span>{t(label, en)}</span>
              <em>{toFa(count(id))}</em>
            </button>
          ))}
        </nav>

        <div className="sidebar__section">
          <div className="sidebar__section-head">
            <span>{t('دسته‌بندی مطالعات', 'Study categories')}</span>
            <button
              type="button"
              className="icon-btn icon-btn--sm"
              title={t('دسته جدید', 'New category')}
              aria-label={t('دسته جدید', 'New category')}
              onClick={onAddCollection}
            >
              <FolderPlus size={16} />
            </button>
          </div>
          <button
            type="button"
            className={`nav-item nav-item--sub${activeCollection === 'all' ? ' is-active' : ''}`}
            onClick={() => {
              onCollection('all')
              onClose()
            }}
          >
            <span className="folder-dot folder-dot--all" />
            <span>{t('همه دسته‌ها', 'All categories')}</span>
          </button>
          {collections.map((collection) => {
            const docsInCollection = docs.filter((doc) => doc.collectionId === collection.id).length
            return (
              <div key={collection.id} className="nav-row">
                <button
                  type="button"
                  className={`nav-item nav-item--sub${
                    activeCollection === collection.id ? ' is-active' : ''
                  }`}
                  onClick={() => {
                    onCollection(collection.id)
                    onClose()
                  }}
                >
                  <span className="folder-dot" style={{ background: collection.color }} />
                  <span>{collection.name}</span>
                  <em>{toFa(docsInCollection)}</em>
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--xs nav-row__delete"
                  title={t('حذف دسته', 'Delete category')}
                  aria-label={t(`حذف دسته ${collection.name}`, `Delete category ${collection.name}`)}
                  onClick={() => onDeleteCollection(collection)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
          {collections.length === 0 && <p className="sidebar__hint">{t('هنوز دسته‌ای نساخته‌اید.', 'No categories yet.')}</p>}
        </div>

        {allTags.length > 0 && (
          <div className="sidebar__section">
            <button
              type="button"
              className="sidebar__section-head sidebar__section-head--button"
              onClick={() => setTagOpen((value) => !value)}
            >
              <span>
                <Tags size={14} /> {t('برچسب‌ها', 'Tags')}
              </span>
              <em>{toFa(allTags.length)}</em>
            </button>
            {(tagOpen || activeTag) && (
              <div className="tag-cloud">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-chip${activeTag === tag ? ' is-active' : ''}`}
                    onClick={() => {
                      onTag(activeTag === tag ? null : tag)
                      onClose()
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="sidebar__footer">
          <div className="sidebar__stats">
            <span>
              <strong>{toFa(docs.length)}</strong> {docs.length === 1 ? t('سند', 'doc') : t('سند', 'docs')}
            </span>
            <span>
              <strong>{toFa(pagesRead)}</strong> {t('صفحه خوانده‌شده', 'pages read')}
            </span>
            <span>
              <strong>{toFa(annotationCount)}</strong> {t('نشانه', 'marks')}
            </span>
          </div>
          <button
            type="button"
            className="sidebar__about"
            onClick={() => {
              navigate('/templates')
              onClose()
            }}
          >
            <LayoutTemplate size={15} />
            {t('قالب‌های یادداشت', 'Note templates')}
          </button>
          <button
            type="button"
            className="sidebar__about"
            onClick={() => {
              navigate('/about')
              onClose()
            }}
          >
            <Info size={15} />
            {t('درباره نی‌ویسیو و توسعه‌دهندگان', 'About NIVISO & developers')}
          </button>
          <div className="theme-switch" role="group" aria-label={t('پوسته', 'Theme')}>
            <button
              type="button"
              className={theme === 'light' ? 'is-active' : ''}
              onClick={() => onTheme('light')}
              title={t('روشن', 'Light')}
            >
              <Sun size={15} />
            </button>
            <button
              type="button"
              className={theme === 'system' ? 'is-active' : ''}
              onClick={() => onTheme('system')}
              title={t('هماهنگ با سیستم', 'System')}
            >
              <Monitor size={15} />
            </button>
            <button
              type="button"
              className={theme === 'dark' ? 'is-active' : ''}
              onClick={() => onTheme('dark')}
              title={t('تاریک', 'Dark')}
            >
              <Moon size={15} />
            </button>
          </div>
          <div className="lang-switch" role="group" aria-label="Language">
            <button
              type="button"
              className={lang === 'fa' ? 'is-active' : ''}
              onClick={() => setLang('fa')}
            >
              {t('فارسی', 'Persian')}
            </button>
            <button
              type="button"
              className={lang === 'en' ? 'is-active' : ''}
              onClick={() => setLang('en')}
            >
              English
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
