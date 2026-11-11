import {
  ArrowUpRight,
  GraduationCap,
  Shapes,
  Smile,
  Sparkles,
  Sticker,
  Trees,
  Briefcase,
} from 'lucide-react'
import { useI18n } from '../../lib/i18n'

const CATEGORIES = [
  { id: 'shapes', icon: Shapes, fa: 'شکل‌ها', en: 'Shapes' },
  { id: 'stickers', icon: Sticker, fa: 'استیکر', en: 'Stickers' },
  { id: 'study', icon: GraduationCap, fa: 'آموزشی', en: 'Study' },
  { id: 'arrows', icon: ArrowUpRight, fa: 'فلش و نشانه', en: 'Arrows' },
  { id: 'faces', icon: Smile, fa: 'چهره‌ها', en: 'Faces' },
  { id: 'nature', icon: Trees, fa: 'طبیعت', en: 'Nature' },
  { id: 'work', icon: Briefcase, fa: 'اداری', en: 'Work' },
  { id: 'decor', icon: Sparkles, fa: 'تزئینی', en: 'Decorative' },
]

/** Placeholder library for the clipart collection that will be added later. */
export function ReaderAssetsPanel() {
  const { t } = useI18n()
  return (
    <div className="assets-panel">
      <div className="assets-panel__head">
        <span className="assets-panel__badge">
          <Sparkles size={12} />
          {t('به‌زودی', 'Coming soon')}
        </span>
        <h3>{t('دارایی‌ها', 'Assets')}</h3>
        <p>
          {t(
            'کلیپ‌آرت‌ها، استیکرها و آیکون‌های آماده اینجا جمع می‌شوند؛ بعداً با یک لمس می‌توانید آن‌ها را روی برگ اضافه کنید.',
            'Ready-made cliparts, stickers and icons will live here; later you can add them to a page with one tap.',
          )}
        </p>
      </div>

      <div className="assets-grid">
        {CATEGORIES.map(({ id, icon: Icon, fa, en }) => (
          <article key={id} className="asset-slot">
            <span className="asset-slot__art">
              <Icon size={22} />
            </span>
            <strong>{t(fa, en)}</strong>
            <em>{t('به‌زودی', 'Soon')}</em>
          </article>
        ))}
      </div>
    </div>
  )
}
