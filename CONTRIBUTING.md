# Contributing to NIVISO

Thanks for your interest. NIVISO is a local-first, bilingual PDF reader and notebook. Contributions of all sizes are welcome: bug reports, translations, accessibility, documentation, performance, design and code.

## Before you start

- Open an issue for large features or architectural changes so we can agree on the approach first.
- For bug fixes and small improvements, open a pull request directly.
- Read the project notes and conventions in [`AGENTS.md`](./AGENTS.md).

## Development setup

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/ssmns/nivisio.git
cd nivisio
npm install
npm run dev
```

The dev server runs at <http://127.0.0.1:9180>.

## Checks

Run these before opening a pull request:

```bash
./script.sh verify
```

This runs TypeScript, the file-size/modularity check and the production build.

## Rules for code changes

- Keep changes consistent with the existing structure, naming and patterns.
- Pages are orchestration only; move reusable UI into `src/components/` and async/DB logic into `src/hooks/` or `src/lib/`.
- Keep files below the limits in [`AGENTS.md`](./AGENTS.md). `npm run size` enforces them.
- Use logical CSS properties (`inset-inline-*`, `padding-inline-*`) so RTL and LTR both work.
- Never add a backend, analytics, telemetry or required runtime network calls.
- Keep annotation coordinates normalized to `0..1`.
- Add English and Persian text for every new UI string via `useI18n().t(fa, en)`.
- Test both Persian/RTL and English/LTR, at desktop and 390px width.
- For UI changes, include a screenshot or a short recording.

## Commit messages

Use short, descriptive messages:

```text
feat: add 30-60 grid snapping
fix: keep active page in sync while scrolling
docs: add Persian README
```

## Pull requests

- Describe the problem and the solution.
- Mention the tests you ran.
- Link related issues.
- Keep pull requests focused; split unrelated changes.

## Reporting bugs

Use the GitHub issue template and include:

- steps to reproduce,
- expected and actual behavior,
- browser/OS and app version,
- screenshots or console errors if relevant.

## Security

Please do not open a public issue for security problems. Follow [`SECURITY.md`](./SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the MIT License.

---

## همکاری (فارسی)

از مشارکت شما سپاسگزاریم. برای تغییرات بزرگ اول یک Issue باز کنید تا دربارهٔ رویکرد به توافق برسیم.

- پروژه را با `npm install` و `npm run dev` اجرا کنید.
- قبل از ارسال Pull Request دستور `./script.sh verify` را اجرا کنید.
- برای هر متن جدید UI، نسخهٔ فارسی و انگلیسی را اضافه کنید.
- RTL و LTR و عرض ۳۹۰ پیکسل را تست کنید.
- برای تغییرات UI اسکرین‌شات یا ویدئوی کوتاه اضافه کنید.
- برای گزارش امنیتی از Issue عمومی استفاده نکنید؛ [`SECURITY.md`](./SECURITY.md) را ببینید.

مشارکت‌ها تحت لایسنس MIT منتشر می‌شوند.
