"use client";

import React, { useState, useRef } from "react";
import {
  Camera,
  Upload,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Volume2,
  Square,
  RefreshCw,
  FileText,
} from "lucide-react";
import { redactAndCompress } from "@/lib/redaction";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import type { DocExplanation } from "@/lib/gemini";

interface DocumentScannerProps {
  language?: "hi" | "en";
  onResult?: (result: DocExplanation) => void;
}

export function DocumentScanner({
  language = "hi",
  onResult,
}: DocumentScannerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>("");
  const [result, setResult] = useState<DocExplanation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { speak, stop, isPlaying } = useSpeechSynthesis();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    setError(null);
    setResult(null);
    setIsProcessing(true);

    try {
      // 1. Create client preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // 2. Client-side PII Redaction + Compression
      setProcessStep(
        language === "hi"
          ? "दस्तावेज़ की सुरक्षा और संपीड़न जारी..."
          : "Securing and compressing on your device..."
      );

      const compressed = await redactAndCompress(file, { maxSizeKb: 800 });

      // 3. Send to server for multimodal explanation
      setProcessStep(
        language === "hi"
          ? "दस्तावेज़ को समझा जा रहा है (10-15 सेकंड)..."
          : "Analyzing document (10-15 seconds)..."
      );

      const res = await fetch("/api/doc-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: compressed.base64,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error("Document analysis failed");
      }

      const docData: DocExplanation = await res.json();
      setResult(docData);
      if (onResult) onResult(docData);
    } catch (err: any) {
      console.error("Doc explain error:", err);
      setError(
        language === "hi"
          ? "दस्तावेज़ का विश्लेषण नहीं हो सका। कृपया फोटो दोबारा खींचें।"
          : "Could not analyze document. Please take another photo."
      );
    } finally {
      setIsProcessing(false);
      setProcessStep("");
    }
  };

  const handleAudioPlayback = () => {
    if (!result) return;
    if (isPlaying) {
      stop();
    } else {
      const speechText = `${result.document_type}. ${result.summary}. ${result.full_explanation}`;
      speak(speechText, language);
    }
  };

  const handleReset = () => {
    stop();
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-4">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
        }}
      />

      {/* Main Upload / Camera View */}
      {!imagePreview && !result && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {language === "hi"
              ? "सरकारी दस्तावेज़ या नोटिस स्कैन करें"
              : "Scan Government Document or Notice"}
          </h2>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
            {language === "hi"
              ? "किसी भी सरकारी पत्र, फॉर्म, अस्वीकृति नोटिस या बिल की फोटो खींचें और सरल भाषा में उसका अर्थ समझें।"
              : "Take a photo of any official notice, form, rejection letter, or bill to understand it simply."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              aria-label="कैमरा से फोटो खींचें (Take photo with camera)"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-6 rounded-2xl transition-all shadow-md active:scale-95"
            >
              <Camera className="w-5 h-5" />
              <span>{language === "hi" ? "कैमरा से फोटो लें" : "Take Photo"}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="फ़ाइल चुनें (Upload file from device)"
              className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3.5 px-6 rounded-2xl transition-all"
            >
              <Upload className="w-5 h-5" />
              <span>{language === "hi" ? "गैलरी / फ़ाइल चुनें" : "Upload File"}</span>
            </button>
          </div>

          {/* DPDP Act Trust Signal Reassurance */}
          <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-4 py-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {language === "hi"
                ? "🔒 आपका दस्तावेज़ सुरक्षित है। यह हमारे सर्वर पर सेव नहीं होता।"
                : "🔒 Your document is safe. It is never stored on our servers."}
            </span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isProcessing && (
        <div className="bg-white rounded-3xl border border-blue-100 p-8 text-center shadow-md">
          <Sparkles className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {language === "hi" ? "दस्तावेज़ की जांच जारी है" : "Analyzing Document"}
          </h3>
          <p className="text-sm text-gray-600">{processStep}</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-800 border border-red-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold underline text-red-900"
          >
            {language === "hi" ? "पुनः प्रयास करें" : "Try Again"}
          </button>
        </div>
      )}

      {/* Structured Result Display */}
      {result && !isProcessing && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-6">
            {/* Header with Type & Audio Suno CTA */}
            <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs uppercase font-semibold text-blue-600 tracking-wide">
                  {language === "hi" ? "दस्तावेज़ का प्रकार" : "Document Type"}
                </span>
                <h3 className="text-xl font-bold text-gray-900">
                  {result.document_type}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAudioPlayback}
                  aria-label={
                    isPlaying ? "रोकें (Stop audio)" : "सुनें (Listen to explanation)"
                  }
                  className="p-2.5 rounded-full text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                  title={language === "hi" ? "आवाज में सुनें" : "Listen in voice"}
                >
                  {isPlaying ? (
                    <Square className="w-5 h-5 fill-current text-red-500" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  aria-label="नया दस्तावेज़ स्कैन करें"
                  className="p-2.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                  title={language === "hi" ? "दूसरा स्कैन करें" : "Scan another"}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="mb-5 bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
              <p className="text-sm text-blue-950 font-medium leading-relaxed">
                {result.summary}
              </p>
            </div>

            {/* Action items */}
            {result.action_items && result.action_items.length > 0 && (
              <div className="mb-5">
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === "hi" ? "आपको क्या करना होगा?" : "Action Items"}
                  </span>
                </h4>
                <div className="space-y-2">
                  {result.action_items.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs shrink-0 font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-gray-800 font-medium">
                          {action.task}
                        </span>
                      </div>
                      {action.deadline && (
                        <span className="text-xs font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {action.deadline}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key fields */}
            {result.key_fields && result.key_fields.length > 0 && (
              <div className="mb-5">
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span>
                    {language === "hi" ? "मुख्य विवरण:" : "Key Details:"}
                  </span>
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {result.key_fields.map((field, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-gray-50 border border-gray-100 rounded-lg"
                    >
                      <p className="text-[11px] text-gray-500">{field.label}</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {field.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full explanation */}
            {result.full_explanation && (
              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  {language === "hi" ? "विस्तृत विवरण:" : "Detailed Notes:"}
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {result.full_explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
