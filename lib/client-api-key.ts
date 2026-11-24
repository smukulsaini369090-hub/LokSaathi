"use client";

const STORAGE_KEY = "loksaathi_gemini_api_key";
const EVENT_NAME = "loksaathi-api-key-changed";

export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return (localStorage.getItem(STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function setStoredApiKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    const clean = key.trim();
    if (clean) {
      localStorage.setItem(STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch (err) {
    console.warn("Failed to save API key to localStorage:", err);
  }
}

export function clearStoredApiKey(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {}
}

export function hasStoredApiKey(): boolean {
  return !!getStoredApiKey();
}

export function onApiKeyChange(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}
