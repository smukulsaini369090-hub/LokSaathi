import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { LanguageProvider } from "@/components/LanguageContext";
import { ONBOARDING_STORAGE_KEY } from "@/components/OnboardingGuide";

describe("PWAInstallBanner Component", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    // Default matchMedia
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  const renderComponent = () => {
    return render(
      <LanguageProvider>
        <PWAInstallBanner />
      </LanguageProvider>
    );
  };

  it("stays hidden while onboarding has not been completed on first visit", () => {
    renderComponent();

    // Fire beforeinstallprompt
    const event = new Event("beforeinstallprompt") as any;
    event.prompt = vi.fn();
    event.userChoice = Promise.resolve({ outcome: "accepted" });

    act(() => {
      window.dispatchEvent(event);
    });

    // Should NOT be visible because onboarding is pending
    expect(screen.queryByRole("region", { name: /app installation/i }) || screen.queryByText(/लोकसाथी ऐप इंस्टॉल करें/i)).not.toBeInTheDocument();
  });

  it("shows banner when beforeinstallprompt fires and onboarding is already completed", () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    renderComponent();

    const event = new Event("beforeinstallprompt") as any;
    event.prompt = vi.fn();
    event.userChoice = Promise.resolve({ outcome: "accepted" });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(screen.getByText(/लोकसाथी ऐप इंस्टॉल करें|Install LokSaathi App/i)).toBeInTheDocument();
  });

  it("becomes visible when loksaathi_onboarding_completed event is fired after prompt was captured", () => {
    renderComponent();

    const event = new Event("beforeinstallprompt") as any;
    event.prompt = vi.fn();
    event.userChoice = Promise.resolve({ outcome: "accepted" });

    act(() => {
      window.dispatchEvent(event);
    });

    // Hidden initially
    expect(screen.queryByText(/लोकसाथी ऐप इंस्टॉल करें|Install LokSaathi App/i)).not.toBeInTheDocument();

    // Now user completes onboarding
    act(() => {
      window.dispatchEvent(new Event("loksaathi_onboarding_completed"));
    });

    // Banner should now appear
    expect(screen.getByText(/लोकसाथी ऐप इंस्टॉल करें|Install LokSaathi App/i)).toBeInTheDocument();
  });

  it("hides when loksaathi_open_onboarding is fired to avoid screen collision", () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    renderComponent();

    const event = new Event("beforeinstallprompt") as any;
    event.prompt = vi.fn();
    event.userChoice = Promise.resolve({ outcome: "accepted" });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(screen.getByText(/लोकसाथी ऐप इंस्टॉल करें|Install LokSaathi App/i)).toBeInTheDocument();

    // User re-opens onboarding
    act(() => {
      window.dispatchEvent(new Event("loksaathi_open_onboarding"));
    });

    expect(screen.queryByText(/लोकसाथी ऐप इंस्टॉल करें|Install LokSaathi App/i)).not.toBeInTheDocument();
  });

  it("dismisses banner and sets sessionStorage when Later is clicked", () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    renderComponent();

    const event = new Event("beforeinstallprompt") as any;
    event.prompt = vi.fn();
    event.userChoice = Promise.resolve({ outcome: "accepted" });

    act(() => {
      window.dispatchEvent(event);
    });

    const dismissBtn = screen.getByRole("button", { name: /बाद में|Later/i });
    fireEvent.click(dismissBtn);

    expect(sessionStorage.getItem("loksaathi_install_dismissed")).toBe("true");
    expect(screen.queryByText(/लोकसाथी ऐप इंस्टॉल करें|Install LokSaathi App/i)).not.toBeInTheDocument();
  });
});
