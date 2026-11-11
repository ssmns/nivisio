# Changelog

All notable changes to nivisio are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.1.0] — 2026-11-12

### Added

- Tablet floating tool palette with adjustable width and a compact/all-tools toggle.
- Resize and rotation handles for typed text boxes, including proportional font scaling.
- Visible object action bar for charts, images, shapes, guides and text with rotation and delete.
- Generic object deletion for all selected mark types.
- Movable sticky notes with tap-to-edit and drag-to-move behavior.
- Text boxes now auto-fit their text, with horizontal and vertical alignment.
- Functional measuring guides: cm ruler with real page scale, aspect-locked protractor and 30–60 set square.
- Library display modes: large cards, compact cards and a list view.
- Page-size cards (three per row) and orientation buttons with portrait/landscape icons.
- Thin/medium/thick stroke icons in pen and highlighter width controls.
- Clicking the page closes the tablet marks panel.
- Zoom and View controls moved into the bottom page dock.
- Fit-height mode now works for square and custom-sized pages.
- Library display modes: large cards, compact cards and list view.
- Text annotation font-size slider, presets and bold/italic/bold-italic styles.
- Show/hide page text setting, persisted in local storage.
- View menu opens directly above its trigger and stays inside the viewport on mobile.
- Page-size cards, orientation icons and stroke-width icons.

### Changed

- Tablet library grid now shows three cards per row.
- About feature cards now show two per row on tablets.
- App id changed to `nivisio.jadoo`; Android version bumped to `1.1.0` (versionCode 2).
- Tablet marks panel now sits above the tool palette.

### Fixed

- Closing the sidebar in English/LTR mode.
- View/layout popover going off-screen on tablets.
- Text and chart selection/deletion on touch devices.
- Toolbar and panel overlap in tablet layouts.

---

## [1.0.0] — 2026-11-11

### Added

- Local-first PDF library with collections, tags, favorites, covers and display titles.
- Single, spread and continuous reading modes with fit width/height and normal/dim/night PDF themes.
- Pen, pencil, soft brush, fountain pen, dashed pen and marker with stylus pressure.
- Text highlight, freehand highlighter, tape, eraser, lasso and sticky notes.
- Movable, resizable and rotatable text, transparent images, charts, tape and shapes.
- Line, arrow, rectangle, ellipse, circle, triangle, polygon and star with custom point count.
- Ruler, set square and protractor guides with guide-edge snapping.
- Grid-aware snapping for ruled, grid, dotted, graph, isometric, true 30–60 and circular paper.
- Standalone notes with A4/A5/B5/Letter/Square/custom sizes and portrait/landscape orientation.
- Per-page grids and density, plus 12 note templates.
- Flattened PDF export with note pages, shapes, images, charts, highlights and handwriting.
- Bilingual Persian/English UI with RTL/LTR, locale-aware digits and dates.
- Reader info panel with page setup, reading stats and export controls.
- Active-page tracking in continuous mode.
- Offline-first architecture with no account, backend, telemetry or runtime network dependency.
- Android project with branded launcher icons, adaptive/monochrome icons and splash screens.

### Changed

- Renamed the product from bnote to **nivisio**.
- Updated the visual identity: flamingo theme, new logo, favicon and app icons.
- Split the reader and page layers into smaller components and focused CSS modules.
- Added a file-size/modularity check to CI-ready scripts.

### Fixed

- Language switch now updates digits and counters immediately.
- Corrected left/right navigation icons in English/LTR mode.
- Prevented body scrolling; each page scrolls internally.
- Kept the active page in sync while scrolling in continuous mode.
- Fixed page-size editing and English labels for Square/Custom and color names.
- Fixed object dragging, text/pen movement and selection behavior.
- Fixed the 30–60 grid to use vertical and ±30° line families with matching snapping.

---

## نسخهٔ ۱.۰.۰ — ۱۱ نوامبر ۲۰۲۶

نسخهٔ اولیهٔ nivisio با کتابخانهٔ PDF محلی، خوانندهٔ تک‌صفحه/دو صفحه/پیوسته، ابزارهای حاشیه‌نویسی و طراحی، شکل‌ها، خط‌کش/گونیا/نقاله، اسنپ وابسته به گرید، یادداشت‌های مستقل، ۱۲ قالب، خروجی PDF مسطح، رابط دوزبانه، آیکون‌های اندروید و معماری کاملاً آفلاین منتشر شد.
