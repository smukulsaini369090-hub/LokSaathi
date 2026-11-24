import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

function getRateLimiter(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    (process.env.NODE_ENV === "test" ? "https://mock.upstash.io" : null);
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    (process.env.NODE_ENV === "test" ? "mock-token" : null);

  if (!url || !token) {
    return null;
  }

  const redis = new Redis({
    url,
    token,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 h"),
    analytics: false,
    prefix: "loksaathi:ratelimit",
  });

  return ratelimit;
}

export async function checkRateLimit(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  const limiter = getRateLimiter();

  if (!limiter) {
    return { success: true, remaining: 20 };
  }

  try {
    const { success, remaining } = await limiter.limit(identifier || "anonymous");
    return { success, remaining };
  } catch (error) {
    console.error("Rate limiter error:", error);
    return { success: true, remaining: 1 };
  }
}
