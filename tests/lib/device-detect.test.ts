import { describe, it, expect } from "vitest";
import { detectOS, detectBrowser, getDeviceInfo } from "@/lib/device-detect";

describe("Device & OS Detector (lib/device-detect)", () => {
  const UA_STRINGS = {
    androidChrome:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    iphoneSafari:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
    ipadTouch:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    windowsEdge:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    macChrome:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    linuxFirefox:
      "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0",
    samsungInternet:
      "Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.5790.166 Mobile Safari/537.36",
  };

  it("accurately detects Android phones & tablets", () => {
    const os = detectOS(UA_STRINGS.androidChrome);
    expect(os).toBe("android");
  });

  it("accurately detects iOS iPhones", () => {
    const os = detectOS(UA_STRINGS.iphoneSafari);
    expect(os).toBe("ios");
  });

  it("accurately detects iPadOS presenting as MacIntel with touch points", () => {
    const os = detectOS(UA_STRINGS.ipadTouch, "MacIntel", 5);
    expect(os).toBe("ios");
  });

  it("accurately detects Windows PCs & Laptops", () => {
    const os = detectOS(UA_STRINGS.windowsEdge);
    expect(os).toBe("windows");
  });

  it("accurately detects macOS desktops without touch", () => {
    const os = detectOS(UA_STRINGS.macChrome, "MacIntel", 0);
    expect(os).toBe("macos");
  });

  it("accurately detects Linux desktops", () => {
    const os = detectOS(UA_STRINGS.linuxFirefox);
    expect(os).toBe("linux");
  });

  it("accurately identifies browser families", () => {
    expect(detectBrowser(UA_STRINGS.windowsEdge)).toBe("edge");
    expect(detectBrowser(UA_STRINGS.linuxFirefox)).toBe("firefox");
    expect(detectBrowser(UA_STRINGS.samsungInternet)).toBe("samsung");
    expect(detectBrowser(UA_STRINGS.iphoneSafari)).toBe("safari");
    expect(detectBrowser(UA_STRINGS.androidChrome)).toBe("chrome");
  });

  it("getDeviceInfo returns comprehensive device capability payload", () => {
    const info = getDeviceInfo(UA_STRINGS.androidChrome);
    expect(info.os).toBe("android");
    expect(info.browser).toBe("chrome");
    expect(info.osName).toContain("Android");
    expect(info.osNameHi).toContain("एंड्रॉयड");
    expect(info.supportsPWAInstall).toBe(true);
  });
});
