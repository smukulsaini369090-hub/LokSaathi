import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

vi.mock("@/lib/redaction", () => ({
  redactAndCompress: vi.fn(async () => ({
    base64: "data:image/jpeg;base64,mockedbase64data",
    redactedCount: 1,
    finalSizeKb: 150,
  })),
}));

describe("DocumentScanner Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders camera capture button as primary CTA", async () => {
    const { DocumentScanner } = await import("@/components/DocumentScanner");
    render(<DocumentScanner language="hi" onResult={vi.fn()} />);

    const cameraBtn = screen.getByRole("button", {
      name: /कैमरा|फोटो|camera|photo/i,
    });
    expect(cameraBtn).toBeInTheDocument();
  });

  it("renders file upload fallback option with image/* accept attribute", async () => {
    const { DocumentScanner } = await import("@/components/DocumentScanner");
    render(<DocumentScanner language="hi" onResult={vi.fn()} />);

    const inputs = document.querySelectorAll("input[type=file]");
    expect(inputs.length).toBeGreaterThan(0);
    const hasImageAccept = Array.from(inputs).some((i) =>
      i.getAttribute("accept")?.includes("image/")
    );
    expect(hasImageAccept).toBe(true);
  });

  it("displays DPDP Act privacy reassurance text clearly", async () => {
    const { DocumentScanner } = await import("@/components/DocumentScanner");
    render(<DocumentScanner language="hi" onResult={vi.fn()} />);

    expect(
      screen.getByText(/सुरक्षित|सेव नहीं|store नहीं|never store/i)
    ).toBeInTheDocument();
  });
});
