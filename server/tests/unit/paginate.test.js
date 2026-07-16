const test = require('node:test');
const assert = require('node:assert');
const paginate = require('../../utils/paginate');

test('paginate utility tests', async (t) => {
  await t.test('should apply both skip and limit when both are provided', () => {
    let skipCalledWith = null;
    let limitCalledWith = null;

    const mockQuery = {
      skip(val) {
        skipCalledWith = val;
        return this;
      },
      limit(val) {
        limitCalledWith = val;
        return this;
      }
    };

    const result = paginate(mockQuery, { limit: '10', skip: '20' });

    assert.strictEqual(result, mockQuery);
    assert.strictEqual(skipCalledWith, 20);
    assert.strictEqual(limitCalledWith, 10);
  });

  await t.test('should default to 0 and not call skip/limit when limit/skip are not provided or invalid', () => {
    let skipCalled = false;
    let limitCalled = false;

    const mockQuery = {
      skip(val) {
        skipCalled = true;
        return this;
      },
      limit(val) {
        limitCalled = true;
        return this;
      }
    };

    const result = paginate(mockQuery, {});

    assert.strictEqual(result, mockQuery);
    assert.strictEqual(skipCalled, false);
    assert.strictEqual(limitCalled, false);
  });

  await t.test('should handle only limit provided', () => {
    let skipCalled = false;
    let limitCalledWith = null;

    const mockQuery = {
      skip(val) {
        skipCalled = true;
        return this;
      },
      limit(val) {
        limitCalledWith = val;
        return this;
      }
    };

    const result = paginate(mockQuery, { limit: '5' });

    assert.strictEqual(result, mockQuery);
    assert.strictEqual(skipCalled, false);
    assert.strictEqual(limitCalledWith, 5);
  });
});
