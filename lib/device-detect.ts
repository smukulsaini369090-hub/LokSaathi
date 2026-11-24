/**
 * Client-side OS and environment detector for LokSaathi.
 * Accurately detects operating system, browser family, and PWA standalone status.
 */

export type OperatingSystem = "android" | "ios" | "windows" | "macos" | "linux" | "unknown";
export type BrowserFamily = "chrome" | "safari" | "edge" | "firefox" | "brave" | "samsung" | "other";

export interface DeviceInfo {
  os: OperatingSystem;
  osName: string;
  osNameHi: string;
  browser: BrowserFamily;
  browserName: string;
  isStandalonePWA: boolean;
  supportsPWAInstall: boolean;
  hasTouch: boolean;
  hasSpeechSynthesis: boolean;
  hasGetUserMedia: boolean;
}

export function detectOS(uaString?: string, platformString?: string, maxTouchPoints: number = 0): OperatingSystem {
  const ua = (uaString || (typeof window !== "undefined" ? navigator.userAgent : "")).toLowerCase();
  const platform = (platformString || (typeof window !== "undefined" ? navigator.platform : "")).toLowerCase();

  // Android
  if (/android/.test(ua)) {
    return "android";
  }

  // iOS (iPhone, iPad, iPod) - including iPadOS 13+ which presents as MacIntel with touch points
  if (/iphone|ipad|ipod/.test(ua) || (platform === "macintel" && maxTouchPoints > 1)) {
    return "ios";
  }

  // Windows
  if (/windows|win32|win64/.test(ua) || /win/.test(platform)) {
    return "windows";
  }

  // macOS (ensure not iPad with touch points)
  if (/macintosh|mac os x/.test(ua) || /mac/.test(platform)) {
    return "macos";
  }

  // Linux (ensure not Android)
  if (/linux/.test(ua) || /linux/.test(platform)) {
    return "linux";
  }

  return "unknown";
}

export function detectBrowser(uaString?: string): BrowserFamily {
  const ua = (uaString || (typeof window !== "undefined" ? navigator.userAgent : "")).toLowerCase();

  if (/edg\//.test(ua)) return "edge";
  if (/samsungbrowser/.test(ua)) return "samsung";
  if (/firefox|fxios/.test(ua)) return "firefox";
  if (typeof window !== "undefined" && (navigator as any).brave) return "brave";
  if (/chrome|crios/.test(ua)) return "chrome";
  if (/safari/.test(ua) && !/chrome|crios|android/.test(ua)) return "safari";

  return "other";
}

export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  const isMatchMedia =
    typeof window.matchMedia === "function" ? window.matchMedia("(display-mode: standalone)").matches : false;
  const isNavigatorStandalone = (window.navigator as any)?.standalone === true;
  const isAndroidTWA =
    typeof document !== "undefined" && typeof document.referrer === "string"
      ? document.referrer.includes("android-app://")
      : false;
  return Boolean(isMatchMedia || isNavigatorStandalone || isAndroidTWA);
}

const OS_NAMES: Record<OperatingSystem, { en: string; hi: string }> = {
  android: { en: "Android Phone / Tablet", hi: "एंड्रॉयड फोन (Android)" },
  ios: { en: "Apple iPhone / iPad (iOS)", hi: "एप्पल आईफोन (iPhone / iOS)" },
  windows: { en: "Windows PC / Laptop", hi: "विंडोज कंप्यूटर (Windows PC)" },
  macos: { en: "Apple Mac (macOS)", hi: "एप्पल मैक (macOS)" },
  linux: { en: "Linux PC / Desktop", hi: "लिनक्स कंप्यूटर (Linux)" },
  unknown: { en: "Web Device", hi: "डिवाइस (Web Device)" },
};

const BROWSER_NAMES: Record<BrowserFamily, string> = {
  chrome: "Google Chrome",
  safari: "Apple Safari",
  edge: "Microsoft Edge",
  firefox: "Mozilla Firefox",
  brave: "Brave Browser",
  samsung: "Samsung Internet",
  other: "Web Browser",
};

export function getDeviceInfo(customUA?: string, customPlatform?: string, customTouch?: number): DeviceInfo {
  const touchPoints = customTouch !== undefined ? customTouch : typeof window !== "undefined" ? navigator.maxTouchPoints || 0 : 0;
  const os = detectOS(customUA, customPlatform, touchPoints);
  const browser = detectBrowser(customUA);
  const isPWA = isStandaloneMode();

  const hasSpeech = typeof window !== "undefined" && "speechSynthesis" in window;
  const hasMedia = typeof window !== "undefined" && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const hasTouch = typeof window !== "undefined" ? "ontouchstart" in window || touchPoints > 0 : false;

  return {
    os,
    osName: OS_NAMES[os].en,
    osNameHi: OS_NAMES[os].hi,
    browser,
    browserName: BROWSER_NAMES[browser],
    isStandalonePWA: isPWA,
    supportsPWAInstall: os === "android" || os === "windows" || os === "macos" || os === "linux" || os === "ios",
    hasTouch,
    hasSpeechSynthesis: hasSpeech,
    hasGetUserMedia: hasMedia,
  };
}
