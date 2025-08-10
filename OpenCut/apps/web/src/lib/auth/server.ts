import { betterAuth, RateLimit } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/lib/db";
import { keys } from "./keys";
import { Redis } from "@upstash/redis";

const {
  NEXT_PUBLIC_BETTER_AUTH_URL,
  BETTER_AUTH_SECRET,
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} = keys();

// Create Redis client only if credentials are provided
let redis: Redis | null = null;
if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('✅ Redis connection configured successfully');
  } catch (error) {
    console.warn('⚠️  Redis connection failed, rate limiting disabled:', error);
    redis = null;
  }
} else {
  console.warn('⚠️  Redis credentials not provided, rate limiting disabled');
}

// Configure Better Auth with conditional Redis support
const authConfig: any = {
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  secret: BETTER_AUTH_SECRET,
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: GOOGLE_CLIENT_ID || "",
      clientSecret: GOOGLE_CLIENT_SECRET || "",
    },
  },
  baseURL: NEXT_PUBLIC_BETTER_AUTH_URL,
  appName: "OpenCut",
  trustedOrigins: process.env.NODE_ENV === 'production' ? [] : [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://localhost:3000",
    "https://localhost:3001"
  ],
};

// Add rate limiting only if Redis is available
if (redis) {
  authConfig.rateLimit = {
    storage: "secondary-storage",
    customStorage: {
      get: async (key: string) => {
        const value = await redis!.get(key);
        return value as RateLimit | undefined;
      },
      set: async (key: string, value: RateLimit) => {
        await redis!.set(key, value);
      },
    },
  };
}

export const auth = betterAuth(authConfig);

export type Auth = typeof auth;
