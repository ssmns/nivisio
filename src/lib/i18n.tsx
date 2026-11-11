import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getLang, setActiveLang, translate, type Lang } from './lang'

export type { Lang }

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (fa: string, en?: string) => string
  dir: 'rtl' | 'ltr'
  isRtl: boolean
}

const I18nContext = createContext<I18nValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = getLang()
    setActiveLang(stored)
    return stored
  })

  const setLang = useCallback((next: Lang) => {
    // Keep the module store and localStorage in sync *before* React renders,
    // so helpers such as toFa() and formatBytes() use the new locale in the
    // very first render after a language switch.
    setActiveLang(next)
    try {
      localStorage.setItem('bnote-lang', next)
    } catch {
      // ignore storage failures (private mode)
    }
    setLangState(next)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr'
    document.documentElement.dataset.lang = lang
    document.title =
      lang === 'en' ? 'nivisio — PDF library & notes' : 'nivisio — کتابخانه PDF'
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        'content',
        lang === 'en'
          ? 'nivisio — local-first PDF library, reader, annotation and notebook app.'
          : 'nivisio — کتابخانه، مطالعه و حاشیه‌نویسی PDF؛ آفلاین و روی دستگاه.',
      )
  }, [lang])

  const t = useCallback(
    (fa: string, en?: string) => (lang === 'fa' ? fa : en ?? fa),
    [lang],
  )

  return (
    <I18nContext.Provider
      value={{ lang, setLang, t, dir: lang === 'fa' ? 'rtl' : 'ltr', isRtl: lang === 'fa' }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside LanguageProvider')
  return value
}

export function currentLang(): Lang {
  return getLang()
}

export { translate }
