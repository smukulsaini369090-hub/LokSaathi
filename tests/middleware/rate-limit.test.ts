import { describe, it, expect, vi, beforeEach } from "vitest";

const mockLimit = vi.fn();

vi.mock("@upstash/redis", () => {
  return {
    Redis: class MockRedis {
      pipeline() {
        return {
          exec: async () => [1, 1],
        };
      }
    },
  };
});

vi.mock("@upstash/ratelimit", () => {
  return {
    Ratelimit: Object.assign(
      class MockRatelimit {
        limit = mockLimit;
      },
      {
        slidingWindow: vi.fn(),
      }
    ),
  };
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success:true on first call", async () => {
    mockLimit.mockResolvedValueOnce({ success: true, remaining: 19 });
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = await checkRateLimit("1.2.3.4");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(19);
  });

  it("returns success:false after limit exhausted", async () => {
    mockLimit.mockResolvedValueOnce({ success: false, remaining: 0 });
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = await checkRateLimit("1.2.3.4");
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("handles missing Redis env gracefully without crashing", async () => {
    mockLimit.mockResolvedValueOnce({ success: true, remaining: 20 });
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = await checkRateLimit("");
    expect(result).toHaveProperty("success");
    expect(result.success).toBe(true);
  });
});
