require('dotenv').config();
const mongoose = require('mongoose');

const DegreeTypeMaster = require('../models/attendance/DegreeTypeMaster');
const User = require('../models/User');
const StudentSemesterMapping = require('../models/attendance/StudentSemesterMapping');
const AttendanceRecord = require('../models/attendance/AttendanceRecord');
const AttendanceCorrection = require('../models/attendance/AttendanceCorrection');
const LeaveRequest = require('../models/LeaveRequest');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/scholar_hub';

async function migratePhdSemesters() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Identify PhD degree type
    const phdDegreeTypes = await DegreeTypeMaster.find({
      $or: [
        { code: { $regex: /^PHD$/i } },
        { name: { $regex: /ph\.?d/i } }
      ]
    });
    const phdDegreeTypeIds = phdDegreeTypes.map(d => d._id);
    console.log(`Found ${phdDegreeTypeIds.length} PhD DegreeTypeMaster record(s):`, phdDegreeTypes.map(d => `${d.name} (${d.code})`));

    // 2. Identify all PhD students
    const phdStudents = await User.find({
      role: 'STUDENT',
      $or: [
        { 'profile.degreeTypeId': { $in: phdDegreeTypeIds } },
        { 'profile.isPhD': true },
        { 'profile.phdMode': { $exists: true, $ne: '' } }
      ]
    });
    const phdStudentIds = phdStudents.map(s => s._id);
    console.log(`Found ${phdStudents.length} PhD Student User record(s).`);

    // 3. Clean up User profiles for PhD students
    const userUpdateRes = await User.updateMany(
      { _id: { $in: phdStudentIds } },
      {
        $unset: {
          'profile.semesterId': '',
          'profile.currentSemester': '',
          'profile.semester': ''
        },
        $set: {
          'profile.isPhD': true
        }
      }
    );
    console.log(`✓ Updated User profiles: matched ${userUpdateRes.matchedCount}, modified ${userUpdateRes.modifiedCount}`);

    // 4. Clean up StudentSemesterMapping for PhD students
    const mappingFilter = {
      $or: [
        { degreeTypeId: { $in: phdDegreeTypeIds } },
        { studentId: { $in: phdStudentIds } }
      ]
    };
    const mappingUpdateRes = await StudentSemesterMapping.updateMany(
      mappingFilter,
      {
        $set: {
          semesterId: null,
          mappedSubjects: [
            {
              timetableSlotId: null,
              subjectCode: 'DAILY',
              subjectName: 'Ph.D. Research & Daily Attendance'
            }
          ]
        }
      }
    );
    console.log(`✓ Updated StudentSemesterMapping records: matched ${mappingUpdateRes.matchedCount}, modified ${mappingUpdateRes.modifiedCount}`);

    // 5. Clean up AttendanceRecord for PhD students
    const attendanceFilter = {
      $or: [
        { degreeTypeId: { $in: phdDegreeTypeIds } },
        { studentId: { $in: phdStudentIds } },
        { courseCode: 'DAILY' }
      ]
    };
    const attendanceUpdateRes = await AttendanceRecord.updateMany(
      attendanceFilter,
      {
        $set: {
          semesterId: null,
          timetableId: null
        }
      }
    );
    console.log(`✓ Updated AttendanceRecord records: matched ${attendanceUpdateRes.matchedCount}, modified ${attendanceUpdateRes.modifiedCount}`);

    // 6. Clean up AttendanceCorrection for PhD students
    const correctionFilter = {
      $or: [
        { degreeTypeId: { $in: phdDegreeTypeIds } },
        { studentId: { $in: phdStudentIds } }
      ]
    };
    const correctionUpdateRes = await AttendanceCorrection.updateMany(
      correctionFilter,
      {
        $set: {
          semesterId: null
        }
      }
    );
    console.log(`✓ Updated AttendanceCorrection records: matched ${correctionUpdateRes.matchedCount}, modified ${correctionUpdateRes.modifiedCount}`);

    // 7. Clean up LeaveRequest for PhD students (if any semesterId field exists)
    const leaveFilter = {
      studentId: { $in: phdStudentIds }
    };
    const leaveUpdateRes = await LeaveRequest.updateMany(
      leaveFilter,
      {
        $set: {
          semesterId: null
        }
      }
    );
    console.log(`✓ Updated LeaveRequest records: matched ${leaveUpdateRes.matchedCount}, modified ${leaveUpdateRes.modifiedCount}`);

    console.log('\n=========================================');
    console.log('✅ PhD Semester Removal Migration Completed Successfully!');
    console.log('=========================================');
  } catch (err) {
    console.error('Migration failed with error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

migratePhdSemesters();
