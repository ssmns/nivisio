import type { Annotation, NormPoint, NormRect, NotebookPage } from '../../lib/types'

export interface SelectedText {
  rects: NormRect[]
  text: string
  anchor: { x: number; y: number }
}

export interface NoteTarget {
  annotation?: Annotation
  point?: NormPoint
}

export interface PageTemplateState {
  mode: 'create' | 'edit'
  page?: NotebookPage
}

export interface TextTarget {
  annotation?: Annotation
  point?: NormPoint
  pageAspect?: number
}
