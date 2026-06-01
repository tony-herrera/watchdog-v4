import { createClient } from 'redis';

// 1. Provide a dummy fallback specifically so the GitHub Actions build doesn't crash
const redisUrl = process.env.REDIS_URL || 'rediss://dummy-build-url.amazonaws.com:6379';

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    tls: true, 
    rejectUnauthorized: false
  }
});

// Suppress noisy terminal errors during the build phase
redisClient.on('error', (err) => {
    if (process.env.REDIS_URL) console.error('Valkey Client Error:', err.message);
});

// 2. ONLY attempt to open the TCP connection if a real environment variable exists.
// This prevents the GitHub Actions container from trying to dial a fake database.
if (process.env.REDIS_URL && !redisClient.isOpen) {
  redisClient.connect().then(() => {
    console.log('⚡ Successfully connected to AWS Valkey State Engine');
  }).catch(console.error);
}