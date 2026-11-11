#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = join(ROOT, 'src')

const LIMITS = {
  pages: 1300,
  components: 1200,
  hooks: 550,
  lib: 600,
  styles: 800,
  other: 500,
}

function classify(file) {
  const rel = relative(SRC, file).replaceAll('\\\\', '/')
  if (rel.startsWith('styles/') || rel.endsWith('.css')) return 'styles'
  if (rel.startsWith('pages/')) return 'pages'
  if (rel.startsWith('components/')) return 'components'
  if (rel.startsWith('hooks/')) return 'hooks'
  if (rel.startsWith('lib/')) return 'lib'
  return 'other'
}

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) out.push(...walk(full))
    else if (/\.(ts|tsx|css)$/.test(entry)) out.push(full)
  }
  return out
}

let failures = 0
let warnings = 0
const rows = []

for (const file of walk(SRC)) {
  const lines = readFileSync(file, 'utf8').split('\n').length
  const kind = classify(file)
  const limit = LIMITS[kind]
  const rel = relative(ROOT, file)
  rows.push({ rel, kind, lines, limit })
  if (lines > limit) {
    failures += 1
    console.error(`✖ ${rel} — ${lines} lines (limit ${limit}, ${kind})`)
  } else if (lines > limit * 0.8) {
    warnings += 1
    console.warn(`△ ${rel} — ${lines} lines (approaching ${limit}, ${kind})`)
  }
}

rows.sort((a, b) => b.lines - a.lines)
console.log('\nLargest source files:')
for (const row of rows.slice(0, 12)) {
  console.log(`  ${String(row.lines).padStart(5)}  ${row.rel}`)
}

if (failures > 0) {
  console.error(
    `\n${failures} file(s) exceed the size limit. Split by responsibility before adding more code.`,
  )
  process.exit(1)
}

console.log(
  `\nFile-size check passed${warnings ? ` with ${warnings} warning(s)` : ''}.`,
)
