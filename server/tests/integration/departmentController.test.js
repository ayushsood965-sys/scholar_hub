const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Make sure the models are registered in mongoose
const FacultyMaster = require('../../models/FacultyMaster');
const Department = require('../../models/Department');

const {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require('../../controllers/departmentController');

test('Department Controller Integration Tests with MongoMemoryServer', async (t) => {
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
    // Clear collections
    await Department.deleteMany({});
    await FacultyMaster.deleteMany({});
  });

  await t.test('createDepartment - should create a new department successfully', async () => {
    const req = {
      body: {
        name: 'Computer Science & Engineering',
        code: 'CSE'
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

    await createDepartment(req, res);

    assert.strictEqual(responseStatus, 201);
    assert.strictEqual(responseData.success, true);
    assert.strictEqual(responseData.department.name, 'Computer Science & Engineering');
    assert.strictEqual(responseData.department.code, 'CSE');

    // Verify it exists in the database
    const dbDept = await Department.findOne({ code: 'CSE' });
    assert.ok(dbDept);
    assert.strictEqual(dbDept.name, 'Computer Science & Engineering');
  });

  await t.test('createDepartment - should fail if name or code is missing', async () => {
    const req = {
      body: {
        name: 'Computer Science & Engineering'
        // code missing
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

    await createDepartment(req, res);

    assert.strictEqual(responseStatus, 400);
    assert.strictEqual(responseData.message, 'Name and Code are required');
  });

  await t.test('createDepartment - should fail if department name or code already exists', async () => {
    // Seed one department
    await Department.create({ name: 'Physics', code: 'PHY' });

    const req = {
      body: {
        name: 'Physics', // duplicate
        code: 'NEW_PHY'
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

    await createDepartment(req, res);

    assert.strictEqual(responseStatus, 400);
    assert.strictEqual(responseData.message, 'Department Name or Short Code already exists');
  });

  await t.test('getAllDepartments - should return list of seeded departments', async () => {
    await Department.create({ name: 'Chemistry', code: 'CHM' });
    await Department.create({ name: 'Mathematics', code: 'MTH' });

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

    await getAllDepartments(req, res);

    assert.strictEqual(responseStatus, 200);
    assert.strictEqual(responseData.length, 2);
    assert.strictEqual(responseData[0].name, 'Chemistry');
    assert.strictEqual(responseData[1].name, 'Mathematics');
  });

  await t.test('updateDepartment - should update details successfully', async () => {
    const originalDept = await Department.create({ name: 'Biology', code: 'BIO' });

    const req = {
      params: { id: originalDept._id.toString() },
      body: {
        name: 'Biological Sciences',
        code: 'BS'
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

    await updateDepartment(req, res);

    assert.strictEqual(responseStatus, 200);
    assert.strictEqual(responseData.success, true);
    assert.strictEqual(responseData.department.name, 'Biological Sciences');
    assert.strictEqual(responseData.department.code, 'BS');

    // Verify DB update
    const updated = await Department.findById(originalDept._id);
    assert.strictEqual(updated.name, 'Biological Sciences');
    assert.strictEqual(updated.code, 'BS');
  });

  await t.test('deleteDepartment - should remove department', async () => {
    const dept = await Department.create({ name: 'History', code: 'HIS' });

    const req = {
      params: { id: dept._id.toString() }
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

    await deleteDepartment(req, res);

    assert.strictEqual(responseStatus, 200);
    assert.strictEqual(responseData.success, true);

    const checkDb = await Department.findById(dept._id);
    assert.strictEqual(checkDb, null);
  });
});
