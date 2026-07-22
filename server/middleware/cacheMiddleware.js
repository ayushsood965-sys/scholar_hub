const { getRedisClient, clearCache } = require('../config/redis');

const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    // Bypass caching entirely for auth endpoints and utility logs
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
          clearCache('cache:*').catch(() => {});
        }
        return originalSend.call(this, body);
      };
      return next();
    }

    const redisClient = getRedisClient();

    // If Redis is not connected, open, or available, bypass caching transparently
    if (!redisClient) {
      return next();
    }

    // Determine cache key namespace based on authenticated user session
    let sessionNamespace = 'anonymous';
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      if (token && token.length > 10) {
        sessionNamespace = token.slice(-20);
      }
    }

    const key = `cache:${sessionNamespace}:${req.originalUrl || req.url}`;

    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        return res.send(cachedData);
      }
    } catch (err) {
      // Graceful fallback to fresh database call if Redis read fails
    }

    // Capture original res.send to cache response body asynchronously
    const originalSend = res.send;
    res.send = function (body) {
      res.send = originalSend;

      const activeClient = getRedisClient();
      if (activeClient && res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const dataToCache = typeof body === 'object' ? JSON.stringify(body) : body;
          activeClient.setEx(key, ttl, dataToCache).catch(() => {});
        } catch (err) {
          // Ignore serialization error
        }
      }
      res.setHeader('X-Cache', 'MISS');
      return originalSend.call(this, body);
    };

    next();
  };
};

module.exports = cacheMiddleware;
