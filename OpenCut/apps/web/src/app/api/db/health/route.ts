import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import * as schema from "@/lib/db/schema";

export async function GET() {
  const results: any = {
    database: {
      connected: false,
      error: null,
      connectionString: null,
    },
    tables: {},
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT_SET",
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  // Check DATABASE_URL format (hide sensitive parts)
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      results.database.connectionString = {
        protocol: url.protocol,
        host: url.hostname,
        port: url.port || "default",
        database: url.pathname.slice(1),
        hasPassword: !!url.password,
        hasUsername: !!url.username,
        searchParams: Object.fromEntries(url.searchParams),
      };
    } catch (urlError: any) {
      results.database.connectionString = {
        error: "Invalid DATABASE_URL format",
        message: urlError?.message,
      };
    }
  }

  try {
    // Test basic database connection with timeout
    const testQuery = await Promise.race([
      db.execute(sql`SELECT 1 as test`),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database connection timeout after 5 seconds")), 5000)
      ),
    ]);
    
    results.database.connected = true;
    results.database.testQuery = testQuery;

    // Check if tables exist
    const tableChecks = [
      { name: "users", table: schema.users },
    ];

    for (const check of tableChecks) {
      try {
        const count = await db.select({ count: sql`count(*)` }).from(check.table);
        results.tables[check.name] = {
          exists: true,
          count: count[0]?.count || 0,
        };
      } catch (tableError: any) {
        results.tables[check.name] = {
          exists: false,
          error: tableError?.message || "Unknown error",
          code: tableError?.code,
        };
      }
    }

  } catch (error: any) {
    results.database.connected = false;
    results.database.error = error?.message || "Unknown database error";
    results.database.errorCode = error?.code;
    results.database.errorDetail = error?.detail;
    
    // Check if it's an SSL error
    if (error?.message?.includes('SSL') || error?.message?.includes('TLS')) {
      results.database.sslIssue = true;
      results.database.suggestion = "Try adding ?sslmode=require to the DATABASE_URL";
    }
  }

  return NextResponse.json(results);
}

