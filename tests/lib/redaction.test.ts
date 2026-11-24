import { describe, it, expect, vi, beforeEach } from "vitest";

describe("PII Redaction & Compression (lib/redaction.ts)", () => {
  it("findPIIRegions identifies 12-digit Aadhaar numbers with spaces or without", async () => {
    const { findPIIRegions } = await import("@/lib/redaction");
    const text = "मेरा आधार नंबर 1234 5678 9012 है और दूसरा 987654321098 है";
    const regions = findPIIRegions(text);

    expect(regions.length).toBe(2);
    expect(regions[0].type).toBe("aadhaar");
    expect(regions[0].match.replace(/\s/g, "")).toBe("123456789012");
    expect(regions[1].type).toBe("aadhaar");
    expect(regions[1].match).toBe("987654321098");
  });

  it("findPIIRegions identifies PAN numbers", async () => {
    const { findPIIRegions } = await import("@/lib/redaction");
    const text = "PAN Card: ABCDE1234F is registered.";
    const regions = findPIIRegions(text);

    expect(regions.some((r) => r.type === "pan")).toBe(true);
    const panRegion = regions.find((r) => r.type === "pan");
    expect(panRegion?.match).toBe("ABCDE1234F");
  });

  it("findPIIRegions identifies Indian 10-digit mobile numbers", async () => {
    const { findPIIRegions } = await import("@/lib/redaction");
    const text = "Call 9876543210 for help or +91 8765432109";
    const regions = findPIIRegions(text);

    expect(regions.some((r) => r.type === "phone")).toBe(true);
  });

  it("redactAndCompress executes redaction and returns compressed base64 string", async () => {
    // Setup jsdom Canvas mocks
    const mockDrawImage = vi.fn();
    const mockFillRect = vi.fn();
    const mockToDataURL = vi.fn(() => "data:image/jpeg;base64,mockedbase64content");

    vi.stubGlobal("Image", class {
      width = 800;
      height = 600;
      onload: (() => void) | null = null;
      src = "";
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    });

    vi.stubGlobal("document", {
      createElement: (tag: string) => {
        if (tag === "canvas") {
          return {
            width: 800,
            height: 600,
            getContext: () => ({
              drawImage: mockDrawImage,
              fillRect: mockFillRect,
              fillStyle: "",
              filter: "",
            }),
            toDataURL: mockToDataURL,
            toBlob: (cb: (b: Blob) => void) =>
              cb(new Blob(["x".repeat(1024 * 100)], { type: "image/jpeg" })),
          };
        }
        return {};
      },
    });

    // Mock URL.createObjectURL
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:mock-url"),
      revokeObjectURL: vi.fn(),
    });

    const { redactAndCompress } = await import("@/lib/redaction");
    const fakeFile = new File(["fake-image-bytes"], "document.jpg", {
      type: "image/jpeg",
    });

    const result = await redactAndCompress(fakeFile, {
      maxSizeKb: 800,
      masks: [{ x: 0.1, y: 0.2, width: 0.3, height: 0.05 }],
    });

    expect(result).toHaveProperty("base64");
    expect(typeof result.base64).toBe("string");
    expect(result.base64).toContain("mockedbase64content");
    expect(result.finalSizeKb).toBeGreaterThan(0);
    expect(result.redactedCount).toBe(1);
    expect(mockFillRect).toHaveBeenCalled();
  });
});
