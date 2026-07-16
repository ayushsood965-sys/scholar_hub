const test = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { protect, authorize } = require('../../middleware/authMiddleware');

test('authMiddleware unit tests', async (t) => {
  let originalVerify;
  let originalFindById;

  t.before(() => {
    originalVerify = jwt.verify;
    originalFindById = User.findById;
  });

  t.after(() => {
    jwt.verify = originalVerify;
    User.findById = originalFindById;
  });

  await t.test('protect middleware - no token', () => {
    const req = { cookies: {}, headers: {} };
    let statusCalledWith = null;
    let jsonCalledWith = null;
    let nextCalled = false;

    const res = {
      status(code) {
        statusCalledWith = code;
        return this;
      },
      json(obj) {
        jsonCalledWith = obj;
        return this;
      }
    };

    const next = () => {
      nextCalled = true;
    };

    protect(req, res, next);

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusCalledWith, 401);
    assert.deepStrictEqual(jsonCalledWith, { message: 'Not authorized, no token' });
  });

  await t.test('protect middleware - invalid/expired token', async () => {
    const req = {
      cookies: {},
      headers: { authorization: 'Bearer invalidtoken' }
    };
    let statusCalledWith = null;
    let jsonCalledWith = null;
    let nextCalled = false;

    const res = {
      status(code) {
        statusCalledWith = code;
        return this;
      },
      json(obj) {
        jsonCalledWith = obj;
        return this;
      }
    };

    const next = () => {
      nextCalled = true;
    };

    jwt.verify = () => {
      throw new Error('jwt expired');
    };

    await protect(req, res, next);

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusCalledWith, 401);
    assert.deepStrictEqual(jsonCalledWith, { message: 'Not authorized, token failed' });
  });

  await t.test('protect middleware - user not found in DB', async () => {
    const req = {
      cookies: {},
      headers: { authorization: 'Bearer validtoken' }
    };
    let statusCalledWith = null;
    let jsonCalledWith = null;
    let nextCalled = false;

    const res = {
      status(code) {
        statusCalledWith = code;
        return this;
      },
      json(obj) {
        jsonCalledWith = obj;
        return this;
      }
    };

    const next = () => {
      nextCalled = true;
    };

    jwt.verify = () => ({ id: 'userId123' });
    User.findById = () => ({
      select() {
        return null; // Simulate user not found in DB
      }
    });

    await protect(req, res, next);

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusCalledWith, 401);
    assert.deepStrictEqual(jsonCalledWith, { message: 'Not authorized, user not found' });
  });

  await t.test('protect middleware - success', async () => {
    const req = {
      cookies: {},
      headers: { authorization: 'Bearer validtoken' }
    };
    let statusCalled = false;
    let nextCalled = false;

    const res = {
      status(code) {
        statusCalled = true;
        return this;
      },
      json(obj) {
        return this;
      }
    };

    const next = () => {
      nextCalled = true;
    };

    const dummyUser = { _id: 'userId123', name: 'Ayush Sood', role: 'STUDENT' };
    jwt.verify = () => ({ id: 'userId123' });
    User.findById = () => ({
      select(fields) {
        return dummyUser;
      }
    });

    await protect(req, res, next);

    assert.strictEqual(statusCalled, false);
    assert.strictEqual(nextCalled, true);
    assert.deepStrictEqual(req.user, dummyUser);
  });

  await t.test('authorize middleware - no user', () => {
    const req = {};
    let statusCalledWith = null;
    let jsonCalledWith = null;
    let nextCalled = false;

    const res = {
      status(code) {
        statusCalledWith = code;
        return this;
      },
      json(obj) {
        jsonCalledWith = obj;
        return this;
      }
    };

    const next = () => {
      nextCalled = true;
    };

    const middleware = authorize('ADMIN');
    middleware(req, res, next);

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusCalledWith, 403);
    assert.deepStrictEqual(jsonCalledWith, { message: 'Role is not authorized' });
  });

  await t.test('authorize middleware - role match success', () => {
    const req = { user: { role: 'ADMIN' } };
    let statusCalled = false;
    let nextCalled = false;

    const res = {
      status(code) {
        statusCalled = true;
        return this;
      },
      json(obj) {
        return this;
      }
    };

    const next = () => {
      nextCalled = true;
    };

    const middleware = authorize('ADMIN', 'SUPER_ADMIN');
    middleware(req, res, next);

    assert.strictEqual(statusCalled, false);
    assert.strictEqual(nextCalled, true);
  });

  await t.test('authorize middleware - HOD subrole match', () => {
    const req = { user: { role: 'FACULTY', subRole: 'HOD' } };
    let statusCalled = false;
    let nextCalled = false;

    const res = {
      status(code) {
        statusCalled = true;
        return this;
      },
      json(obj) {
        return this;
      }
    };

    const next = () => {
      nextCalled = true;
    };

    const middleware = authorize('HOD');
    middleware(req, res, next);

    assert.strictEqual(statusCalled, false);
    assert.strictEqual(nextCalled, true);
  });

  await t.test('authorize middleware - forbidden', () => {
    const req = { user: { role: 'STUDENT' } };
    let statusCalledWith = null;
    let jsonCalledWith = null;
    let nextCalled = false;

    const res = {
      status(code) {
        statusCalledWith = code;
        return this;
      },
      json(obj) {
        jsonCalledWith = obj;
        return this;
      }
    };

    const next = () => {
      nextCalled = true;
    };

    const middleware = authorize('ADMIN');
    middleware(req, res, next);

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(statusCalledWith, 403);
    assert.deepStrictEqual(jsonCalledWith, { message: 'Role is not authorized' });
  });
});
