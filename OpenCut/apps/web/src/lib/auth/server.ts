import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { env } from "@/env";

const BETTER_AUTH_SECRET = env.BETTER_AUTH_SECRET;
const BETTER_AUTH_URL = env.NEXT_PUBLIC_BETTER_AUTH_URL;
const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,
  user: {
    deleteUser: {
      enabled: true,
    },
    additionalFields: {
      id: {
        type: "string",
        defaultValue: () => crypto.randomUUID(),
      },
    },
  },
  socialProviders: {
    google: {
      clientId: GOOGLE_CLIENT_ID || "",
      clientSecret: GOOGLE_CLIENT_SECRET || "",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    "http://localhost:3001",
    "https://socialmedia-ih1gr7nz8-lucianos-projects-b0bcbedf.vercel.app",
    BETTER_AUTH_URL,
  ].filter(Boolean),
});
