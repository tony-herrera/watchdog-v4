// lib/valkey.ts
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;
const isDev = process.env.NODE_ENV === 'development';

// ARCHITECT WORKAROUND:
// Private AWS VPC endpoints are unreachable from local GitHub Codespaces.
// We bypass connection pooling locally to keep development turns instant,
// while allowing the cluster task to connect natively in production.
export const valkeyClient = redisUrl && !isDev
  ? new Redis(redisUrl, {
      tls: {
        rejectUnauthorized: false 
      },
      connectTimeout: 2000,
      maxRetriesPerRequest: 1
    })
  : null;

if (isDev) {
  console.log('ℹ️ [Valkey System] Local dev environment detected. Bypassing VPC cache loopback to maximize compilation performance.');
} else if (valkeyClient) {
  valkeyClient.on('connect', () => console.log('⚡ [Valkey Cache] Connection successfully established inside cluster VPC.'));
  valkeyClient.on('error', (err) => console.error('❌ [Valkey Cache] Client connection error:', err));
}