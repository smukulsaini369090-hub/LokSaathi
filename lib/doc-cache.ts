import { Redis } from "@upstash/redis";
import { createHash } from "crypto";
import type { DocExplanation } from "@/lib/gemini";

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || "";
  const rawToken = process.env.UPSTASH_REDIS_REST_TOKEN || "";
  const url = rawUrl.replace(/^["']|["']$/g, "").trim();
  const token = rawToken.replace(/^["']|["']$/g, "").trim();

  if (!url || !token || !url.startsWith("http")) {
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

export function generateDocCacheKey(
  imageBase64: string,
  mode: string,
  language: string
): string {
  // Use a truncated sample + length + SHA256 of the image base64
  const hash = createHash("sha256")
    .update(`${imageBase64}_${mode}_${language}`)
    .digest("hex");
  return `loksaathi:doc:${mode}:${hash}`;
}

export async function getCachedDocExplanation(
  imageBase64: string,
  mode: string,
  language: string
): Promise<DocExplanation | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const key = generateDocCacheKey(imageBase64, mode, language);
    const cached = await client.get<DocExplanation>(key);
    return cached || null;
  } catch (err) {
    console.warn("Redis get cache error (continuing without cache):", err);
    return null;
  }
}

export async function setCachedDocExplanation(
  imageBase64: string,
  mode: string,
  language: string,
  explanation: DocExplanation
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    const key = generateDocCacheKey(imageBase64, mode, language);
    // Cache for 24 hours (86400 seconds)
    await client.set(key, explanation, { ex: 86400 });
  } catch (err) {
    console.warn("Redis set cache error (ignoring):", err);
  }
}
