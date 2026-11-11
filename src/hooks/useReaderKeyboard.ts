import { useEffect, type Dispatch, type SetStateAction } from 'react'
import type { Annotation } from '../lib/types'
import { clamp } from '../lib/utils'

interface ReaderKeyboardOptions {
  modalOpen: boolean
  isRtl: boolean
  currentIndex: number
  pageStep: number
  goToIndex: (index: number) => void
  setZoom: Dispatch<SetStateAction<number>>
  activeObjectId: string | null
  annotations: Annotation[]
  selectedIds: string[]
  deleteAnnotation: (annotation: Annotation) => void
  deleteSelected: () => void
  setActiveObjectId: (id: string | null) => void
  setSelectedIds: (ids: string[]) => void
  setSelection: (value: null) => void
}

export function useReaderKeyboard({
  modalOpen,
  isRtl,
  currentIndex,
  pageStep,
  goToIndex,
  setZoom,
  activeObjectId,
  annotations,
  selectedIds,
  deleteAnnotation,
  deleteSelected,
  setActiveObjectId,
  setSelectedIds,
  setSelection,
}: ReaderKeyboardOptions) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        modalOpen ||
        target?.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setActiveObjectId(null)
        setSelectedIds([])
        setSelection(null)
        window.getSelection()?.removeAllRanges()
        return
      }
      const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight'
      const previousKey = isRtl ? 'ArrowRight' : 'ArrowLeft'
      if (event.key === nextKey || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault()
        goToIndex(currentIndex + pageStep)
      } else if (event.key === previousKey || event.key === 'PageUp') {
        event.preventDefault()
        goToIndex(currentIndex - pageStep)
      } else if (event.key === '+' || event.key === '=') {
        setZoom((current) => clamp(current + 0.15, 0.6, 2.4))
      } else if (event.key === '-') {
        setZoom((current) => clamp(current - 0.15, 0.6, 2.4))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentIndex, goToIndex, isRtl, modalOpen, pageStep, setActiveObjectId, setSelectedIds, setSelection, setZoom])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (modalOpen) return
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (activeObjectId) {
        const annotation = annotations.find((item) => item.id === activeObjectId)
        if (annotation) {
          event.preventDefault()
          deleteAnnotation(annotation)
        }
      } else if (selectedIds.length > 0) {
        event.preventDefault()
        deleteSelected()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeObjectId, annotations, deleteAnnotation, deleteSelected, modalOpen, selectedIds])
}
