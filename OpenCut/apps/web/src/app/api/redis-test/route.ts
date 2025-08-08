import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { env } from '@/env';

export async function GET() {
  try {
    // Test Redis connection
    console.log('🔍 Testing Redis connection...');
    console.log('URL:', env.UPSTASH_REDIS_REST_URL);
    console.log('Token:', env.UPSTASH_REDIS_REST_TOKEN ? 'Present' : 'Missing');

    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Test basic operations
    const testKey = 'redis-test-' + Date.now();
    const testValue = { timestamp: Date.now(), test: 'connection' };

    // Set a test value
    await redis.set(testKey, testValue);
    console.log('✅ Redis SET successful');

    // Get the test value
    const retrieved = await redis.get(testKey);
    console.log('✅ Redis GET successful:', retrieved);

    // Clean up
    await redis.del(testKey);
    console.log('✅ Redis DEL successful');

    return NextResponse.json({
      status: 'success',
      message: 'Redis connection working properly',
      data: {
        url: env.UPSTASH_REDIS_REST_URL,
        hasToken: !!env.UPSTASH_REDIS_REST_TOKEN,
        testResult: retrieved
      }
    });

  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Redis connection failed',
      error: error instanceof Error ? error.message : String(error),
      data: {
        url: env.UPSTASH_REDIS_REST_URL,
        hasToken: !!env.UPSTASH_REDIS_REST_TOKEN,
      }
    }, { status: 500 });
  }
}