# AGENTS.md — NIVISO

## Product

NIVISO is a local-first PDF library, reader and notebook app in Persian/RTL.
Users import PDFs, organize them into study collections, resume reading where they
left off, add highlights, pen/pencil/highlighter strokes, tape, typed text,
images, charts and links, and insert notebook pages with different grids between
PDF pages. It ships as a web app and as an Android APK through Capacitor. There is
**no backend**: every byte lives in IndexedDB on the device.

## Stack

- React 19 + TypeScript + Vite 6
- PDF.js (`pdfjs-dist` 4.x) for rendering and the text layer
- `pdf-lib` for the flattened annotated-PDF export (lazy-loaded)
- Dexie 4 / IndexedDB for persistence
- React Router 7 with **HashRouter** (required for Capacitor)
- Capacitor 6 (`@capacitor/core`, `android`, `filesystem`, `share`)
- Plain CSS with design tokens in `src/styles/global.css`; no UI framework
- Vazirmatn (bundled in `public/fonts`)
- Lightweight FA/EN i18n in `src/lib/i18n.tsx` (`useI18n`, `t(fa, en)`)

## Commands

```bash
./script.sh setup      # install, build, prepare android
./script.sh dev        # Vite on http://127.0.0.1:9180
./script.sh build      # tsc -b && vite build
./script.sh typecheck  # tsc -b
./script.sh sync       # build + cap sync android
./script.sh apk        # assembleDebug
./script.sh doctor     # node, JDK, Android SDK, registry, port check
```

The maintainer environment may use a local Hanbar mirror in `.npmrc`
(`http://localhost:2000/npm/`, docs: `http://localhost:2000/docs`). `.npmrc` is
gitignored; public contributors use the default npm registry from `.npmrc.example`.

## Layout

- `src/pages/LibraryPage.tsx` — import, filter, sort, collections, document editing.
- `src/pages/ReaderPage.tsx` — reader orchestration only: state, effects, page navigation,
  view modes, progress and export. UI is delegated to `components/reader/*` and
  annotation CRUD to `hooks/useReaderActions.ts`.
- `src/components/reader/` — `ReaderHeader`, `ReaderToolbar`, `PageDock`, `PageSlot`,
  `ReaderInfoPanel`, `ReaderBars`.
- `src/pages/TemplatesPage.tsx` + `src/lib/templates.ts` — note template gallery and presets.
- `src/pages/AboutPage.tsx` — in-app product/developer page at `#/about` and `#/developer`.
- `src/lib/noteDocument.ts` — standalone note document factory (no PDF).
- `src/components/PdfPage.tsx` — PDF canvas + text layer or notebook grid,
  selection rects, pen/pencil/highlighter pressure strokes, tape/link drags,
  text/image/chart/lasso interactions.
- `src/components/PenPicker.tsx`, `InsertMenu.tsx`, `TextModal.tsx`,
  `ChartModal.tsx`, `ChartView.tsx`, `LinkModal.tsx`, `PageTemplateModal.tsx`,
  `CoverPicker.tsx` — tool and insertion UI.
- `src/lib/snap.ts` — per-grid snapping (ruled, Cartesian, triangular, 30–60, circular) and guide-edge snapping. `src/lib/lang.ts` keeps the active locale in sync outside React.
- `src/lib/db.ts` — Dexie schema, v2 migration and cascade delete. Change schema
  only with a new Dexie version and a migration.
- `src/styles/global.css` — imports only. Real styles live in focused files
  (`tokens`, `base`, `layout`, `library`, `reader`, `tools`, `views`, `about`, ...).
- `src/lib/pdf.ts` — PDF.js worker setup, import pipeline, metadata, cover generation.
- `src/lib/exportPdf.ts` — flattened PDF export (pdf-lib), grid drawing and annotation
  rasterization. Import it dynamically from the reader.
- `src/lib/chart.ts` — canvas chart drawing shared by export.
- `src/components/AnnotationsPanel.tsx`, `NoteEditor.tsx`, `DocumentEditor.tsx`,
  `CollectionModal.tsx`, `Modal.tsx`, `Toast.tsx`, `Sidebar.tsx`, `DocumentCard.tsx`.
- `android/` — generated Capacitor project (app id `nivisio.jadoo`). Don't hand-edit
  generated `assets/public`; run `./script.sh sync`.

## Data invariants

- DB name: `bnote`, Dexie version 2. Stores: `documents`, `files`, `collections`,
  `notebookPages`, `annotations`. The v2 upgrade adds `pageRef`/`category` to
  annotations, `lastKey` to documents, `autoCover`, and the notebook store.
- Documents may be `kind: 'pdf'` or `kind: 'note'`. Note documents have no file,
  choose `pageSize` (`a4`, `a5`, `b5`, `letter`, `square`, `custom`), orientation,
  optional `pageWidth`/`pageHeight`, `defaultGrid` and `defaultGridScale`.
  Each notebook page owns its own `grid` and `gridScale` (0.7/1/1.55).
- Manual tracking lives on documents: `readPages` is a map of logical page keys and
  `bookmarkKey` points to one logical page. Both use `pdf:n` / `note:id` keys.
- `documents.id === files.id`; the PDF blob is stored once under the same id.
- `progress` is 0..1 over **logical** pages (PDF + notebook) and never decreases
  while re-reading. `lastKey` is the resume target (`pdf:3` or `note:<id>`);
  `lastPage` stays as the nearest PDF page for backwards compatibility.
- Notebook pages: `afterPage` (PDF page after which they appear, 0 = before first),
  `order` for multiple pages after the same PDF page, `grid` is one of
  `lined | grid | dots | graph | cornell | blank`.
- Annotation geometry is **normalized to 0..1** relative to the rendered page:
  - highlight/tape/image/chart/link/text: `rects: {x,y,w,h}[]`
  - ink: `points: {x,y}[]`, optional parallel `pressures`, `penStyle`, `strokeWidth`
  - note: `points[0]` is the marker position, `note` is the text
  Never store pixel coordinates; zoom and device size must not affect placement.
- Every annotation has a `pageRef` (`pdf:n`/`note:id`) plus a numeric PDF `page`
  (0 for notebook pages), `category`, `color`, optional `sortIndex` and `type`
  (`highlight | ink | note | image | chart | link | tape | text | shape | guide`).
- Shapes store `shape: {kind, sides, filled, strokeWidth, flipX, flipY}` in a
  normalized rect. Lines, arrows and curved arrows also store their two endpoints in
  the rect-local `start`/`end` (0..1) plus an optional `bend` for `curve-arrow`, so
  both endpoints stay draggable after creation. Guides store
  `guide: {kind: ruler|protractor|triangle}` and are excluded from PDF export.
  Box objects (tape/image/chart/shape/guide) share the same move/resize/rotate transform
  and handles.
- Deleting a document must remove files, notebook pages and annotations in one
  transaction (`deleteDocumentCascade`). Deleting a notebook page removes its
  annotations (`deleteNotebookPageCascade`).
- All annotations for a page are loaded via `db.annotations.where('docId')` and
  filtered by `pageRef` in the reader.

## PDF / notebook rendering rules

- Worker URL is imported with `?url`; do not hardcode a CDN.
- Set `--scale-factor` from the PDF viewport before rendering the text layer.
- Keep the CSS layering: canvas/notebook grid (0) → text layer (2) →
  annotations (3) → interaction layer (5). `annotation-layer` is
  `pointer-events: none`; only note pins, text boxes and select-mode link
  hotspots re-enable pointer events.
- Cancel render/text tasks on effect cleanup and ignore stale results.
- Selection rects are clipped to the page box and normalized in `captureSelection`.
- PDF pages and notebook pages share the same `PdfPage` interaction surface; never
  fork tool behavior between them.
- Stylus: use Pointer Events, `pointerType === 'pen'`, and `event.pressure`.
  Touch input within ~1.8s of pen input is ignored for palm rejection. Never
  average away pressure when creating an ink annotation.
- Lasso selection is ephemeral UI state. Selected ids highlight with
  `.is-lasso-selected`; moving applies a normalized delta to rects/points on
  pointer-up, not during every pointer move.

## Modularity & file-size rules

Files must stay reviewable. `npm run size` (or `./script.sh size`) enforces the
following hard limits:

| Area | Max lines | Target |
|---|---:|---:|
| `src/pages/*.tsx` | 1300 | < 800 |
| `src/components/**` | 1200 | < 600 |
| `src/hooks/**` | 550 | < 400 |
| `src/lib/**` | 600 | < 450 |
| `src/styles/*.css` | 800 | < 600 |
| other `src` files | 500 | < 350 |

Rules:

1. Do not add another feature block to a file that is already at/over its target.
   Extract first, then add.
2. Pages are orchestration only: state/effects + composition. Move UI into
   `components/<area>/` and async/DB logic into `hooks/use*.ts` or `lib/`.
3. Keep pure helpers in `lib/`; never import React there unless the file is a hook
   or context (e.g. `i18n.tsx`, `chart.ts` stays React-free).
4. CSS: `global.css` is imports only. New selectors go into the relevant style file;
   create a new focused file when a section grows past ~500 lines.
5. UI text must go through `useI18n().t(fa, en)`. Every new feature must be usable
   in both Persian (RTL) and English (LTR); use logical CSS properties.
6. When a page crosses ~70% of its limit, plan a split in the same PR/commit.

## UI rules

- Persian UI, RTL, logical CSS properties (`inset-inline-*`, `padding-inline-*`).
- Use CSS variables; support light and dark. Never hardcode surface/text colors
  inside components.
- Keep mobile usable: 390px is the reference width. Tools collapse to icon-only,
  the sidebar is an off-canvas drawer, the annotations panel is an overlay.
- Bilingual: use `t(fa, en)` and test both directions. `toFa`/dates switch locale
  automatically from localStorage. Never hardcode Persian-only UI labels in new code.
- Reading views: single, spread and continuous share `PageSlot`; fit width/height is
  passed to `PdfPage`. Night/dim themes filter only the PDF canvas, never annotations.
- Page read state and bookmarks are manual and per logical page.
- Note templates live in `lib/templates.ts`; templates create normal note documents.
  Grid presets include lined, grid, dots, graph, cornell, blank, isometric, 30–60 (tri30)
  and circular.
- Panel rows are draggable within a page; persist order in `sortIndex`. The inspector
  edits color, category, stroke width, opacity and rotation in place.
- Snapping (`snapEnabled`) is grid-aware: ruled/cornell snap only vertically, grid/dots/graph
  snap in both axes, isometric and `tri30` use triangular lattices, circular snaps by radius
  and 15° angle, and blank pages only snap to guide edges. Shift snaps line/arrow angles to 15°.
  Keep this behavior in `PdfPage`/`lib/snap.ts`.
- Objects may extend past the page edge; `PdfPage` clips them with `overflow: hidden`.
  Do not clamp drag/resize coordinates back inside the page.
- Page size for standalone notes is editable both at creation and from the reader Info panel;
  always store `pageWidth`/`pageHeight` in PDF points.
- Use `toFa()` for digits and Persian date formatting helpers for dates.
- Every destructive action needs confirmation or an undo toast.
- Keep the document body non-scrollable (`overflow: hidden`); the library, reader stage, About
  and Templates pages scroll internally. The top bar and toolbars stay put.
- In continuous mode the active page is detected from the stage scroll position and highlighted
  with `.page-slot.is-current`; the page dock and header follow it.
- Tools on both PDF and notebooks: select, pan, pen, pencil, highlighter, tape, eraser,
  lasso, Persian/English text, image. Sticky note/chart/link are under the insert menu.
- Zoom: pinch is anchored to the point between the fingers; two-finger drag pans while a
  drawing tool is active; double-tap zooms in/out in select and pan modes. The pan tool
  drags the stage on touch and mouse. Page slots must not use paint containment
  (`content-visibility: auto`) or the horizontal overflow of a zoomed page stops being
  scrollable in RTL.
- Reader side panel tabs: Marks, Info and Assets. `Assets` is the future clipart library;
  it must stay lightweight until clipart insertion exists.
- Text annotations use `dir="auto"`, `unicode-bidi: plaintext` and Vazirmatn so
  Persian and mixed-direction strings render correctly.

## Capacitor

- `appId: nivisio.jadoo`, `appName: NIVISO`, `webDir: dist`, `androidScheme: https`.
- After changing web code intended for the APK: `npm run build && npx cap sync android`.
- Android launcher/splash assets live in `android/app/src/main/res` and use the NIVISO
  logo with the flamingo background `#FFB3C1`.
- Capacitor 6 targets JDK 17 and Android SDK 34. Do not upgrade to Capacitor 7
  without checking JDK 21 and AGP compatibility.
- Native export uses `@capacitor/filesystem` + `@capacitor/share`; web export uses
  a Blob download. Keep both paths working.

## Ports and integration

- Web/dev port: **9180** (strict, overridable with `BNOTE_PORT`). The panel entry is
  `active-projects/14-bnote-pdf-notes -> ../bnote`.
- Don't change the port without updating `active-projects/00-demo-dashboard/projects.json`
  and `active-projects/README.md`.
- The panel launches `npm run dev` in this folder; the package scripts already pin
  host/port.

## Verification checklist

Before calling a change done:

1. `./script.sh verify` (typecheck + file-size check + build)
2. `./script.sh dev`, then:
   - import `public/samples/niviso-guide.pdf` (or the sample button)
   - highlight text and draw with pen, pencil and highlighter; test stylus pressure
     if hardware is available
   - add tape, text (Persian + English), image, chart, link and sticky note
   - lasso-select multiple annotations, move them, recolor, then delete and undo
   - insert a notebook page with each grid type (including isometric/circular),
     change grid density, page size/orientation/custom size
   - add ruler/protractor/set-square guides; draw shapes and a straight line;
     verify snap-to-grid and Shift angle snapping
   - select and reorder annotations in the panel, edit color/thickness/opacity
   - move/resize/rotate image, chart, tape, shape and guide; verify image alpha
   - create a link to another PDF and verify navigation
   - change the cover and the display title; confirm the file name is unchanged
   - export the flattened PDF; check page count and that notebook pages/annotations
     are present
   - change page and reload; last page and progress must persist
   - toggle dark theme and test at 390px width
   - switch language to English and check direction/labels on library, reader, templates
   - test single/spread/continuous views and fit width/height
   - create a standalone note and a note from the templates gallery
3. If Android files changed: `./script.sh sync`, then `./script.sh doctor`.

## Conventions

- TypeScript strict; no `any` unless unavoidable and localized.
- Keep components small and reuse `lib/utils.ts` helpers.
- No analytics, telemetry, remote fonts, or network calls at runtime.
- Update this file and `README.md` whenever commands, ports, data model or the
  Capacitor workflow change.
