# Changelog

All notable changes to NIVISO are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.1.5] — 2026-11-11

### Added

- Spiral, heart and diamond shapes.
- Horizontal bar and scatter chart types.
- A third reader panel tab, **Assets**, prepared for the future clipart library.

### Changed

- Brand name standardized as **NIVISO** (نی‌ویسیو) across the web app, Android app, manifest, docs and About page.
- Regenerated web icons, favicons, Android launcher icons and splash screens from the corrected SVG logo.
- Pen-model dropdown now sits next to the color swatches; highlighter widths sit next to Snap.

### Fixed

- Touch drag-and-drop reordering works in the marks panel.

---

## [1.1.4] — 2026-11-11

### Added

- Curved arrow shape with an adjustable bend handle.
- Bézier arrow with two independent control handles.
- Icon previews for every shape kind in the shape picker.
- Lines and arrows are now defined by two draggable endpoints, so either end can be moved after drawing.
- Dedicated pan tool for one-finger and mouse panning.
- Pinch zoom is anchored to the point between the fingers; double-tap zooms in and out in select/pan modes.
- Two-finger drag pans while a drawing tool is active, without leaving stray ink.
- Area and radar chart types, including PDF export support.
- Documented the origin of the NIVISO name in the README, Persian docs and About page.

### Fixed

- Zoomed pages can now be panned horizontally on touch devices, including RTL Persian layouts. Page slots no longer use `content-visibility` paint containment, which was clipping the scrollable overflow.
- Shape strokes, arrowheads and angles no longer distort when the shape box is stretched.
- Moving or resizing a rotated arrow keeps the dragged endpoint exactly under the pointer; endpoint edits reset the redundant rotation without moving the line.
- Horizontal lines and arrows have a larger invisible grab area, so they are easy to move on touch screens.
- The export pipeline draws the new two-point lines and curved arrows with the same geometry.

### Repository

- [github.com/ssmns/nivisio](https://github.com/ssmns/nivisio)

---

## [1.1.3] — 2026-11-12

### Fixed

- Pen-model menu is now fixed-positioned and stays inside the mobile viewport in both Persian and English.

---

## [1.1.2] — 2026-11-12

### Fixed

- Highlighter stroke-width icons are visible on mobile.
- Mobile defaults to icon-only buttons; the label preference is stored per device class.
- The mobile toolbar stays on one row and scrolls horizontally instead of wrapping.
- Two-finger drag pans the page and two-finger pinch zooms.
- Toasts are shorter and sit in the bottom-right corner on mobile instead of covering the width.
- Note templates show four cards per row on mobile.
- Charts can be edited after placement (title, labels, values, color, background).
- Chart backgrounds support presets and a transparent option.
- Chart selection handles are no longer clipped by the chart box.
- The Insert menu is anchored inside the mobile viewport.
- Removed tablet-only features: floating/resizable toolbar, tablet 3-card library rule and tablet-only About layout. The app now targets mobile and desktop layouts.

---

## [1.1.1] — 2026-11-12

### Fixed

- Text annotations no longer wrap to a second line when they should fit on one line. The measured box now includes a safety margin and uses up to 86% of the page width before wrapping.
- Reader stage measurements now attach after the document mounts, so fit-height and zoom gestures work reliably.
- Added Ctrl/⌘ + mouse wheel and two-finger pinch zoom (page zoom, not browser zoom).
- Added a persisted button-label preference: text + icon or icon only.

---

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

- Renamed the product from bnote to **NIVISO**.
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

نسخهٔ اولیهٔ NIVISO با کتابخانهٔ PDF محلی، خوانندهٔ تک‌صفحه/دو صفحه/پیوسته، ابزارهای حاشیه‌نویسی و طراحی، شکل‌ها، خط‌کش/گونیا/نقاله، اسنپ وابسته به گرید، یادداشت‌های مستقل، ۱۲ قالب، خروجی PDF مسطح، رابط دوزبانه، آیکون‌های اندروید و معماری کاملاً آفلاین منتشر شد.
