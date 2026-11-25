"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Undo2,
  Trash2,
  HelpCircle,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import { redactAndCompress, type RedactionBox } from "@/lib/redaction";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { getStoredApiKey } from "@/lib/client-api-key";
import type { DocExplanation } from "@/lib/gemini";
import { DocumentExplanation } from "@/components/DocumentExplanation";

interface DocumentScannerProps {
  language?: "hi" | "en";
  onResult?: (result: DocExplanation) => void;
}

export function DocumentScanner({
  language = "hi",
  onResult,
}: DocumentScannerProps) {
  const [mode, setMode] = useState<"explain" | "form_guide">("explain");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>("");
  const [result, setResult] = useState<DocExplanation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redaction brush state
  const [masks, setMasks] = useState<RedactionBox[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<RedactionBox | null>(null);

  const { speak, stop, isPlaying } = useSpeechSynthesis();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // Load image onto canvas when imagePreviewUrl changes & clean up previous blob URLs on change/unmount
  useEffect(() => {
    if (!imagePreviewUrl) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      imageObjRef.current = img;
      redrawCanvas();
    };
    img.onerror = () => {
      if (cancelled) return;
      setError(
        language === "hi"
          ? "चयनित फ़ाइल पढ़ी नहीं जा सकी। कृपया साफ फोटो (JPG/PNG) या स्क्रीनशॉट चुनें।"
          : "Selected file could not be loaded as an image. Please upload a clear JPG/PNG photo or screenshot."
      );
      setImagePreviewUrl(null);
      setSelectedFile(null);
    };
    img.src = imagePreviewUrl;
    return () => {
      cancelled = true;
      if (imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl, language]);

  // Redraw canvas whenever masks change
  useEffect(() => {
    redrawCanvas();
  }, [masks, currentBox]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions based on image aspect ratio
    const displayWidth = Math.min(img.naturalWidth || 800, 800);
    const scale = displayWidth / (img.naturalWidth || 800);
    const displayHeight = Math.round((img.naturalHeight || 600) * scale);

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Draw base image
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

    // Draw all confirmed masks (solid black boxes)
    ctx.fillStyle = "#000000";
    for (const mask of masks) {
      const rx = mask.x * displayWidth;
      const ry = mask.y * displayHeight;
      const rw = mask.width * displayWidth;
      const rh = mask.height * displayHeight;
      ctx.fillRect(rx, ry, rw, rh);
    }

    // Draw active drawing box preview (semi-transparent black with border)
    if (currentBox) {
      const rx = currentBox.x * displayWidth;
      const ry = currentBox.y * displayHeight;
      const rw = currentBox.width * displayWidth;
      const rh = currentBox.height * displayHeight;
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, rw, rh);
    }
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return { x: 0, y: 0 };
    }
    let clientX = 0;
    let clientY = 0;
    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches?.[0];
      if (!touch) return { x: 0, y: 0 };
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;
    return {
      x: Math.max(0, Math.min(1, rawX / rect.width)),
      y: Math.max(0, Math.min(1, rawY / rect.height)),
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(pos);
    setCurrentBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    const pos = getCanvasCoords(e);
    const x = Math.min(startPos.x, pos.x);
    const y = Math.min(startPos.y, pos.y);
    const width = Math.abs(pos.x - startPos.x);
    const height = Math.abs(pos.y - startPos.y);
    setCurrentBox({ x, y, width, height });
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentBox && currentBox.width > 0.01 && currentBox.height > 0.01) {
      setMasks((prev) => [...prev, currentBox]);
    }
    setCurrentBox(null);
    setStartPos(null);
  };

  const handleUndo = () => {
    setMasks((prev) => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    setMasks([]);
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;
    setError(null);
    setResult(null);

    if (file.type && !file.type.startsWith("image/")) {
      setError(
        language === "hi"
          ? "कृपया फोटो (JPG/PNG) या PDF पेज का स्क्रीनशॉट चुनें। (अन्य फ़ाइल फ़ॉर्मेट अभी समर्थित नहीं हैं।)"
          : "Please upload an image photo (JPG/PNG) or a screenshot of the PDF page."
      );
      return;
    }

    setSelectedFile(file);
    setMasks([]);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setError(null);
    setResult(null);
    setIsProcessing(true);

    try {
      setProcessStep(
        language === "hi"
          ? "गोपनीय डेटा सुरक्षित और संपीड़ित किया जा रहा है..."
          : "Securing private data and compressing on device..."
      );

      // Permanently apply black masks onto compressed canvas
      const compressed = await redactAndCompress(selectedFile, {
        maxSizeKb: 800,
        masks,
      });

      setProcessStep(
        mode === "form_guide"
          ? language === "hi"
            ? "खाली फॉर्म का विश्लेषण और गाइड तैयार की जा रही है..."
            : "Analyzing blank form and generating guide..."
          : language === "hi"
          ? "दस्तावेज़ का विश्लेषण जारी है (10-15 सेकंड)..."
          : "Analyzing document (10-15 seconds)..."
      );

      const storedKey = getStoredApiKey();
      const res = await fetch("/api/doc-explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(storedKey ? { "x-gemini-api-key": storedKey } : {}),
        },
        body: JSON.stringify({
          image_base64: compressed.base64,
          language,
          mode,
          ...(storedKey ? { user_api_key: storedKey } : {}),
        }),
      });

      if (!res.ok) {
        let serverMsg = "";
        try {
          const errJson = await res.json();
          serverMsg = language === "hi" ? errJson.message_hi : errJson.message_en;
        } catch {}
        throw new Error(
          serverMsg ||
            (language === "hi"
              ? "दस्तावेज़ का विश्लेषण नहीं हो सका। कृपया पुनः प्रयास करें।"
              : "Could not analyze document. Please try again.")
        );
      }

      const docData: DocExplanation = await res.json();
      setResult(docData);
      if (onResult) onResult(docData);
    } catch (err: any) {
      console.error("Doc explain error:", err);
      setError(
        err?.message && !err.message.includes("Failed to fetch")
          ? err.message
          : language === "hi"
          ? "दस्तावेज़ का विश्लेषण नहीं हो सका। कृपया इंटरनेट या API कुंजी जांच कर पुनः प्रयास करें।"
          : "Could not analyze document. Please check connection and try again."
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
      let speechText = `${result.document_type}. ${result.summary}. `;
      if (result.form_guide_steps && result.form_guide_steps.length > 0) {
        speechText += result.form_guide_steps
          .map((s) => `${s.box_title}: ${s.what_to_write}`)
          .join(". ");
      } else {
        speechText += result.full_explanation;
      }
      speak(speechText, language);
    }
  };

  const handleReset = () => {
    stop();
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setMasks([]);
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
          if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
        }}
      />

      {/* Mode Selector Toggle */}
      {!imagePreviewUrl && !result && (
        <div className="flex bg-gray-100 p-1 rounded-2xl mb-5 shadow-inner">
          <button
            type="button"
            onClick={() => setMode("explain")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mode === "explain"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>
              {language === "hi"
                ? "सरकारी नोटिस / पत्र समझें"
                : "Understand Notice / Letter"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("form_guide")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mode === "form_guide"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>
              {language === "hi"
                ? "खाली फॉर्म कैसे भरें (गाइड)"
                : "How to Fill Blank Form"}
            </span>
          </button>
        </div>
      )}

      {/* Initial Upload / Camera Selection View */}
      {!imagePreviewUrl && !result && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              mode === "form_guide"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-blue-50 text-blue-600"
            }`}
          >
            {mode === "form_guide" ? (
              <ClipboardList className="w-8 h-8" />
            ) : (
              <Camera className="w-8 h-8" />
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {mode === "form_guide"
              ? language === "hi"
                ? "खाली सरकारी फॉर्म स्कैन करें"
                : "Scan Blank Government Form"
              : language === "hi"
              ? "सरकारी दस्तावेज़ या नोटिस स्कैन करें"
              : "Scan Government Document or Notice"}
          </h2>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
            {mode === "form_guide"
              ? language === "hi"
                ? "किसी भी खाली आवेदन पत्र (राशन कार्ड, पेंशन, छात्रवृत्ति) की फोटो लें। लोकसाथी आपको बॉक्स-दर-बॉक्स भरना सिखाएगा।"
                : "Take a photo of any blank application form. LokSaathi will guide you box-by-box on how to fill it out."
              : language === "hi"
              ? "किसी भी सरकारी पत्र, फॉर्म, अस्वीकृति नोटिस या बिल की फोटो खींचें और सरल भाषा में उसका अर्थ समझें।"
              : "Take a photo of any official notice, rejection letter, or bill to understand it simply."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              aria-label="कैमरा से फोटो खींचें (Take photo with camera)"
              className={`inline-flex items-center justify-center gap-2 text-white font-medium py-3.5 px-6 rounded-2xl transition-all shadow-md active:scale-95 ${
                mode === "form_guide"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
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

          {/* Privacy Signal */}
          <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-4 py-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {language === "hi"
                ? "🔒 आपका दस्तावेज़ सुरक्षित है। यह हमारे सर्वर पर कभी सेव नहीं होता।"
                : "🔒 Your document is safe. It is never stored on our servers."}
            </span>
          </div>
        </div>
      )}

      {/* Redaction Canvas & Preview View (Before Upload) */}
      {imagePreviewUrl && !result && !isProcessing && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-4 sm:p-6 mb-4">
          <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>
                  {language === "hi"
                    ? "गोपनीय जानकारी छुपाएं"
                    : "Hide Sensitive Info (Aadhaar / PAN)"}
                </span>
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {language === "hi"
                  ? "अपनी उंगली या माउस से आधार नंबर या निजी जानकारी पर काली पट्टी खींचें।"
                  : "Drag your finger or mouse over your Aadhaar or PAN to black it out."}
              </p>
            </div>

            {/* Undo / Clear Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleUndo}
                disabled={masks.length === 0}
                title={language === "hi" ? "पिछला मिटाएं" : "Undo"}
                className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition-colors"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={masks.length === 0}
                title={language === "hi" ? "सब हटाएं" : "Clear All"}
                className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Canvas */}
          <div className="relative border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center select-none touch-none mb-4">
            <canvas
              ref={canvasRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              onTouchCancel={handlePointerUp}
              style={{ touchAction: "none" }}
              className="max-w-full h-auto cursor-crosshair rounded-xl block"
            />
          </div>

          {/* Mask Counter Badge */}
          <div className="flex items-center justify-between mb-4 text-xs">
            <span className="font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              🛡️ {masks.length}{" "}
              {language === "hi"
                ? "हिस्से सुरक्षित किए गए (Redacted)"
                : "regions masked"}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-gray-500 hover:text-gray-800 underline font-medium"
            >
              {language === "hi" ? "दूसरी फोटो लें" : "Retake Photo"}
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleAnalyze}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
              mode === "form_guide"
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>
              {mode === "form_guide"
                ? language === "hi"
                  ? "🔒 सुरक्षित करके फॉर्म भरने की गाइड पाएं"
                  : "🔒 Secure & Get Form-Filling Guide"
                : language === "hi"
                ? "🔒 सुरक्षित करके दस्तावेज़ समझें"
                : "🔒 Secure & Analyze Document"}
            </span>
          </button>
        </div>
      )}

      {/* Loading State */}
      {isProcessing && (
        <div className="bg-white rounded-3xl border border-blue-100 p-8 text-center shadow-md">
          <Sparkles className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {mode === "form_guide"
              ? language === "hi"
                ? "फॉर्म की जांच जारी है..."
                : "Analyzing Application Form..."
              : language === "hi"
              ? "दस्तावेज़ की जांच जारी है..."
              : "Analyzing Document..."}
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

      {/* Result Display */}
      {result && !isProcessing && (
        <DocumentExplanation
          result={result}
          language={language}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
