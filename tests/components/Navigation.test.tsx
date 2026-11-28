import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Header } from "@/components/Navigation";
import { LanguageProvider } from "@/components/LanguageContext";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Global Header Navigation (Zero Citizen Key UX)", () => {
  it("does NOT render any intimidating API Key button or modal trigger in the global header", () => {
    render(
      <LanguageProvider>
        <Header />
      </LanguageProvider>
    );

    expect(screen.queryByRole("button", { name: /API Key/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/API Key|कुंजी सक्रिय|Key Active/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /मदद केंद्र|Help Center/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Select Language|भाषा चुनें/i })).toBeInTheDocument();
  });
});
