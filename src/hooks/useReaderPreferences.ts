import { useEffect, useState } from 'react'
import type { FitMode, ReaderTheme, ViewMode } from '../lib/types'

export function useReaderPreferences() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem('bnote-view-mode')
    return stored === 'spread' || stored === 'continuous' ? stored : 'single'
  })
  const [fitMode, setFitMode] = useState<FitMode>(() =>
    localStorage.getItem('bnote-fit-mode') === 'height' ? 'height' : 'width',
  )
  const [readingTheme, setReadingTheme] = useState<ReaderTheme>(() => {
    const stored = localStorage.getItem('bnote-reading-theme')
    return stored === 'dim' || stored === 'dark' ? stored : 'normal'
  })
  const [snapEnabled, setSnapEnabled] = useState(
    () => localStorage.getItem('bnote-snap') === '1',
  )
  const [showText, setShowText] = useState(
    () => localStorage.getItem('bnote-show-text') !== '0',
  )

  useEffect(() => {
    localStorage.setItem('bnote-view-mode', viewMode)
    localStorage.setItem('bnote-fit-mode', fitMode)
    localStorage.setItem('bnote-reading-theme', readingTheme)
    localStorage.setItem('bnote-snap', snapEnabled ? '1' : '0')
    localStorage.setItem('bnote-show-text', showText ? '1' : '0')
  }, [viewMode, fitMode, readingTheme, snapEnabled, showText])

  return {
    viewMode,
    setViewMode,
    fitMode,
    setFitMode,
    readingTheme,
    setReadingTheme,
    snapEnabled,
    setSnapEnabled,
    showText,
    setShowText,
  }
}
