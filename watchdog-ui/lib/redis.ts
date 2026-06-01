import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('Missing REDIS_URL environment variable.');
}

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    tls: true, 
    rejectUnauthorized: false
  }
});

redisClient.on('error', (err) => console.error('Valkey Client Error:', err));

if (!redisClient.isOpen) {
  redisClient.connect().then(() => {
    console.log('⚡ Successfully connected to AWS Valkey State Engine');
  });
}