import { NextResponse } from 'next/server';
import { redisClient } from '../../../lib/redis';

export async function GET() {
  try {
    // 1. Ping the cache to ensure the TCP handshake works
    await redisClient.ping();

    // 2. Set a temporary diagnostic key with a 60-second expiration (TTL)
    const timestamp = new Date().toISOString();
    await redisClient.set('test_key', `Valkey is alive at ${timestamp}`, {
      EX: 60,
    });

    // 3. Read the key back to verify read/write capabilities
    const cachedValue = await redisClient.get('test_key');

    return NextResponse.json({
      success: true,
      message: 'Connection verified!',
      data_retrieved: cachedValue,
    });
  } catch (error: any) {
    console.error('Valkey Test Route Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to connect to Valkey state engine.',
      },
      { status: 500 }
    );
  }
}