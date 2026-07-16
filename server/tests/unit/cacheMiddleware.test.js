const test = require('node:test');
const assert = require('node:assert');

// Require the redis config first and mock its exports before importing cacheMiddleware
const redisConfig = require('../../config/redis');

let mockRedisClient = null;
let clearCachePattern = null;

redisConfig.getRedisClient = () => mockRedisClient;
redisConfig.clearCache = async (pattern) => {
  clearCachePattern = pattern;
};

const cacheMiddleware = require('../../middleware/cacheMiddleware');

test('cacheMiddleware unit tests', async (t) => {

  t.beforeEach(() => {
    mockRedisClient = null;
    clearCachePattern = null;
  });

  await t.test('POST/PUT/DELETE should bypass read cache but trigger clearCache on success status code', async () => {
    const req = { method: 'POST' };
    let sendCalledWith = null;
    let nextCalled = false;

    const res = {
      statusCode: 200,
      send(body) {
        sendCalledWith = body;
        return this;
      }
    };

    const next = () => {
      nextCalled = true;
    };

    const middleware = cacheMiddleware();
    await middleware(req, res, next);

    assert.strictEqual(nextCalled, true);

    // Now call res.send to see if it clears the cache
    res.send({ success: true });
    assert.strictEqual(sendCalledWith.success, true);
    
    // Wait for async clearCache call
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.strictEqual(clearCachePattern, 'cache:*');
  });

  await t.test('GET - should bypass cache if Redis is disabled or closed', async () => {
    mockRedisClient = { isOpen: false }; // Redis not open
    const req = { method: 'GET', url: '/api/test' };
    let nextCalled = false;

    const middleware = cacheMiddleware();
    await middleware(req, null, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
  });

  await t.test('GET - should return cached data on cache HIT', async () => {
    let mockGetCalledWith = null;
    let headersSet = {};

    mockRedisClient = {
      isOpen: true,
      async get(key) {
        mockGetCalledWith = key;
        return JSON.stringify({ data: 'cached' });
      }
    };

    const req = {
      method: 'GET',
      url: '/api/test',
      headers: {}
    };

    let sendCalledWith = null;
    const res = {
      setHeader(name, val) {
        headersSet[name] = val;
      },
      send(body) {
        sendCalledWith = body;
        return this;
      }
    };

    let nextCalled = false;
    const middleware = cacheMiddleware();
    await middleware(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, false); // Bypass route execution on cache hit
    assert.strictEqual(mockGetCalledWith, 'cache:anonymous:/api/test');
    assert.strictEqual(headersSet['X-Cache'], 'HIT');
    assert.strictEqual(headersSet['Content-Type'], 'application/json');
    assert.deepStrictEqual(JSON.parse(sendCalledWith), { data: 'cached' });
  });

  await t.test('GET - should call next and save cache on cache MISS', async () => {
    let mockGetCalledWith = null;
    let mockSetCalledWith = null;
    let mockSetTtl = null;
    let headersSet = {};

    mockRedisClient = {
      isOpen: true,
      async get(key) {
        mockGetCalledWith = key;
        return null; // Cache miss
      },
      async setEx(key, ttl, value) {
        mockSetCalledWith = key;
        mockSetTtl = ttl;
      }
    };

    const req = {
      method: 'GET',
      url: '/api/test',
      headers: {}
    };

    let sendCalledWith = null;
    const res = {
      statusCode: 200,
      setHeader(name, val) {
        headersSet[name] = val;
      },
      send(body) {
        sendCalledWith = body;
        return this;
      }
    };

    let nextCalled = false;
    const middleware = cacheMiddleware(120);
    await middleware(req, res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true); // Continues to route execution

    // Simulate route completing and calling send
    res.send({ data: 'fresh' });

    assert.strictEqual(headersSet['X-Cache'], 'MISS');
    assert.deepStrictEqual(sendCalledWith, { data: 'fresh' });

    // Wait for async setEx call
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.strictEqual(mockSetCalledWith, 'cache:anonymous:/api/test');
    assert.strictEqual(mockSetTtl, 120);
  });
});
