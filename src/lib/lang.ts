export type Lang = 'fa' | 'en'

let activeLang: Lang | null = null

export function getLang(): Lang {
  if (activeLang) return activeLang
  if (typeof window === 'undefined') return 'fa'
  return localStorage.getItem('bnote-lang') === 'en' ? 'en' : 'fa'
}

export function setActiveLang(lang: Lang) {
  activeLang = lang
}

/** Translate outside React (toasts in hooks, errors in lib). */
export function translate(fa: string, en: string): string {
  return getLang() === 'en' ? en : fa
}
