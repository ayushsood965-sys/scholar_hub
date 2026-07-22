const redis = require('redis');

let redisClient = null;

const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log('⚠️ REDIS_URL not configured. Redis caching is disabled.');
    return null;
  }

  try {
    let errorLogged = false;

    const client = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 2) {
            if (!errorLogged) {
              console.warn('⚠️ Redis unreachable on local port 6379. Gracefully disabling cache middleware.');
              errorLogged = true;
            }
            redisClient = null;
            return false; // Stop retrying to avoid console error spam
          }
          return Math.min(retries * 1000, 3000);
        }
      }
    });

    client.on('error', (err) => {
      if (err.code === 'ECONNREFUSED' || err.name === 'ClientClosedError') {
        if (!errorLogged) {
          console.warn(`⚠️ Redis server is unreachable at ${process.env.REDIS_URL} - running without caching.`);
          errorLogged = true;
        }
        redisClient = null;
      }
    });

    await client.connect();
    redisClient = client;
    console.log('✅ Redis connected successfully.');
    return redisClient;
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('⚠️ Redis connection failed. Running cleanly without caching.');
    }
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => (redisClient && redisClient.isOpen ? redisClient : null);

const clearCache = async (pattern = 'cache:*') => {
  const client = getRedisClient();
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`🧹 Cache cleared for pattern ${pattern}: ${keys.length} keys deleted.`);
    }
  } catch (err) {
    // Graceful silent fallback
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  clearCache
};
