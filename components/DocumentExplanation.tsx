"use client";

import React from "react";
import {
  Volume2,
  Square,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import type { DocExplanation } from "@/lib/gemini";

interface DocumentExplanationProps {
  result: DocExplanation;
  language?: "hi" | "en";
  onReset?: () => void;
}

export function DocumentExplanation({
  result,
  language = "hi",
  onReset,
}: DocumentExplanationProps) {
  const { speak, stop, isPlaying } = useSpeechSynthesis();

  const handleAudioPlayback = () => {
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

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-6">
        {/* Header with Type & Audio Suno CTA */}
        <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
          <div>
            <span
              className={`text-xs uppercase font-semibold tracking-wide ${
                result.mode === "form_guide"
                  ? "text-emerald-700"
                  : "text-blue-600"
              }`}
            >
              {result.mode === "form_guide"
                ? language === "hi"
                  ? "आवेदन फॉर्म गाइड (Field-by-Field Guide)"
                  : "Application Form Guide"
                : language === "hi"
                ? "दस्तावेज़ का प्रकार"
                : "Document Type"}
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

            {onReset && (
              <button
                type="button"
                onClick={onReset}
                aria-label="नया दस्तावेज़ स्कैन करें"
                className="p-2.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                title={language === "hi" ? "दूसरा स्कैन करें" : "Scan another"}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <div className="mb-5 bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
          <p className="text-sm text-blue-950 font-medium leading-relaxed">
            {result.summary}
          </p>
        </div>

        {/* Form-Guide Steps (if mode is form_guide) */}
        {result.form_guide_steps && result.form_guide_steps.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
              <span>
                {language === "hi"
                  ? "फॉर्म भरने के चरण (क्रमवार बॉक्स गाइड):"
                  : "Step-by-Step Box Guide:"}
              </span>
            </h4>
            <div className="space-y-3">
              {result.form_guide_steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-gray-900 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      {step.box_title}
                    </span>
                    {step.is_optional && (
                      <span className="text-[11px] font-medium text-gray-500">
                        {language === "hi" ? "वैकल्पिक" : "Optional"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 font-medium mb-1.5">
                    👉 {step.what_to_write}
                  </p>
                  {step.source_document && (
                    <p className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-lg inline-block">
                      📄 {language === "hi" ? "स्रोत दस्तावेज़:" : "From:"}{" "}
                      <span className="font-semibold">
                        {step.source_document}
                      </span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key fields (if mode is explain) */}
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

        {/* Action items / Supporting Documents */}
        {result.action_items && result.action_items.length > 0 && (
          <div className="mb-5">
            <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {result.mode === "form_guide"
                  ? language === "hi"
                    ? "संलग्न किए जाने वाले दस्तावेज़ / काम:"
                    : "Required Documents to Attach:"
                  : language === "hi"
                  ? "आपको क्या करना होगा?"
                  : "Action Items"}
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

        {/* Warnings */}
        {result.warnings && result.warnings.length > 0 && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>
                {language === "hi"
                  ? "महत्वपूर्ण सावधानियां:"
                  : "Important Precautions:"}
              </span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-amber-900 font-medium">
              {result.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
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
  );
}
