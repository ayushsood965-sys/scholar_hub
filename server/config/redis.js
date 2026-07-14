const redis = require('redis');

let redisClient;

const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log('⚠️ REDIS_URL not configured. Redis caching is disabled.');
    return null;
  }

  try {
    let errorLogged = false;

    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            if (!errorLogged) {
              console.warn('⚠️ Redis reconnection attempts exceeded. Redis caching is disabled.');
              errorLogged = true;
            }
            return false; // Stop retrying to avoid console spam
          }
          return Math.min(retries * 2000, 10000); // Backoff retry delay
        }
      }
    });

    redisClient.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        if (!errorLogged) {
          console.warn(`⚠️ Redis server is unreachable at ${process.env.REDIS_URL} - running without caching.`);
          errorLogged = true;
        }
      } else {
        console.error('❌ Redis error:', err);
      }
    });

    await redisClient.connect();
    console.log('✅ Redis connected successfully.');
    return redisClient;
  } catch (err) {
    console.warn('⚠️ Redis connection failed. Running without caching.');
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => redisClient;

const clearCache = async (pattern = 'cache:*') => {
  if (!redisClient || !redisClient.isOpen) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🧹 Cache cleared for pattern ${pattern}: ${keys.length} keys deleted.`);
    }
  } catch (err) {
    console.error('❌ Error clearing Redis cache:', err);
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  clearCache
};
