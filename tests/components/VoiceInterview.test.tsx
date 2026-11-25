import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("VoiceInterview Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
