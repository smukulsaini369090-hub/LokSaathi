import { describe, it, expect } from "vitest";
import { generateDocCacheKey } from "@/lib/doc-cache";

describe("Document Cache Isolation (lib/doc-cache.ts)", () => {
  it("generates different cache keys for same image when mode differs", () => {
    const fakeImage = "data:image/jpeg;base64,exactsameimagebytes12345";
    const explainKey = generateDocCacheKey(fakeImage, "explain", "hi");
    const formGuideKey = generateDocCacheKey(fakeImage, "form_guide", "hi");

    expect(explainKey).toContain("loksaathi:doc:explain:");
    expect(formGuideKey).toContain("loksaathi:doc:form_guide:");
    expect(explainKey).not.toBe(formGuideKey);
  });

  it("generates different cache keys when language differs", () => {
    const fakeImage = "data:image/jpeg;base64,exactsameimagebytes12345";
    const hiKey = generateDocCacheKey(fakeImage, "explain", "hi");
    const enKey = generateDocCacheKey(fakeImage, "explain", "en");

    expect(hiKey).not.toBe(enKey);
  });
});
