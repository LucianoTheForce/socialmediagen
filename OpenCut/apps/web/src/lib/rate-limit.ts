// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env";

// Create Redis client only if credentials are provided
let redis: Redis | null = null;
let baseRateLimit: Ratelimit | null = null;

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

    baseRateLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
      analytics: true,
      prefix: "rate-limit",
    });

    console.log('✅ Rate limiting configured with Redis');
  } catch (error) {
    console.warn('⚠️  Redis rate limiting failed to initialize:', error);
  }
} else {
  console.warn('⚠️  Redis credentials not provided, rate limiting disabled');
}

export { baseRateLimit };

// Helper function to check if rate limiting is available
export const isRateLimitAvailable = () => !!baseRateLimit;

// Safe rate limit function
export const checkRateLimit = async (identifier: string) => {
  if (!baseRateLimit) {
    return { success: true, limit: 0, remaining: 1000, reset: Date.now() + 60000 };
  }
  
  try {
    return await baseRateLimit.limit(identifier);
  } catch (error) {
    console.warn('⚠️  Rate limit check failed, allowing request:', error);
    return { success: true, limit: 0, remaining: 1000, reset: Date.now() + 60000 };
  }
};
