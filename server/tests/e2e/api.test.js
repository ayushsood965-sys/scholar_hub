const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

test('E2E / API System Test Suite', async (t) => {
  let mongoServer;
  let serverInstance;
  const testPort = 5555;

  t.before(async () => {
    // 1. Start MongoMemoryServer
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // 2. Set environment variables before requiring server.js
    process.env.MONGO_URI = mongoUri;
    process.env.PORT = testPort;
    // Disable Redis connect log/reconnect loop in test
    process.env.REDIS_URL = ''; 

    // 3. Require the server module which boots the Express app
    const serverModule = require('../../server');
    serverInstance = serverModule.server;

    // Wait a brief moment to ensure connections establish
    await new Promise(resolve => setTimeout(resolve, 1500));
  });

  t.after(async () => {
    // Clean up connections and close server
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  await t.test('GET /api/health should return 200 and awake message', async () => {
    const response = await fetch(`http://localhost:${testPort}/api/health`);
    assert.strictEqual(response.status, 200);
    const body = await response.text();
    assert.strictEqual(body, 'Server is awake');
  });

  await t.test('GET /api/departments should return 200 and an array', async () => {
    const response = await fetch(`http://localhost:${testPort}/api/departments`);
    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.ok(Array.isArray(body));
  });

  await t.test('CORS origin check - should succeed with allowed local origin', async () => {
    const response = await fetch(`http://localhost:${testPort}/api/health`, {
      headers: {
        Origin: 'http://localhost:5173'
      }
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    assert.strictEqual(response.headers.get('access-control-allow-credentials'), 'true');
  });

  await t.test('CORS origin check - should fail with unauthorized origin', async () => {
    const response = await fetch(`http://localhost:${testPort}/api/health`, {
      headers: {
        Origin: 'http://malicious-site.com'
      }
    });
    // CORS errors in express cors middleware typically trigger standard request failure or reject
    assert.strictEqual(response.headers.get('access-control-allow-origin'), null);
  });
});
