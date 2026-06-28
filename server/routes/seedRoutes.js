const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AcademicSessionMaster = require('../models/attendance/AcademicSessionMaster');
const DegreeTypeMaster = require('../models/attendance/DegreeTypeMaster');
const DegreeNameMaster = require('../models/attendance/DegreeNameMaster');
const SemesterMaster = require('../models/attendance/SemesterMaster');
const Department = require('../models/Department');
const User = require('../models/User');

const SEED_PASSWORD = 'Ayush1994*';

// Middleware to check password
const verifySeedPassword = (req, res, next) => {
  const { password } = req.body;
  if (password !== SEED_PASSWORD) {
    return res.status(401).json({ message: 'Invalid seeding password' });
  }
  next();
};

// Seed Masters
router.post('/masters', verifySeedPassword, async (req, res) => {
  try {
    // 1. Seed Sessions (2021-2022 to 2027-2028)
    const sessions = [];
    for (let year = 2021; year <= 2027; year++) {
      sessions.push({
        sessionName: `${year}-${year + 1}`,
        startDate: new Date(`${year}-04-01`),
        endDate: new Date(`${year + 1}-03-31`),
        isCurrent: year === 2024 // Assuming 2024-2025 is current
      });
    }
    
    for (const s of sessions) {
      await AcademicSessionMaster.findOneAndUpdate(
        { sessionName: s.sessionName },
        { $setOnInsert: s },
        { upsert: true }
      );
    }

    // 2. Seed Degree Types
    const degreeTypes = [
      { name: 'Undergraduate', code: 'UG' },
      { name: 'Postgraduate', code: 'PG' },
      { name: 'PhD', code: 'PHD' },
      { name: 'Certificate', code: 'CERT' },
      { name: 'Diploma', code: 'DIP' },
      { name: 'Advanced Diploma', code: 'ADVDIP' }
    ];

    for (const dt of degreeTypes) {
      await DegreeTypeMaster.findOneAndUpdate(
        { code: dt.code },
        { $setOnInsert: dt },
        { upsert: true }
      );
    }

    // 3. Seed Semesters (1 to 8)
    for (let i = 1; i <= 8; i++) {
      await SemesterMaster.findOneAndUpdate(
        { number: i },
        { $setOnInsert: { name: `Semester ${i}`, number: i } },
        { upsert: true }
      );
    }

    // 4. Seed Degree Names
    // Get degree type IDs
    const pgType = await DegreeTypeMaster.findOne({ code: 'PG' });
    const ugType = await DegreeTypeMaster.findOne({ code: 'UG' });

    const degreeNames = [];
    if (pgType) {
      degreeNames.push(
        { degreeTypeId: pgType._id, name: 'M.A. English', code: 'MA-ENG' },
        { degreeTypeId: pgType._id, name: 'M.A. Hindi', code: 'MA-HIN' },
        { degreeTypeId: pgType._id, name: 'M.Sc. Physics', code: 'MSC-PHY' },
        { degreeTypeId: pgType._id, name: 'M.Sc. Forensic Science', code: 'MSC-FS' },
        { degreeTypeId: pgType._id, name: 'M.B.A.', code: 'MBA' }
      );
    }
    if (ugType) {
      degreeNames.push(
        { degreeTypeId: ugType._id, name: 'BHM FYICTTM', code: 'BHM-FYICTTM' },
        { degreeTypeId: ugType._id, name: 'B.Tech', code: 'BTECH' }
      );
    }

    for (const dn of degreeNames) {
      await DegreeNameMaster.findOneAndUpdate(
        { code: dn.code },
        { $setOnInsert: dn },
        { upsert: true }
      );
    }

    // 5. Seed default Policies for all Degree Types
    const seededDegreeTypes = await DegreeTypeMaster.find({});
    const AttendancePolicyMaster = require('../models/attendance/AttendancePolicyMaster');
    for (const dt of seededDegreeTypes) {
      await AttendancePolicyMaster.findOneAndUpdate(
        { departmentId: null, programType: dt.code },
        {
          $setOnInsert: {
            departmentId: null,
            programType: dt.code,
            minRequiredPercentage: 75,
            warningThreshold: 80,
            maxCondonationPercentage: 10,
            editLockHours: 48,
            allowHalfDay: true,
            allowMedicalLeave: true,
            allowDutyLeave: true,
            allowCorrection: true,
            correctionWindowDays: 14,
            isActive: true
          }
        },
        { upsert: true }
      );
    }

    res.json({ message: 'Master data seeded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error seeding masters', error: error.message });
  }
});

// Seed Students
router.post('/students', verifySeedPassword, async (req, res) => {
  try {
    // Ensure "Forensic Science" department exists
    let forensicDept = await Department.findOne({ name: /Forensic Science/i });
    if (!forensicDept) {
      forensicDept = new Department({ name: 'Department of Forensic Science', code: 'DFS', isActive: true });
      await forensicDept.save();
    }
    
    // Create another dummy dept for the rest
    let otherDept = await Department.findOne({ code: 'CS' });
    if (!otherDept) {
      otherDept = new Department({ name: 'Department of Computer Science', code: 'CS', isActive: true });
      await otherDept.save();
    }

    const mscForensic = await DegreeNameMaster.findOne({ code: 'MSC-FS' });
    const btech = await DegreeNameMaster.findOne({ code: 'BTECH' });
    
    const sem1 = await SemesterMaster.findOne({ number: 1 });

    const hashedPassword = await bcrypt.hash('password123', 10);
    const studentsToInsert = [];

    // 10 Forensic Science students
    for (let i = 1; i <= 10; i++) {
      studentsToInsert.push({
        name: `Forensic Student ${i}`,
        email: `forensic${i}@student.hpu.ac.in`,
        password: hashedPassword,
        role: 'STUDENT',
        department: forensicDept.name,
        profileCompleted: true,
        profile: {
          enrollmentNumber: `FS-2024-${1000 + i}`,
          degreeTypeId: mscForensic ? mscForensic.degreeTypeId : null,
          degreeNameId: mscForensic ? mscForensic._id : null,
          semesterId: sem1 ? sem1._id : null,
          isPhD: true
        }
      });
    }

    // 40 Other students
    for (let i = 1; i <= 40; i++) {
      studentsToInsert.push({
        name: `Tech Student ${i}`,
        email: `tech${i}@student.hpu.ac.in`,
        password: hashedPassword,
        role: 'STUDENT',
        department: otherDept.name,
        profileCompleted: true,
        profile: {
          enrollmentNumber: `CS-2024-${2000 + i}`,
          degreeTypeId: btech ? btech.degreeTypeId : null,
          degreeNameId: btech ? btech._id : null,
          semesterId: sem1 ? sem1._id : null,
          isPhD: true
        }
      });
    }

    // Insert only if they don't exist
    let insertedCount = 0;
    for (const studentData of studentsToInsert) {
      const existing = await User.findOne({ email: studentData.email });
      if (!existing) {
        await User.create(studentData);
        insertedCount++;
      }
    }

    res.json({ message: `Successfully seeded ${insertedCount} students (skipped existing).` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error seeding students', error: error.message });
  }
});

module.exports = router;
