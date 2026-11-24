"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, FileText, Bookmark } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Header() {
  const { language } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            लो
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-gray-900 block leading-tight">
              लोकसाथी <span className="text-blue-600 font-semibold text-xs">LokSaathi</span>
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { language } = useLanguage();

  const navItems = [
    {
      href: "/",
      label: language === "hi" ? "होम" : "Home",
      icon: Home,
    },
    {
      href: "/schemes",
      label: language === "hi" ? "योजनाएं" : "Schemes",
      icon: Search,
    },
    {
      href: "/document",
      label: language === "hi" ? "दस्तावेज़" : "Document",
      icon: FileText,
    },
    {
      href: "/saved",
      label: language === "hi" ? "सहेजी गई" : "Saved",
      icon: Bookmark,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg pb-safe">
      <div className="max-w-2xl mx-auto px-2 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? "text-blue-600 font-bold" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[11px] leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
