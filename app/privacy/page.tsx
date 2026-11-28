import type { Metadata } from "next";
import { PrivacyContent } from "@/components/TermsPrivacyContent";

export const metadata: Metadata = {
  title: "गोपनीयता सूचना (Privacy & DPDP 2023) | LokSaathi",
  description:
    "DPDP Act 2023 अनुरूप गोपनीयता नीति: शून्य सर्वर PII डेटाबेस, आधार/पैन ब्राउज़र सुरक्षा ब्रश और एक-टैप लोकल डेटा हटाने का अधिकार।",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
