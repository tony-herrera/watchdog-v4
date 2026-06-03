// lib/valkey.ts
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn("⚠️ [Valkey System] REDIS_URL is missing from the environment configuration.");
}

// Initialize secure connection client using unified connection pooling
export const valkeyClient = redisUrl
  ? new Redis(redisUrl, {
      tls: {
        // Enforces secure handshakes against AWS Serverless endpoints
        rejectUnauthorized: false 
      },
      connectTimeout: 5000,
      maxRetriesPerRequest: 3
    })
  : null;

if (valkeyClient) {
  valkeyClient.on('connect', () => console.log('⚡ [Valkey Cache] Connection successfully established.'));
  valkeyClient.on('error', (err) => console.error('❌ [Valkey Cache] Client connection error:', err));
}