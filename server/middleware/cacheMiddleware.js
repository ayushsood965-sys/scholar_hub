const { getRedisClient, clearCache } = require('../config/redis');

const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    // Bypass caching entirely for auth endpoints (registration, verification, reset password, etc.)
    const url = req.originalUrl || req.url || '';
    if (url.includes('/api/auth') || url.includes('/api/install-logs') || url.includes('/api/email-logs')) {
      return next();
    }

    // If it's a mutating request (POST, PUT, DELETE, PATCH), invalidate cached views upon success
    if (req.method !== 'GET') {
      const originalSend = res.send;
      res.send = function (body) {
        res.send = originalSend;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Clear cache asynchronously to avoid blocking the client response
          clearCache('cache:*').catch(err => {
            console.error('❌ Redis clear cache error on mutation:', err);
          });
        }
        return originalSend.call(this, body);
      };
      return next();
    }

    const redisClient = getRedisClient();

    // If Redis is not connected or initialized, bypass cache
    if (!redisClient || !redisClient.isOpen) {
      return next();
    }

    // Determine cache key namespace based on authenticated user session to prevent cross-user data leaks
    let sessionNamespace = 'anonymous';
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      if (token && token.length > 10) {
        // Use the final 20 chars of JWT signature as a secure unique identifier for user session
        sessionNamespace = token.slice(-20);
      }
    }

    // Generate unique key based on requested endpoint URL and session namespace
    const key = `cache:${sessionNamespace}:${req.originalUrl || req.url}`;

    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        return res.send(cachedData);
      }
    } catch (err) {
      console.error('❌ Redis read cache error:', err);
    }

    // Capture the original res.send to cache response body
    const originalSend = res.send;
    res.send = function (body) {
      res.send = originalSend;

      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const dataToCache = typeof body === 'object' ? JSON.stringify(body) : body;
          redisClient.setEx(key, ttl, dataToCache).catch(err => {
            console.error('❌ Redis set cache error:', err);
          });
        } catch (err) {
          console.error('❌ Error serializing body for cache:', err);
        }
      }
      res.setHeader('X-Cache', 'MISS');
      return originalSend.call(this, body);
    };

    next();
  };
};

module.exports = cacheMiddleware;
