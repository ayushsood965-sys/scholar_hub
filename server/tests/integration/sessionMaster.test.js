const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const AcademicSessionMaster = require('../../models/attendance/AcademicSessionMaster');
const {
  getSessions,
  createSession,
  updateSession,
  deleteSession
} = require('../../controllers/attendanceController');

test('AcademicSessionMaster CRUD Integration Tests with MongoMemoryServer', async (t) => {
  let mongoServer;

  t.before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  t.after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  t.beforeEach(async () => {
    await AcademicSessionMaster.deleteMany({});
  });

  await t.test('createSession - should successfully create session', async () => {
    const req = {
      body: {
        sessionName: '2025-26 Odd',
        startDate: new Date('2025-07-01'),
        endDate: new Date('2025-12-31')
      }
    };

    let responseStatus = 200;
    let responseData = null;

    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    await createSession(req, res);

    assert.strictEqual(responseStatus, 201);
    assert.strictEqual(responseData.sessionName, '2025-26 Odd');

    const dbSession = await AcademicSessionMaster.findOne({ sessionName: '2025-26 Odd' });
    assert.ok(dbSession);
    assert.strictEqual(dbSession.isActive, true);
  });

  await t.test('getSessions - should return only active (non-deleted) sessions', async () => {
    await AcademicSessionMaster.create({
      sessionName: '2023-24',
      startDate: new Date('2023-07-01'),
      endDate: new Date('2024-06-30'),
      isActive: true
    });

    await AcademicSessionMaster.create({
      sessionName: '2024-25',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2025-06-30'),
      isActive: false // Soft-deleted
    });

    const req = {};
    let responseStatus = 200;
    let responseData = null;

    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    await getSessions(req, res);

    assert.strictEqual(responseStatus, 200);
    assert.strictEqual(responseData.length, 1);
    assert.strictEqual(responseData[0].sessionName, '2023-24');
  });

  await t.test('updateSession - should update session details', async () => {
    const original = await AcademicSessionMaster.create({
      sessionName: '2025-26 Even',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30')
    });

    const req = {
      params: { id: original._id.toString() },
      body: {
        sessionName: '2025-26 Even Updated',
        startDate: new Date('2026-01-15')
      }
    };

    let responseStatus = 200;
    let responseData = null;

    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    await updateSession(req, res);

    assert.strictEqual(responseStatus, 200);
    assert.strictEqual(responseData.sessionName, '2025-26 Even Updated');

    const updated = await AcademicSessionMaster.findById(original._id);
    assert.strictEqual(updated.sessionName, '2025-26 Even Updated');
  });

  await t.test('deleteSession - should soft delete the session by setting isActive to false', async () => {
    const session = await AcademicSessionMaster.create({
      sessionName: '2026-27',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2027-06-30'),
      isCurrent: false
    });

    const req = {
      params: { id: session._id.toString() }
    };

    let responseStatus = 200;
    let responseData = null;

    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    await deleteSession(req, res);

    assert.strictEqual(responseStatus, 200);
    assert.strictEqual(responseData.message, 'Session deleted successfully');

    const checkDb = await AcademicSessionMaster.findById(session._id);
    assert.strictEqual(checkDb.isActive, false);
  });

  await t.test('deleteSession - should fail to delete the current/active session', async () => {
    const session = await AcademicSessionMaster.create({
      sessionName: '2024-25 Current',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2025-06-30'),
      isCurrent: true
    });

    const req = {
      params: { id: session._id.toString() }
    };

    let responseStatus = 200;
    let responseData = null;

    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      }
    };

    await deleteSession(req, res);

    assert.strictEqual(responseStatus, 400);
    assert.strictEqual(responseData.message, 'Cannot delete the active/current session. Please set another session as current first.');

    const checkDb = await AcademicSessionMaster.findById(session._id);
    assert.strictEqual(checkDb.isActive, true); // Still active
  });
});
