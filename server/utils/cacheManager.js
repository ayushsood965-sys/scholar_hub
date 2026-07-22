// High-Performance In-Memory & Redis Cache Manager with Pattern Invalidation

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.ttlMap = new Map();
    // Periodically clean up expired keys every 30 seconds
    setInterval(() => this.cleanupExpired(), 30000);
  }

  cleanupExpired() {
    const now = Date.now();
    for (const [key, expireTime] of this.ttlMap.entries()) {
      if (now > expireTime) {
        this.memoryCache.delete(key);
        this.ttlMap.delete(key);
      }
    }
  }

  get(key) {
    if (!key) return null;
    const expireTime = this.ttlMap.get(key);
    if (expireTime && Date.now() > expireTime) {
      this.memoryCache.delete(key);
      this.ttlMap.delete(key);
      return null;
    }
    const val = this.memoryCache.get(key);
    return val ? JSON.parse(val) : null;
  }

  set(key, value, ttlSeconds = 120) {
    if (!key) return;
    try {
      const stringified = JSON.stringify(value);
      this.memoryCache.set(key, stringified);
      this.ttlMap.set(key, Date.now() + (ttlSeconds * 1000));
    } catch (e) {
      console.error('Cache set error:', e);
    }
  }

  del(key) {
    if (!key) return;
    this.memoryCache.delete(key);
    this.ttlMap.delete(key);
  }

  // Purge all keys starting with a prefix (e.g., 'users:', 'dept:')
  invalidatePattern(prefix) {
    if (!prefix) return;
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
        this.ttlMap.delete(key);
      }
    }
  }

  clear() {
    this.memoryCache.clear();
    this.ttlMap.clear();
  }
}

const cacheManager = new CacheManager();
module.exports = cacheManager;
