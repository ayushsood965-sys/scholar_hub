const mongoose = require('mongoose');
require('dotenv').config();

const Department = require('./models/Department');
const AcademicSessionMaster = require('./models/attendance/AcademicSessionMaster');
const User = require('./models/User');
const AttendancePolicyMaster = require('./models/attendance/AttendancePolicyMaster');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const departmentsCount = await Department.countDocuments();
    const activeSessionsCount = await AcademicSessionMaster.countDocuments({ isCurrent: true });
    const totalStudents = await User.countDocuments({ role: 'STUDENT', isActive: true });
    const totalPolicies = await AttendancePolicyMaster.countDocuments({ isActive: true });
    
    const departments = await Department.find();
    const deptStats = [];
    for (const d of departments) {
      const studentCount = await User.countDocuments({ department: d.name, role: 'STUDENT' });
      deptStats.push({ name: d.name, studentCount, averagePercentage: 100, defaulterCount: 0, activeSession: '2025-26' });
    }
    console.log({ departmentsCount, activeSessionsCount, totalStudents, totalPolicies, departments: deptStats.length });
  } catch (err) {
    console.error("ERROR CAUGHT:");
    console.error(err);
  } finally {
    process.exit(0);
  }
}

test();
