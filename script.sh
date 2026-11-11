#!/usr/bin/env bash
# NIVISO developer control script.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PORT="${BNOTE_PORT:-9180}"
REGISTRY="${BNOTE_NPM_REGISTRY:-$(npm config get registry 2>/dev/null || echo https://registry.npmjs.org/)}"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/opt/android-sdk}}"
APK_DEBUG="android/app/build/outputs/apk/debug/app-debug.apk"
APK_RELEASE="android/app/build/outputs/apk/release/app-release-unsigned.apk"

usage() {
  cat <<'EOF'
NIVISO — مدیریت محیط توسعه و ساخت اپ اندروید

  ./script.sh setup       نصب وابستگی‌ها، build و آماده‌سازی پروژه اندروید
  ./script.sh dev         اجرای Vite روی پورت 9180
  ./script.sh build       build تولیدی در dist/
  ./script.sh preview     پیش‌نمایش build روی پورت 9180
  ./script.sh typecheck   بررسی تایپ‌های TypeScript
  ./script.sh size        بررسی سقف اندازه فایل‌ها و پیشنهاد شکستن
  ./script.sh verify      typecheck + size + build
  ./script.sh sync        build + کپی دارایی‌ها به پروژه اندروید (cap sync)
  ./script.sh android     ساخت پروژه اندروید (در صورت نبود) و sync
  ./script.sh apk         ساخت APK دیباگ
  ./script.sh apk:release ساخت APK ریلیز (امضانشده)
  ./script.sh install     نصب APK دیباگ روی دستگاه متصل با adb
  ./script.sh open        باز کردن پروژه در Android Studio
  ./script.sh doctor      بررسی Node، JDK، Android SDK و رجیستری بسته‌ها
  ./script.sh clean       پاک کردن dist و خروجی‌های build اندروید
  ./script.sh help        همین راهنما

متغیرها:
  BNOTE_PORT            پورت اجرا (پیش‌فرض: 9180)
  BNOTE_NPM_REGISTRY    آدرس رجیستری npm (پیش‌فرض: مقدار npm config یا npmjs)
  ANDROID_HOME          مسیر Android SDK (پیش‌فرض: /opt/android-sdk)
EOF
}

log() { printf '\033[1;35m[NIVISO]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[NIVISO]\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31m[NIVISO]\033[0m %s\n' "$*" >&2; exit 1; }

ensure_node() {
  command -v node >/dev/null 2>&1 || die "Node.js نصب نیست. نسخه ۲۰ یا بالاتر لازم است."
  local major
  major="$(node -p 'process.versions.node.split(".")[0]')"
  if [ "$major" -lt 20 ]; then
    die "Node.js فعلی $(node -v) است؛ نسخه ۲۰ یا بالاتر لازم است."
  fi
}

ensure_deps() {
  ensure_node
  if [ ! -d node_modules ]; then
    log "نصب وابستگی‌ها از ${REGISTRY}"
    npm install --no-audit --no-fund --registry "$REGISTRY"
  fi
}

check_sdk() {
  [ -n "$SDK" ] && [ -d "$SDK" ] || die "Android SDK پیدا نشد. ANDROID_HOME را تنظیم کنید (پیش‌فرض: /opt/android-sdk)."
  if [ ! -d "$SDK/platforms" ] || [ -z "$(ls -A "$SDK/platforms" 2>/dev/null)" ]; then
    die "Android SDK Platform نصب نیست. از Android Studio → SDK Manager پلتفرم 34 و Build-Tools 34 را نصب کنید."
  fi
  command -v java >/dev/null 2>&1 || die "Java نصب نیست. Capacitor 6 با JDK 17 کار می‌کند."
  export ANDROID_HOME="$SDK"
  export ANDROID_SDK_ROOT="$SDK"
}

build_web() {
  ensure_deps
  npm run build
}

sync_android() {
  build_web
  if [ ! -d android ]; then
    log "ساخت پروژه اندروید با Capacitor"
    npx cap add android
  else
    npx cap sync android
  fi
}

gradle_build() {
  local task="$1"
  check_sdk
  sync_android
  (cd android && ./gradlew "$task")
}

case "${1:-help}" in
  setup)
    build_web
    if [ ! -d android ]; then
      npx cap add android
    else
      npx cap sync android
    fi
    log "آماده است. اجرای وب: ./script.sh dev  →  http://127.0.0.1:${PORT}"
    ;;
  dev)
    ensure_deps
    log "NIVISO روی http://127.0.0.1:${PORT}"
    BNOTE_PORT="$PORT" npm run dev
    ;;
  build)
    build_web
    log "خروجی تولیدی: dist/"
    ;;
  preview)
    [ -d dist ] || build_web
    log "پیش‌نمایش روی http://127.0.0.1:${PORT}"
    BNOTE_PORT="$PORT" npm run preview
    ;;
  typecheck|test)
    ensure_deps
    npx tsc -b
    log "تایپ‌ها سالم هستند."
    ;;
  size)
    ensure_deps
    node scripts/check-file-size.mjs
    ;;
  verify)
    ensure_deps
    npx tsc -b
    node scripts/check-file-size.mjs
    npm run build
    log "typecheck، اندازه فایل‌ها و build سالم هستند."
    ;;
  sync)
    sync_android
    log "دارایی‌های وب در پروژه اندروید به‌روز شد."
    ;;
  android)
    sync_android
    log "پروژه اندروید آماده است: android/"
    ;;
  apk)
    gradle_build assembleDebug
    [ -f "$APK_DEBUG" ] && log "APK دیباگ: $ROOT/$APK_DEBUG"
    ;;
  apk:release)
    gradle_build assembleRelease
    [ -f "$APK_RELEASE" ] && log "APK ریلیز: $ROOT/$APK_RELEASE"
    warn "برای انتشار در فروشگاه، APK را با keystore خودتان امضا کنید."
    ;;
  install)
    [ -f "$APK_DEBUG" ] || die "ابتدا ./script.sh apk را اجرا کنید."
    command -v adb >/dev/null 2>&1 || die "adb پیدا نشد (Android Platform Tools)."
    adb install -r "$APK_DEBUG"
    ;;
  open)
    [ -d android ] || die "پروژه اندروید وجود ندارد؛ ابتدا ./script.sh android را اجرا کنید."
    npx cap open android
    ;;
  doctor)
    echo "--- NIVISO doctor ---"
    node -v 2>/dev/null || echo "Node: missing"
    npm -v 2>/dev/null || echo "npm: missing"
    java -version 2>&1 | head -1 || echo "Java: missing"
    echo "ANDROID_HOME/پیش‌فرض: ${SDK}"
    if [ -d "$SDK/platforms" ]; then
      echo "SDK platforms: $(ls "$SDK/platforms" | tr '\n' ' ')"
    else
      echo "SDK platforms: missing"
    fi
    if curl -fsS --max-time 3 "${REGISTRY%/}/react" >/dev/null 2>&1; then
      echo "npm registry: OK (${REGISTRY})"
    else
      echo "npm registry: unreachable (${REGISTRY})"
    fi
    if command -v ss >/dev/null 2>&1 && ss -ltn 2>/dev/null | grep -q ":${PORT} "; then
      warn "پورت ${PORT} اشغال است."
    else
      echo "port ${PORT}: free"
    fi
    echo "indexedDB: data lives in the browser/app profile (no server database)."
    ;;
  clean)
    rm -rf dist android/app/build android/build android/.gradle
    log "خروجی‌های build پاک شد."
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    warn "دستور ناشناخته: $1"
    usage
    exit 1
    ;;
esac
