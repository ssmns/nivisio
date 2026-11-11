import { BookOpen, Check, FileText, Heart, NotebookPen, Pencil, Trash2 } from 'lucide-react'
import type { BnoteDocument, Collection } from '../lib/types'
import { formatRelative, progressLabel, toFa, truncate } from '../lib/utils'
import { useI18n } from '../lib/i18n'

interface DocumentCardProps {
  doc: BnoteDocument
  collection?: Collection
  annotations: number
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleFavorite: () => void
}

export function DocumentCard({
  doc,
  collection,
  annotations,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
}: DocumentCardProps) {
  const { t } = useI18n()
  return (
    <article className="doc-card">
      <button
        type="button"
        className="doc-card__cover"
        onClick={onOpen}
        aria-label={t(`باز کردن ${doc.title}`, `Open ${doc.title}`)}
      >
        {doc.cover ? (
          <img src={doc.cover} alt="" loading="lazy" />
        ) : (
          <span className="doc-card__placeholder">
            {doc.kind === 'note' ? <NotebookPen size={34} /> : <FileText size={34} />}
            <em>{truncate(doc.title, 42)}</em>
          </span>
        )}
        <span className={`status-pill status-pill--${doc.status}`}>
          {doc.status === 'done' ? t('تمام شد', 'Completed')
              : doc.status === 'reading'
                ? t('در حال مطالعه', 'Reading')
                : t('نخوانده', 'Unread')}
        </span>
        {doc.status === 'done' && (
          <span className="doc-card__done" aria-hidden="true">
            <Check size={14} />
          </span>
        )}
        <span className="doc-card__progress" aria-hidden="true">
          <span style={{ width: `${Math.round(doc.progress * 100)}%` }} />
        </span>
      </button>

      <div className="doc-card__body">
        <button type="button" className="doc-card__title" onClick={onOpen}>
          {doc.title}
        </button>
        <p className="doc-card__meta">
          {doc.kind === 'note'
            ? t(
                `یادداشت · ${toFa(doc.pageCount)} صفحه`,
                `Note · ${toFa(doc.pageCount)} ${doc.pageCount === 1 ? 'page' : 'pages'}`,
              )
            : `${doc.author ? `${doc.author} · ` : ''}${toFa(doc.pageCount)} ${
                doc.pageCount === 1 ? t('صفحه', 'page') : t('صفحه', 'pages')
              }`}
        </p>
        <div className="doc-card__tags">
          {collection && (
            <span className="mini-chip mini-chip--folder">
              <span style={{ background: collection.color }} />
              {collection.name}
            </span>
          )}
          {doc.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="mini-chip">
              {tag}
            </span>
          ))}
          {doc.tags.length > 2 && <span className="mini-chip">+{toFa(doc.tags.length - 2)}</span>}
        </div>
        <div className="doc-card__foot">
          <span className="doc-card__progress-label">
            <BookOpen size={13} />
            {progressLabel(doc.progress)}
          </span>
          <span className="doc-card__date">{formatRelative(doc.lastReadAt)}</span>
        </div>
        <div className="doc-card__actions">
          <button
            type="button"
            className={`icon-btn icon-btn--sm${doc.favorite ? ' is-fav' : ''}`}
            onClick={onToggleFavorite}
            title={doc.favorite ? t('حذف از موردعلاقه', 'Remove from favorites') : t('افزودن به موردعلاقه', 'Add to favorites')}
            aria-label={t('موردعلاقه', 'Favorite')}
          >
            <Heart size={15} fill={doc.favorite ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            onClick={onEdit}
            title={t('ویرایش', 'Edit')}
            aria-label={t('ویرایش', 'Edit')}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--sm icon-btn--danger"
            onClick={onDelete}
            title={t('حذف', 'Delete')}
            aria-label={t('حذف', 'Delete')}
          >
            <Trash2 size={15} />
          </button>
          <span className="doc-card__annotations" title={t('تعداد نشانه‌ها', 'Number of marks')}>
            {toFa(annotations)} {t('نشانه', 'marks')}
          </span>
        </div>
      </div>
    </article>
  )
}
