import type { TextStyle } from './types'

export interface TextBoxSize {
  width: number
  height: number
  lines: number
}

const REFERENCE_WIDTH = 1000
const MAX_WIDTH = 0.86
const LINE_HEIGHT = 1.6
const PADDING_X = 8
const PADDING_Y = 4
const SAFETY_X = 10

/**
 * Measures a text block in normalized page units. `fontSize` is normalized
 * to the page width, so a reference width keeps the result independent of
 * the rendered page size and zoom level.
 */
export function measureTextBox(
  text: string,
  fontSize: number,
  pageAspect = 1.414,
  textStyle: TextStyle = 'normal',
): TextBoxSize {
  const clean = text.trim()
  if (!clean) return { width: 0.12, height: 0.04, lines: 1 }

  const fontPx = Math.max(8, fontSize * REFERENCE_WIDTH)
  const maxWidth = MAX_WIDTH * REFERENCE_WIDTH
  let ctx: CanvasRenderingContext2D | null = null
  if (typeof document !== 'undefined') {
    ctx = document.createElement('canvas').getContext('2d')
  }
  if (ctx) {
    const weight = textStyle.includes('bold') ? 700 : 500
    const italic = textStyle.includes('italic') ? 'italic ' : ''
    ctx.font = `${italic}${weight} ${fontPx}px Vazirmatn, Tahoma, sans-serif`
  }

  const measure = (value: string) =>
    ctx ? ctx.measureText(value).width : value.length * fontPx * 0.52

  let maxLineWidth = 0
  let lines = 0
  for (const paragraph of clean.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      lines += 1
      continue
    }
    let current = ''
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (current && measure(candidate) > maxWidth) {
        maxLineWidth = Math.max(maxLineWidth, measure(current))
        lines += 1
        current = word
      } else {
        current = candidate
      }
    }
    if (current) {
      maxLineWidth = Math.max(maxLineWidth, measure(current))
      lines += 1
    }
  }

  const widthPx = Math.min(
    MAX_WIDTH * REFERENCE_WIDTH,
    Math.max(48, Math.ceil(maxLineWidth) + PADDING_X + SAFETY_X),
  )
  const heightPx = Math.max(fontPx * LINE_HEIGHT + PADDING_Y, lines * fontPx * LINE_HEIGHT + PADDING_Y)
  return {
    width: widthPx / REFERENCE_WIDTH,
    height: Math.min(0.9, heightPx / (REFERENCE_WIDTH * Math.max(0.2, pageAspect))),
    lines: Math.max(1, lines),
  }
}
