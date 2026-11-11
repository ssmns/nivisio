import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FilePlus2, Layers, LayoutTemplate, Sparkles } from 'lucide-react'
import { NOTE_TEMPLATES, templateTitle, type NoteTemplate } from '../lib/templates'
import { COVER_PRESETS } from '../lib/types'
import { PAGE_SIZES } from '../lib/types'
import { createNoteDocument } from '../lib/noteDocument'
import { useToast } from '../components/Toast'
import { useI18n } from '../lib/i18n'

export function TemplatesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { isRtl, lang, t } = useI18n()

  const useTemplate = async (template: NoteTemplate) => {
    const id = await createNoteDocument({
      title: templateTitle(template, lang),
      pageSize: template.pageSize,
      pageOrientation: template.orientation ?? 'portrait',
      grid: template.grid,
      gridScale: template.gridScale ?? 1,
      pageCount: template.pageCount,
      coverPreset: template.coverPreset,
    })
    toast.show(
      t(
        `یادداشت از قالب «${template.name}» ساخته شد.`,
        `Note created from “${template.nameEn}”.`,
      ),
      { tone: 'success' },
    )
    navigate(`/read/${id}`)
  }

  return (
    <div className="templates-page">
      <header className="templates-head">
        <button
          type="button"
          className="icon-btn"
          onClick={() => navigate('/')}
          aria-label={t('بازگشت به کتابخانه', 'Back to library')}
        >
          {isRtl ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
        </button>
        <div>
          <span className="eyebrow">
            <LayoutTemplate size={13} /> TEMPLATES
          </span>
          <h1>{t('قالب‌های یادداشت', 'Note templates')}</h1>
          <p>{t(
            'یک قالب را انتخاب کنید؛ اندازه، گرید و تعداد صفحات از پیش تنظیم می‌شوند.',
            'Pick a template; size, grid and page count are preconfigured.',
          )}</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navigate('/')}
        >
          <FilePlus2 size={16} />
          {t('یادداشت خالی', 'Blank note')}
        </button>
      </header>

      <div className="templates-grid">
        {NOTE_TEMPLATES.map((template) => {
          const preset = COVER_PRESETS[template.coverPreset] ?? COVER_PRESETS[0]
          return (
            <article key={template.id} className="template-card">
              <div
                className="template-card__art"
                style={{
                  background: `linear-gradient(145deg, ${preset.from}, ${preset.to})`,
                }}
              >
                <span className={`grid-preview grid-preview--${template.grid}`} />
                <span className="template-card__tag">
                  <Sparkles size={11} />
                  {lang === 'en' ? template.tagEn : template.tag}
                </span>
              </div>
              <div className="template-card__body">
                <h2>{lang === 'en' ? template.nameEn : template.name}</h2>
                <p>{lang === 'en' ? template.descriptionEn : template.description}</p>
                <div className="template-card__meta">
                  <span>
                    <Layers size={13} />
                    {lang === 'en' ? PAGE_SIZES[template.pageSize].nameEn : PAGE_SIZES[template.pageSize].name}
                  </span>
                  <span>{template.pageCount} {t('صفحه', 'pages')}</span>
                </div>
                <button
                  type="button"
                  className="btn btn--primary btn--block"
                  onClick={() => {
                    void useTemplate(template)
                  }}
                >
                  <FilePlus2 size={15} />
                  {t('ساخت از این قالب', 'Create from template')}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
