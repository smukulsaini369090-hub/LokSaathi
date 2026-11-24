"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink, X, Trash2 } from "lucide-react";
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey, onApiKeyChange } from "@/lib/client-api-key";
import { useLanguage } from "@/components/LanguageContext";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const { language } = useLanguage();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [maskedPreview, setMaskedPreview] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const stored = getStoredApiKey();
      if (stored) {
        setHasExistingKey(true);
        setApiKey(stored);
        setMaskedPreview(
          stored.length > 8 ? `${stored.slice(0, 6)}...${stored.slice(-4)}` : "••••••••"
        );
      } else {
        setHasExistingKey(false);
        setApiKey("");
        setMaskedPreview("");
      }
    };

    refresh();
    const unsub = onApiKeyChange(refresh);
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveDirectly = (keyToSave: string) => {
    setStoredApiKey(keyToSave);
    setStatusMessage(
      language === "hi"
        ? "✅ आपकी API Key सुरक्षित रूप से सहेज ली गई है!"
        : "✅ Your private API Key was saved successfully!"
    );
    setIsSuccess(true);
    setTimeout(() => {
      setStatusMessage(null);
      onClose();
    }, 1200);
  };

  const handleVerifyAndSave = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      clearStoredApiKey();
      setStatusMessage(language === "hi" ? "कुंजी हटा दी गई है।" : "API Key removed.");
      setIsSuccess(true);
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 1000);
      return;
    }

    if (!trimmed.startsWith("AIzaSy")) {
      setStatusMessage(
        language === "hi"
          ? "अमान्य प्रारूप! Google AI Studio API Keys 'AIzaSy' से शुरू होती हैं (39 अक्षर)। यदि आपकी कुंजी 'AQ.' से शुरू होती है तो वह OAuth टोकन है। कृपया aistudio.google.com से मुफ्त कुंजी लें।"
          : "Invalid format! Google AI Studio keys must start with 'AIzaSy' (39 characters). Strings starting with 'AQ.' or other OAuth tokens are not valid API keys."
      );
      setIsSuccess(false);
      return;
    }

    setIsVerifying(true);
    setStatusMessage(
      language === "hi" ? "Google AI सर्वर से कुंजी सत्यापित हो रही है..." : "Verifying key with Google AI..."
    );

    try {
      const res = await fetch("/api/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: trimmed }),
      });
      const data = await res.json();

      if (data.valid) {
        setIsSuccess(true);
        setStatusMessage(language === "hi" ? data.message_hi : data.message_en);
        setStoredApiKey(trimmed);
        setTimeout(() => {
          setStatusMessage(null);
          setIsVerifying(false);
          onClose();
        }, 1200);
      } else {
        setIsSuccess(false);
        setStatusMessage(language === "hi" ? data.message_hi : data.message_en);
        setIsVerifying(false);
      }
    } catch {
      // Fallback: save based on valid AIzaSy syntax
      handleSaveDirectly(trimmed);
      setIsVerifying(false);
    }
  };

  const handleClear = () => {
    clearStoredApiKey();
    setApiKey("");
    setHasExistingKey(false);
    setStatusMessage(
      language === "hi"
        ? "कस्टम कुंजी हटा दी गई। अब सर्वर डिफ़ॉल्ट का उपयोग होगा।"
        : "Custom key removed. Now using server default."
    );
    setIsSuccess(true);
    setTimeout(() => {
      setStatusMessage(null);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-key-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 id="api-key-modal-title" className="font-bold text-gray-900 text-base leading-tight">
                {language === "hi" ? "अपनी Gemini API Key जोड़ें" : "Bring Your Own Key (BYOK)"}
              </h3>
              <p className="text-xs text-gray-500">
                {language === "hi" ? "असीमित उपयोग के लिए अपनी कुंजी लगाएं" : "Use your own key for unlimited usage"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="text-xs text-gray-600 leading-relaxed bg-blue-50/80 border border-blue-100 rounded-xl p-3.5 space-y-1.5">
            <p className="font-semibold text-blue-900 flex items-center gap-1.5">
              <span>🛡️</span>
              {language === "hi" ? "100% निजी और सुरक्षित" : "100% Private & Device-Only"}
            </p>
            <p>
              {language === "hi"
                ? "आपकी API Key केवल आपके ब्राउज़र (localStorage) में सुरक्षित रहती है। यह कभी हमारे सर्वर पर सेव नहीं होती।"
                : "Your API key is stored strictly on your local browser. It is never saved or logged on our servers."}
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-700 font-semibold hover:underline pt-1"
            >
              <span>{language === "hi" ? "मुफ्त Gemini API Key प्राप्त करें (Google AI Studio)" : "Get a Free Gemini Key (Google AI Studio)"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Current status */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-gray-500 font-medium">
              {language === "hi" ? "वर्तमान स्थिति:" : "Current Status:"}
            </span>
            {hasExistingKey ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {language === "hi" ? `कस्टम कुंजी सक्रिय (${maskedPreview})` : `Custom Key Active (${maskedPreview})`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                {language === "hi" ? "सर्वर डिफ़ॉल्ट कुंजी" : "Server Default Key"}
              </span>
            )}
          </div>

          {/* Input field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              {language === "hi" ? "Google Gemini API Key:" : "Google Gemini API Key:"}
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy... (39 characters from Google AI Studio)"
                className="w-full pl-3.5 pr-10 py-2.5 text-sm font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                aria-label={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-gray-500">
              {language === "hi"
                ? "💡 Google AI Studio की Key हमेशा 'AIzaSy' से शुरू होती है।"
                : "💡 Google AI Studio keys always start with 'AIzaSy'."}
            </p>
          </div>

          {/* Alert / Feedback message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                isSuccess
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {isSuccess ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-3">
          {hasExistingKey ? (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === "hi" ? "हटाएं" : "Remove"}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isVerifying}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              {language === "hi" ? "रद्द करें" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleVerifyAndSave}
              disabled={isVerifying}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all disabled:opacity-75"
            >
              {isVerifying && (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>
                {isVerifying
                  ? language === "hi"
                    ? "जाँच जारी..."
                    : "Verifying..."
                  : language === "hi"
                  ? "जाँचें और सहेजें (Verify & Save)"
                  : "Verify & Save Key"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
