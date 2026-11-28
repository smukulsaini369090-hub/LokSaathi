import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("VoiceInterview Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders mic button as primary CTA", async () => {
    const { VoiceInterview } = await import("@/components/VoiceInterview");
    render(<VoiceInterview language="hi" onProfileComplete={vi.fn()} />);

    const micBtn = screen.getByRole("button", {
      name: /माइक|बोलें|mic|speak/i,
    });
    expect(micBtn).toBeInTheDocument();
  });

  it("displays text input alongside mic button for iOS/no-mic fallback (Review Focus 3)", async () => {
    const { VoiceInterview } = await import("@/components/VoiceInterview");
    render(<VoiceInterview language="hi" onProfileComplete={vi.fn()} />);

    const textInput = screen.getByPlaceholderText(/यहाँ टाइप करें|type here/i);
    expect(textInput).toBeInTheDocument();
  });

  it("displays initial greeting question in Hindi when language is hi", async () => {
    const { VoiceInterview } = await import("@/components/VoiceInterview");
    render(<VoiceInterview language="hi" onProfileComplete={vi.fn()} />);

    expect(screen.getByText(/नमस्ते!.*लोकसाथी/i)).toBeInTheDocument();
  });

  it("includes audio playback Suno button for users who prefer listening", async () => {
    const { VoiceInterview } = await import("@/components/VoiceInterview");
    render(<VoiceInterview language="hi" onProfileComplete={vi.fn()} />);

    const listenBtn = screen.getByRole("button", {
      name: /सुनें|listen/i,
    });
    expect(listenBtn).toBeInTheDocument();
  });

  it("aborts stalled 2G requests within ~4.5s and advances seamlessly via local deterministic engine with zero raw error exposure", async () => {
    vi.useFakeTimers();

    // Hang /api/voice-process until AbortSignal fires
    mockFetch.mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        if (init?.signal) {
          init.signal.addEventListener("abort", () => {
            const abortErr = new Error("Aborted");
            abortErr.name = "AbortError";
            reject(abortErr);
          });
        }
      });
    });

    const { VoiceInterview, VOICE_REQUEST_TIMEOUT_MS } = await import("@/components/VoiceInterview");
    expect(VOICE_REQUEST_TIMEOUT_MS).toBeLessThanOrEqual(4500);

    render(<VoiceInterview language="hi" onProfileComplete={vi.fn()} />);

    const textInput = screen.getByPlaceholderText(/यहाँ टाइप करें|type here/i);
    fireEvent.change(textInput, { target: { value: "मैं उत्तर प्रदेश का किसान हूँ" } });
    fireEvent.submit(textInput.closest("form")!);

    // Advance just past 4500ms (well below the legacy 14000ms timeout)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4600);
    });

    // Must advance profile progress locally (state + occupation captured -> 2 / 6)
    expect(screen.getByText("2 / 6")).toBeInTheDocument();
    // Must ask next missing question calmly (Age) without showing raw error/API key strings
    expect(screen.getByText(/आपकी आयु.*कितने वर्ष है/i)).toBeInTheDocument();
    const pageText = document.body.textContent || "";
    expect(pageText).not.toMatch(/AbortError|401|500|API Key|technical issue|तकनीकी समस्या/i);
  });

  it("handles HTTP 500 from /api/voice-process gracefully via local deterministic intake without exposing status codes", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal Server Error" }),
    });

    const { VoiceInterview } = await import("@/components/VoiceInterview");
    render(<VoiceInterview language="hi" onProfileComplete={vi.fn()} />);

    const textInput = screen.getByPlaceholderText(/यहाँ टाइप करें/i);
    fireEvent.change(textInput, { target: { value: "दिल्ली (NCT)" } });
    await act(async () => {
      fireEvent.submit(textInput.closest("form")!);
    });

    expect(screen.getByText(/राज्य\s*:\s*DELHI/i)).toBeInTheDocument();
    const pageText = document.body.textContent || "";
    expect(pageText).not.toMatch(/HTTP_500|Internal Server Error|API Key|🔑/i);
  });

  it("fails fast on network error and preserves quick-tap guided chips with zero API key prompt", async () => {
    mockFetch.mockRejectedValueOnce(new Error("TypeError: Failed to fetch at Object.<anonymous> (stack)"));

    const { VoiceInterview } = await import("@/components/VoiceInterview");
    render(<VoiceInterview language="en" onProfileComplete={vi.fn()} />);

    const textInput = screen.getByPlaceholderText(/Type here/i);
    fireEvent.change(textInput, { target: { value: "I am 35 years old from Delhi" } });
    await act(async () => {
      fireEvent.submit(textInput.closest("form")!);
    });

    // Deterministic fallback extracted Delhi + Age 35 -> 2 / 6
    expect(screen.getByText("2 / 6")).toBeInTheDocument();
    const pageText = document.body.textContent || "";
    expect(pageText).not.toMatch(/Failed to fetch|TypeError|stack|API Key|🔑/i);
  });
});
