import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";
import { Header, BottomNav } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { OnboardingGuide } from "@/components/OnboardingGuide";

export const metadata: Metadata = {
  metadataBase: new URL("https://lok-saathi.vercel.app"),
  title: "LokSaathi — सरकारी योजना एवं दस्तावेज़ सहायक",
  description:
    "अपनी स्थानीय भाषा में बोलकर जानिए सरकारी योजनाओं की पात्रता, असली शुल्क व दस्तावेज़ों का सरल अर्थ।",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LokSaathi",
  },
  openGraph: {
    type: "website",
    locale: "hi_IN",
    alternateLocale: ["en_IN"],
    url: "https://lok-saathi.vercel.app",
    siteName: "LokSaathi (लोकसाथी)",
    title: "LokSaathi — अपनी भाषा में जानें सरकारी योजनाएं और पात्रता",
    description:
      "केंद्र, दिल्ली, हरियाणा, यूपी और पंजाब की 35+ सत्यापित सरकारी योजनाओं की जांच, दलाल-मुक्त शुल्क जानकारी और दस्तावेज़ सहायता — 100% निःशुल्क।",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "LokSaathi Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "LokSaathi — सरकारी योजना एवं दस्तावेज़ सहायक",
    description: "बोलकर जानें सरकारी योजना पात्रता और दस्तावेज़ों का सरल अर्थ।",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a56db",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-gray-900 font-sans antialiased pb-20 selection:bg-blue-100 selection:text-blue-900">
        <LanguageProvider>
          <Header />
          <main className="max-w-2xl mx-auto min-h-[calc(100vh-3.5rem)]">
            {children}
          </main>
          <Footer />
          <PWAInstallBanner />
          <OnboardingGuide />
          <BottomNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
