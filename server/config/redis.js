const redis = require('redis');

let redisClient;

const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log('⚠️ REDIS_URL not configured. Redis caching is disabled.');
    return null;
  }

  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err);
    });

    await redisClient.connect();
    console.log('✅ Redis connected successfully.');
    return redisClient;
  } catch (err) {
    console.error('❌ Redis connection failed:', err);
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => redisClient;

const clearCache = async (pattern = 'cache:*') => {
  if (!redisClient || !redisClient.isOpen) return;
  try {
    // Note: in high-production keys is blocked, but fine for this scope.
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
