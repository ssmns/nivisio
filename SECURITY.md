# Security policy

## Supported versions

Security fixes are applied to the latest release on the `main` branch.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report privately through GitHub Security Advisories:

1. Open the repository on GitHub.
2. Go to **Security → Advisories → Report a vulnerability**.
3. Include a description, steps to reproduce, affected versions and any suggested fix.

If GitHub advisories are not available, contact the maintainers through the repository profile and ask for a private channel.

We aim to acknowledge reports within a few days and to publish a fix and advisory when appropriate.

## Scope

nivisio is a local-first app with no backend. Relevant reports include:

- script injection or unsafe HTML rendering,
- unsafe external-link handling,
- unintended network requests or data leakage,
- path traversal or file handling issues in export/share,
- dependency vulnerabilities with a practical impact.

## Out of scope

- Issues that require a compromised device or browser.
- Missing security headers on a static host that do not enable an attack.
- Reports about data stored locally without an additional threat model.

---

## امنیت (فارسی)

برای گزارش آسیب‌پذیری، Issue عمومی باز نکنید. از مسیر **Security → Advisories → Report a vulnerability** در GitHub استفاده کنید و توضیح، مراحل بازتولید، نسخهٔ تحت تأثیر و اصلاح پیشنهادی را بنویسید.

nivisio بک‌اند ندارد؛ گزارش‌های مربوط به تزریق اسکریپت، رندر ناامن HTML، مدیریت ناامن لینک خارجی، درخواست شبکهٔ ناخواسته، نشت داده یا آسیب‌پذیری مؤثر وابستگی‌ها در محدودهٔ بررسی هستند.

از گزارش آسیب‌پذیری‌ها سپاسگزاریم و تلاش می‌کنیم در چند روز اول پاسخ دهیم.
