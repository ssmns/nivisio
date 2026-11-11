import { useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import {
  ArrowLeft,
  ArrowRight,
  Bandage,
  BookOpen,
  Brush,
  CheckCircle2,
  Code2,
  Download,
  Eraser,
  FilePlus2,
  Fingerprint,
  Highlighter,
  ImagePlus,
  Lasso,
  Layers,
  Link2,
  LockKeyhole,
  NotebookPen,
  PenLine,
  Pencil,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Type,
  WifiOff,
  Zap,
} from 'lucide-react'

const FEATURES = [
  {
    icon: BookOpen,
    title: 'کتابخانه شخصی PDF',
    titleEn: 'Personal PDF library',
    text: 'دسته‌بندی مطالعات، برچسب، کاور سفارشی، عنوان نمایشی مستقل و جستجو در همه اسناد.',
    textEn: 'Study categories, tags, custom covers, independent display titles and search across all documents.',
  },
  {
    icon: PenLine,
    title: 'قلم‌های چندگانه',
    titleEn: 'Multiple pen models',
    text: 'خودکار، مداد، قلم نرم، قلم نی، ماژیک و خط‌چین با پشتیبانی از فشار استایلوس.',
    textEn: 'Pen, pencil, soft brush, fountain, marker and dashed styles with stylus pressure.',
  },
  {
    icon: Highlighter,
    title: 'حاشیه‌نویسی کامل',
    titleEn: 'Complete annotation',
    text: 'هایلایت متن، هایلایتر آزاد، نوار چسب قابل جابه‌جایی/چرخش، پاک‌کن و لاسو.',
    textEn: 'Text highlight, freehand highlighter, movable/rotatable tape, eraser and lasso.',
  },
  {
    icon: Type,
    title: 'متن، تصویر و نمودار',
    titleEn: 'Text, image & charts',
    text: 'متن فارسی و انگلیسی، تصویر از گالری و نمودار میله‌ای/خطی/دایره‌ای روی هر برگ.',
    textEn: 'Persian/English text, gallery images and bar/line/pie charts on any page.',
  },
  {
    icon: NotebookPen,
    title: 'یادداشت مستقل',
    titleEn: 'Standalone notes',
    text: 'سند یادداشت بدون PDF با اندازه A4/A5/B5/Letter/مربع و گرید مستقل برای هر صفحه.',
    textEn: 'PDF-free note documents in A4/A5/B5/Letter/Square with an independent grid per page.',
  },
  {
    icon: Link2,
    title: 'پیوندهای هوشمند',
    titleEn: 'Smart links',
    text: 'پیوند به وب، صفحه‌ای از همین سند یا صفحه مشخصی از PDF دیگر در کتابخانه.',
    textEn: 'Link to the web, another page of the same document, or a specific page of another PDF.',
  },
]

const TOOLS = [
  { icon: PenLine, label: 'خودکار', en: 'Pen' },
  { icon: Pencil, label: 'مداد', en: 'Pencil' },
  { icon: Brush, label: 'هایلایتر', en: 'Highlighter' },
  { icon: Bandage, label: 'نوار چسب', en: 'Tape' },
  { icon: Eraser, label: 'پاک‌کن', en: 'Eraser' },
  { icon: Lasso, label: 'لاسو', en: 'Lasso' },
  { icon: Type, label: 'متن', en: 'Text' },
  { icon: ImagePlus, label: 'تصویر', en: 'Image' },
]

const STEPS = [
  {
    icon: FilePlus2,
    title: 'وارد کنید یا بسازید',
    titleEn: 'Import or create',
    text: 'PDF را رها کنید یا یک یادداشت مستقل با اندازه و گرید دلخواه بسازید.',
    textEn: 'Drop a PDF or create a standalone note with your preferred size and grid.',
  },
  {
    icon: PenLine,
    title: 'بخوانید و علامت بزنید',
    titleEn: 'Read and annotate',
    text: 'هایلایت کنید، بنویسید، تصویر و نمودار بگذارید و بین صفحات برگه یادداشت درج کنید.',
    textEn: 'Highlight, write, add images/charts and insert note pages between PDF pages.',
  },
  {
    icon: Download,
    title: 'ذخیره و خروجی بگیرید',
    titleEn: 'Save and export',
    text: 'همه‌چیز خودکار محلی ذخیره می‌شود؛ در پایان یک PDF مسطح با همه نشانه‌ها بگیرید.',
    textEn: 'Everything is saved locally; export a flattened PDF with all marks when done.',
  },
]

const SHORTCUTS = [
  ['صفحه بعد', 'Next page', '← / PageDown / Space'],
  ['صفحه قبل', 'Previous page', '→ / PageUp'],
  ['بزرگ‌نمایی', 'Zoom in', '+ / ='],
  ['کوچک‌نمایی', 'Zoom out', '−'],
  ['چرخش نوار با گام ۱۵°', 'Rotate tape in 15° steps', 'Shift + drag handle'],
]

export function AboutPage() {
  const navigate = useNavigate()
  const { isRtl, lang, setLang, t } = useI18n()

  return (
    <div className="about">
      <header className="about__nav">
        <button
          type="button"
          className="about__brand"
          onClick={() => navigate('/')}
          aria-label={t('بازگشت به کتابخانه', 'Back to library')}
        >
          <img className="brand-mark brand-mark--logo" src="/icon-192.png" alt="" />
          <span>
            <strong>nivisio</strong>
            <em>{t('درباره محصول و توسعه‌دهندگان', 'Product & developers')}</em>
          </span>
        </button>
        <div className="about__nav-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
          >
            {lang === 'fa' ? 'EN' : 'FA'}
          </button>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
            {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            {t('ورود به کتابخانه', 'Open library')}
          </button>
        </div>
      </header>

      <main className="about__main">
        <section className="about-hero">
          <div className="about-hero__copy">
            <span className="about-pill">
              <Sparkles size={13} /> local-first · offline · RTL
            </span>
            <h1>
              {t('بخوان، بنویس، علامت بزن؛', 'Read, write, mark it up;')}
              <br />
              <span>{t('همه‌چیز روی دستگاه خودت.', 'everything on your device.')}</span>
            </h1>
            <p>
              {t('nivisio یک کتابخانه و دفتر یادداشت PDF است: قلم و مداد و هایلایتر، نوار چسب، لاسو، متن فارسی، تصویر، نمودار و پیوند — به‌همراه برگه‌های یادداشت با گرید دلخواه بین صفحات. بدون حساب کاربری، بدون سرور و بدون ارسال داده.', 'nivisio is a PDF library and notebook: pen, pencil and highlighter, tape, lasso, Persian/English text, images, charts and links — plus note pages with custom grids between PDF pages. No account, no server, no data upload.')}
            </p>
            <div className="about-hero__actions">
              <button type="button" className="btn btn--primary btn--lg" onClick={() => navigate('/')}>
                <BookOpen size={18} />
                {t('شروع کنید', 'Get started')}
              </button>
              <span className="about-hero__platforms">
                <Smartphone size={16} /> {t('وب و اندروید (Capacitor)', 'Web and Android (Capacitor)')}
              </span>
            </div>
            <div className="about-hero__stats">
              <span>
                <strong>0</strong> {t('درخواست شبکه در زمان اجرا', 'network requests at runtime')}
              </span>
              <span>
                <strong>8</strong> {t('ابزار حاشیه‌نویسی', 'annotation tools')}
              </span>
              <span>
                <strong>6</strong> {t('گرید برگه یادداشت', 'note page grids')}
              </span>
            </div>
          </div>
          <div className="about-hero__art">
            <img
              src="/showcase/notebook.png"
              alt={t('محیط مطالعه و ابزارهای nivisio', 'nivisio reader and tools')}
            />
            <span className="about-float about-float--privacy">
              <ShieldCheck size={16} />
              {t('داده فقط روی دستگاه', 'Data stays on device')}
            </span>
            <span className="about-float about-float--offline">
              <WifiOff size={16} />
              {t('کاملاً آفلاین', 'Fully offline')}
            </span>
          </div>
        </section>

        <section className="about-section">
          <div className="about-section__head">
            <span className="eyebrow">{t('قابلیت‌ها', 'Features')}</span>
            <h2>{t('یک ابزار، از خواندن تا یادداشت‌برداری', 'One tool, from reading to note-taking')}</h2>
            <p>{t('همه اجزای مسیر مطالعه در یک اپ محلی جمع شده‌اند.', 'Everything in the study workflow lives in one local app.')}</p>
          </div>
          <div className="about-features">
            {FEATURES.map(({ icon: Icon, title, titleEn, text, textEn }) => (
              <article key={title} className="about-feature">
                <span className="about-feature__icon">
                  <Icon size={20} />
                </span>
                <h3>{lang === 'en' ? titleEn : title}</h3>
                <p>{lang === 'en' ? textEn : text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-tools">
          <div>
            <span className="eyebrow">{t('روی PDF و برگه یادداشت', 'On PDF and note pages')}</span>
            <h2>{t('یک جعبه‌ابزار کامل', 'A complete toolbox')}</h2>
            <p>
              {t('هر ابزار روی هر دو بستر کار می‌کند؛ مختصات نشانه‌ها نسبی ذخیره می‌شود و در هر زوم یا اندازه صفحه دقیقاً سر جای خود می‌ماند.', 'Every tool works on both surfaces; mark coordinates are normalized and stay in place at any zoom or page size.')}
            </p>
          </div>
          <div className="about-tools__grid">
            {TOOLS.map(({ icon: Icon, label, en }) => (
              <span key={label}>
                <Icon size={17} />
                {lang === 'en' ? en : label}
              </span>
            ))}
          </div>
        </section>

        <section className="about-section">
          <div className="about-section__head">
            <span className="eyebrow">{t('مسیر استفاده', 'How it works')}</span>
            <h2>{t('سه قدم تا یادداشت بعدی', 'Three steps to your next note')}</h2>
          </div>
          <div className="about-steps">
            {STEPS.map(({ icon: Icon, title, titleEn, text, textEn }, index) => (
              <article key={title}>
                <span className="about-step__num">{index + 1}</span>
                <Icon size={20} />
                <h3>{lang === 'en' ? titleEn : title}</h3>
                <p>{lang === 'en' ? textEn : text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-dev">
          <div className="about-dev__intro">
            <span className="eyebrow">{t('برای توسعه‌دهندگان', 'For developers')}</span>
            <h2>{t('معماری ساده و قابل نگهداشت', 'Simple, maintainable architecture')}</h2>
            <p>
              {t('nivisio یک اپ تک‌صفحه‌ای React است که همه داده‌ها را در IndexedDB نگه می‌دارد. PDF.js رندر و لایه متن را می‌سازد و Capacitor همان باندل را در WebView اندروید اجرا می‌کند. بک‌اند، دیتابیس سروری و API بیرونی وجود ندارد.', 'nivisio is a React SPA that keeps all data in IndexedDB. PDF.js handles rendering and the text layer, while Capacitor runs the same bundle in an Android WebView. There is no backend, server database or external API.')}
            </p>
            <div className="about-stack">
              {[
                'React 19',
                'TypeScript',
                'Vite 6',
                'PDF.js',
                'pdf-lib',
                'Dexie / IndexedDB',
                'Capacitor 6',
                'Vazirmatn',
                'CSS Tokens',
              ].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
          <div className="about-arch">
            <div className="about-arch__box">
              <strong>UI</strong>
              <span>React + HashRouter</span>
            </div>
            <span className="about-arch__arrow">↓</span>
            <div className="about-arch__row">
              <div className="about-arch__box">
                <strong>PDF.js</strong>
                <span>canvas + text layer</span>
              </div>
              <div className="about-arch__box">
                <strong>Dexie</strong>
                <span>docs · pages · marks</span>
              </div>
            </div>
            <span className="about-arch__arrow">↓</span>
            <div className="about-arch__box about-arch__box--accent">
              <strong>Capacitor / Web</strong>
              <span>{t('همان کد، دو بستر', 'Same code, two platforms')}</span>
            </div>
          </div>
        </section>

        <section className="about-dev-grid">
          <article className="about-dev-card">
            <Code2 size={20} />
            <h3>{t('اجرای محلی', 'Local development')}</h3>
            <pre className="about-code">
              <code>{`./script.sh setup
./script.sh dev
# http://127.0.0.1:9180`}</code>
            </pre>
          </article>
          <article className="about-dev-card">
            <Smartphone size={20} />
            <h3>{t('ساخت APK', 'Build APK')}</h3>
            <pre className="about-code">
              <code>{`./script.sh android
./script.sh apk
# android/app/build/outputs/apk/`}</code>
            </pre>
            <p>{t('نیازمند JDK 17 و Android SDK Platform/Build-Tools 34.', 'Requires JDK 17 and Android SDK Platform/Build-Tools 34.')}</p>
          </article>
          <article className="about-dev-card">
            <Layers size={20} />
            <h3>{t('مدل داده', 'Data model')}</h3>
            <p>
              <code>documents</code>{lang === 'en' ? ', ' : '، '}
            <code>files</code>{lang === 'en' ? ', ' : '، '}
            <code>collections</code>{lang === 'en' ? ', ' : '، '}
              <code>notebookPages</code>{' '}
              {t('و', 'and')} <code>annotations</code>{' '}
              {t(
                '؛ همه در نسخه دوم Dexie با مهاجرت خودکار.',
                '— all in Dexie v2 with automatic migration.',
              )}
            </p>
            <p>
              {t('مستندات:', 'Docs:')} <code>README.md</code> {t('و', 'and')}{' '}
              <code>AGENTS.md</code>
            </p>
          </article>
        </section>

        <section className="about-maker">
          <div className="about-maker__logo">
            <img src="/logo-full.png" alt="nivisio" />
          </div>
          <div className="about-maker__copy">
            <span className="eyebrow">{t('توسعه‌دهنده', 'Developer')}</span>
            <img className="about-maker__studio-logo" src="/jadoo-studio.png" alt="Jadoo Studio" />
            <h2>{t('جادو استودیو', 'Jadoo Studio')}</h2>
            <p>
              {t(
                'طراحی محصول، مهندسی و توسعهٔ nivisio توسط جادو استودیو انجام شده است.',
                'Product design, engineering and development for nivisio by Jadoo Studio.',
              )}
            </p>
            <p className="about-maker__meta">
              {t('ایده، طراحی و پیاده‌سازی', 'Concept, design and implementation')} ·{' '}
              <span>jadoo studio</span>
            </p>
          </div>
        </section>

        <section className="about-privacy">
          <span className="about-privacy__icon">
            <LockKeyhole size={26} />
          </span>
          <div>
            <h2>{t('حریم خصوصی، نه به‌عنوان ویژگی، به‌عنوان معماری', 'Privacy as architecture, not a feature')}</h2>
            <p>
              {t('هیچ فایل PDF، هایلایت یا یادداشتی به سرور فرستاده نمی‌شود. کل کتابخانه در IndexedDB همان مرورگر یا WebView ذخیره می‌شود. تنها راه خروج داده، خروجی PDF یا فایل اصلی است که خودتان می‌سازید.', 'No PDF, highlight or note is sent to a server. The whole library lives in the browser/WebView IndexedDB. The only data export is the PDF or original file you create yourself.')}
            </p>
            <div className="about-badges">
              <span>
                <Fingerprint size={14} /> {t('بدون حساب کاربری', 'No account')}
              </span>
              <span>
                <WifiOff size={14} /> {t('بدون وابستگی به شبکه', 'No network dependency')}
              </span>
              <span>
                <CheckCircle2 size={14} /> {t('بدون تلمتری', 'No telemetry')}
              </span>
            </div>
          </div>
        </section>

        <section className="about-section about-shortcuts">
          <div className="about-section__head">
            <span className="eyebrow">{t('میان‌برهای صفحه‌کلید', 'Keyboard shortcuts')}</span>
            <h2>{t('سریع‌تر حرکت کنید', 'Move faster')}</h2>
          </div>
          <div className="about-shortcuts__grid">
            {SHORTCUTS.map(([label, en, keys], index) => {
              let shownKeys = keys
              if (index === 0) shownKeys = isRtl ? '← / PageDown / Space' : '→ / PageDown / Space'
              if (index === 1) shownKeys = isRtl ? '→ / PageUp' : '← / PageUp'
              return (
                <div key={label}>
                  <span>{lang === 'en' ? en : label}</span>
                  <code>{shownKeys}</code>
                </div>
              )
            })}
          </div>
        </section>

        <section className="about-roadmap">
          <div>
            <span className="eyebrow">{t('وضعیت', 'Status')}</span>
            <h2>{t('نسخه فعلی و قدم بعدی', 'Current release and next step')}</h2>
          </div>
          <div className="about-roadmap__grid">
            <article>
              <span className="about-roadmap__badge is-done">{t('اکنون', 'Now')}</span>
              <h3>{t('کتابخانه + یادداشت + خروجی', 'Library + notes + export')}</h3>
              <p>
                {t(
                  'PDF و یادداشت مستقل، همه ابزارها، برگه‌های گریددار، پیوندها، کاور و خروجی PDF.',
                  'PDF and standalone notes, all tools, grid pages, links, covers and PDF export.',
                )}
              </p>
            </article>
            <article>
              <span className="about-roadmap__badge">{t('بعدی', 'Next')}</span>
              <h3>{t('پشتیبان‌گیری، جستجو، OCR', 'Backup, search, OCR')}</h3>
              <p>
                {t(
                  'پشتیبان کامل، جستجو داخل متن، حفظ پیوندها در PDF و بازگردانی آسان.',
                  'Full backup, in-text search, preserved PDF links and easy restore.',
                )}
              </p>
            </article>
            <article>
              <span className="about-roadmap__badge">{t('افق', 'Horizon')}</span>
              <h3>{t('همگام‌سازی رمزنگاری‌شده', 'Encrypted sync')}</h3>
              <p>
                {t(
                  'چنددستگاهی اختیاری با رمزنگاری سرتاسری؛ همچنان بدون اجبار به حساب.',
                  'Optional multi-device sync with end-to-end encryption; still account-optional.',
                )}
              </p>
            </article>
          </div>
        </section>

        <section className="about-final">
          <span className="about-final__icon">
            <Zap size={24} />
          </span>
          <h2>{t('آماده‌اید اولین یادداشت را بسازید؟', 'Ready to create your first note?')}</h2>
          <p>{t('راهنمای نمونه داخل اپ است؛ می‌توانید همان را باز کنید یا PDF خودتان را بیاورید.', 'A sample guide is included; open it or bring your own PDF.')}</p>
          <button type="button" className="btn btn--primary btn--lg" onClick={() => navigate('/')}>
            <NotebookPen size={18} />
            {t('رفتن به کتابخانه', 'Go to library')}
          </button>
        </section>
      </main>

      <footer className="about__footer">
        <span>{t('nivisio · نسخه ۱.۱.۳ · ساختهٔ جادو استودیو', 'nivisio · v1.1.3 · by Jadoo Studio')}</span>
        <span>
          <Search size={13} /> {t('ساخته‌شده با React، PDF.js، Dexie و Capacitor', 'Built with React, PDF.js, Dexie and Capacitor')}
        </span>
      </footer>
    </div>
  )
}
