import type { Metadata } from "next";
import { TermsContent } from "@/components/TermsPrivacyContent";

export const metadata: Metadata = {
  title: "नियम एवं शर्तें (Terms & Conditions) | LokSaathi",
  description:
    "लोकसाथी (LokSaathi) के उपयोग नियम, गैर-सरकारी अस्वीकरण, ₹0 दलाल-मुक्त सुरक्षा नीति और साइबर क्राइम हेल्पलाइन 1930 की जानकारी।",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return <TermsContent />;
}
