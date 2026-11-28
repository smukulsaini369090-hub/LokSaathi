"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "hi" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "hi",
  setLanguage: () => {},
  toggleLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("hi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("loksaathi_lang") as Language;
      if (saved === "hi" || saved === "en") {
        setLanguageState(saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("loksaathi_lang", lang);
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === "hi" ? "en" : "hi");
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
