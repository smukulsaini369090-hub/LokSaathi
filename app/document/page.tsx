"use client";

import React from "react";
import { DocumentScanner } from "@/components/DocumentScanner";
import { useLanguage } from "@/components/LanguageContext";

export default function DocumentPage() {
  const { language } = useLanguage();

  return (
    <div className="py-2">
      <DocumentScanner language={language} />
    </div>
  );
}
