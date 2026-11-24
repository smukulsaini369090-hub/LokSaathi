import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";
import { Header, BottomNav } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";

export const metadata: Metadata = {
  title: "LokSaathi — सरकारी योजना एवं दस्तावेज़ सहायक",
  description: "अपनी स्थानीय भाषा में बोलकर जानिए सरकारी योजनाओं की पात्रता और दस्तावेज़ों का अर्थ।",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LokSaathi",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a56db",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          <BottomNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
