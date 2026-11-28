import React from "react";
import { CheckCircle2, Globe, AlertTriangle } from "lucide-react";

interface EligibilityBadgeProps {
  confidence: "verified" | "web-grounded" | "needs-verification";
  verificationStatus?: "verified" | "verify_latest_notification";
  language?: "hi" | "en";
}

export function EligibilityBadge({
  confidence,
  verificationStatus,
  language = "hi",
}: EligibilityBadgeProps) {
  if (
    verificationStatus === "verify_latest_notification" ||
    confidence === "needs-verification"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        {language === "hi"
          ? "नवीनतम अधिसूचना जांचें"
          : "Verify Latest Notification"}
      </span>
    );
  }

  if (confidence === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        {language === "hi" ? "सत्यापित (Verified)" : "Verified"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      <Globe className="w-3.5 h-3.5 text-blue-600" />
      {language === "hi" ? "इंटरनेट खोज (Web Grounded)" : "Web Sourced"}
    </span>
  );
}
