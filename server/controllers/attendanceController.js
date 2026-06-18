const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const LeaveRequest = require('../models/LeaveRequest');

// Attendance Sub-Models
const AttendancePolicyMaster = require('../models/attendance/AttendancePolicyMaster');
const LeaveTypeMaster = require('../models/attendance/LeaveTypeMaster');
const AcademicSessionMaster = require('../models/attendance/AcademicSessionMaster');
const TimetableMaster = require('../models/attendance/TimetableMaster');
const HolidayCalendar = require('../models/attendance/HolidayCalendar');
const AttendanceCorrection = require('../models/attendance/AttendanceCorrection');
const AttendanceRecord = require('../models/attendance/AttendanceRecord');

// Calculator Service
const { calculateStudentStats } = require('../utils/attendanceCalculator');

// Helper to send a notification
const createSystemNotification = async (recipientId, title, message, type = 'INFO', link = '') => {
  try {
    await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      link
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// ==========================================
// 1. POLICY CONTROLLERS (Configurable Rules)
// ==========================================
exports.getPolicies = async (req, res) => {
  try {
    // If HOD, return department's policies. Otherwise allow filtering
    const query = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN'
      ? {}
      : { departmentId: req.user.departmentId };

    const policies = await AttendancePolicyMaster.find({ ...query, isActive: true })
      .populate('departmentId', 'name code');
    res.status(200).json(policies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policies', error: error.message });
  }
};

exports.createOrUpdatePolicy = async (req, res) => {
  try {
    const { 
      programType, 
      minRequiredPercentage, 
      warningThreshold, 
      maxCondonationPercentage, 
      editLockHours,
      allowHalfDay,
      allowMedicalLeave,
      allowDutyLeave,
      allowCorrection,
      correctionWindowDays
    } = req.body;

    const departmentId = req.user.departmentId || null; // Super Admin can set global policies (deptId = null)

    // Check if a policy already exists for this dept + programType
    let policy = await AttendancePolicyMaster.findOne({ departmentId, programType });

    if (policy) {
      // Update
      policy.minRequiredPercentage = minRequiredPercentage ?? policy.minRequiredPercentage;
      policy.warningThreshold = warningThreshold ?? policy.warningThreshold;
      policy.maxCondonationPercentage = maxCondonationPercentage ?? policy.maxCondonationPercentage;
      policy.editLockHours = editLockHours ?? policy.editLockHours;
      policy.allowHalfDay = allowHalfDay !== undefined ? allowHalfDay : policy.allowHalfDay;
      policy.allowMedicalLeave = allowMedicalLeave !== undefined ? allowMedicalLeave : policy.allowMedicalLeave;
      policy.allowDutyLeave = allowDutyLeave !== undefined ? allowDutyLeave : policy.allowDutyLeave;
      policy.allowCorrection = allowCorrection !== undefined ? allowCorrection : policy.allowCorrection;
      policy.correctionWindowDays = correctionWindowDays ?? policy.correctionWindowDays;
      policy.isActive = true;
      await policy.save();
    } else {
      // Create
      policy = await AttendancePolicyMaster.create({
        departmentId,
        programType,
        minRequiredPercentage,
        warningThreshold,
        maxCondonationPercentage,
        editLockHours,
        allowHalfDay,
        allowMedicalLeave,
        allowDutyLeave,
        allowCorrection,
        correctionWindowDays
      });
    }

    res.status(200).json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Error configuring policy rules', error: error.message });
  }
};

exports.deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    // Directive C: Soft deletion only
    const policy = await AttendancePolicyMaster.findByIdAndUpdate(
      id, 
      { isActive: false }, 
      { new: true }
    );
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    res.status(200).json({ message: 'Policy deactivated successfully', policy });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating policy', error: error.message });
  }
};

// ==========================================
// 2. LEAVE TYPES CONTROLLERS
// ==========================================
exports.getLeaveTypes = async (req, res) => {
  try {
    const deptId = req.user.departmentId;
    const leaveTypes = await LeaveTypeMaster.find({
      $or: [
        { departmentId: deptId },
        { departmentId: null }
      ],
      isActive: true
    });
    res.status(200).json(leaveTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving leave types', error: error.message });
  }
};

exports.createLeaveType = async (req, res) => {
  try {
    const { leaveName, leaveCode, maxDaysPerYear, requiresDocument, countsAsPresent } = req.body;
    const departmentId = req.user.role === 'SUPER_ADMIN' ? null : req.user.departmentId;

    const leaveType = await LeaveTypeMaster.create({
      departmentId,
      leaveName,
      leaveCode: leaveCode.toUpperCase(),
      maxDaysPerYear,
      requiresDocument,
      countsAsPresent
    });

    res.status(201).json(leaveType);
  } catch (error) {
    res.status(500).json({ message: 'Error creating leave type', error: error.message });
  }
};

exports.deleteLeaveType = async (req, res) => {
  try {
    const { id } = req.params;
    // Directive C: Soft deletion only
    const leaveType = await LeaveTypeMaster.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    res.status(200).json({ message: 'Leave type soft-deleted successfully', leaveType });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating leave type', error: error.message });
  }
};

// ==========================================
// 3. ACADEMIC SESSION CONTROLLERS
// ==========================================
exports.getSessions = async (req, res) => {
  try {
    const query = req.user.role === 'SUPER_ADMIN' ? {} : { departmentId: req.user.departmentId };
    const sessions = await AcademicSessionMaster.find(query).sort({ startDate: -1 });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching academic semesters', error: error.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    const { sessionName, startDate, endDate } = req.body;
    const departmentId = req.user.role === 'SUPER_ADMIN' ? null : req.user.departmentId;

    const session = await AcademicSessionMaster.create({
      departmentId,
      sessionName,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Error creating session', error: error.message });
  }
};

exports.setCurrentSession = async (req, res) => {
  try {
    const { id } = req.params;
    const deptId = req.user.departmentId || null;

    // Reset others
    await AcademicSessionMaster.updateMany({ departmentId: deptId }, { isCurrent: false });

    const session = await AcademicSessionMaster.findByIdAndUpdate(id, { isCurrent: true }, { new: true });
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Error activating academic session', error: error.message });
  }
};

// ==========================================
// 4. TIMETABLE CONTROLLERS
// ==========================================
exports.getTimetables = async (req, res) => {
  try {
    const query = req.user.role === 'FACULTY' 
      ? { facultyId: req.user._id, isActive: true }
      : { departmentId: req.user.departmentId, isActive: true };

    const slots = await TimetableMaster.find(query)
      .populate('facultyId', 'name username profile');
    res.status(200).json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching timetable records', error: error.message });
  }
};

exports.createTimetableSlot = async (req, res) => {
  try {
    const { courseCode, courseName, facultyId, dayOfWeek, startTime, endTime } = req.body;
    const departmentId = req.user.departmentId;

    const slot = await TimetableMaster.create({
      departmentId,
      courseCode,
      courseName,
      facultyId,
      dayOfWeek,
      startTime,
      endTime
    });
    res.status(201).json(slot);
  } catch (error) {
    res.status(500).json({ message: 'Error creating timetable slot', error: error.message });
  }
};

exports.deleteTimetableSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await TimetableMaster.findByIdAndUpdate(id, { isActive: false }, { new: true });
    res.status(200).json({ message: 'Slot deactivated', slot });
  } catch (error) {
    res.status(500).json({ message: 'Error deactivating slot', error: error.message });
  }
};

// ==========================================
// 5. BULK ATTENDANCE MARKING (Directive E)
// ==========================================
exports.markAttendanceBulk = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { date, records, timetableId, courseCode, courseName } = req.body;
    const facultyId = req.user._id;
    const departmentId = req.user.departmentId;

    if (!records || records.length === 0) {
      return res.status(400).json({ message: 'No attendance records provided' });
    }

    // Resolve current academic session
    const currentSession = await AcademicSessionMaster.findOne({
      $or: [{ departmentId }, { departmentId: null }],
      isCurrent: true
    });

    if (!currentSession) {
      return res.status(404).json({ message: 'No active academic session found for this department' });
    }

    const operations = records.map(rec => ({
      updateOne: {
        filter: {
          studentId: rec.studentId,
          date: new Date(date),
          courseCode: courseCode || 'DAILY',
          timetableId: timetableId || null
        },
        update: {
          $set: {
            studentId: rec.studentId,
            sessionId: currentSession._id,
            timetableId: timetableId || null,
            courseCode: courseCode || 'DAILY',
            courseName: courseName || 'Daily Check-In',
            facultyId,
            departmentId,
            date: new Date(date),
            status: rec.status,
            markedBy: facultyId,
            markedAt: new Date(),
            remarks: rec.remarks || ''
          }
        },
        upsert: true
      }
    }));

    // Directive E: Try MongoDB Transactions, with a standalone deployment fallback
    let txSuccess = false;
    try {
      await session.withTransaction(async () => {
        await AttendanceRecord.bulkWrite(operations, { session });
      });
      txSuccess = true;
    } catch (txError) {
      console.warn('⚠️ MongoDB Transaction failed or unsupported. Falling back to non-transactional bulk write.', txError.message);
      // Run bulk write normally outside transaction
      await AttendanceRecord.bulkWrite(operations);
    }

    // Trigger alerts for absentees
    for (const rec of records) {
      if (rec.status === 'ABSENT') {
        await createSystemNotification(
          rec.studentId,
          'Marked Absent',
          `You were marked ABSENT on ${new Date(date).toDateString()} for ${courseName || 'Daily Check-In'}.`,
          'PENDING_ACTION',
          '/student-dashboard'
        );
      }
    }

    res.status(200).json({ 
      message: 'Bulk attendance submitted successfully', 
      transactional: txSuccess,
      count: records.length 
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Error submitting bulk attendance rosters', error: error.message });
  } finally {
    session.endSession();
  }
};

// ==========================================
// 6. CORRECTION WORKFLOWS (Student Disputes)
// ==========================================
exports.applyCorrection = async (req, res) => {
  try {
    const { recordId, requestedStatus, reason, documentUrl } = req.body;
    const studentId = req.user._id;

    const record = await AttendanceRecord.findById(recordId);
    if (!record) return res.status(404).json({ message: 'Attendance record not found' });

    // Verify student ownership
    if (record.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({ message: 'Unauthorized. You do not own this record' });
    }

    // Check policy limits on corrections
    let policy = await AttendancePolicyMaster.findOne({ departmentId: record.departmentId, isActive: true });
    if (!policy) policy = await AttendancePolicyMaster.findOne({ departmentId: null, isActive: true });
    
    if (policy && !policy.allowCorrection) {
      return res.status(400).json({ message: 'Attendance corrections are disabled by department HOD' });
    }

    // Verify window
    const recordDate = new Date(record.date);
    const windowDays = policy?.correctionWindowDays || 14;
    const diffTime = Math.abs(new Date() - recordDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > windowDays) {
      return res.status(400).json({ 
        message: `Correction request rejected. Submissions must occur within ${windowDays} days of the lecture.` 
      });
    }

    const correction = await AttendanceCorrection.create({
      studentId,
      recordId,
      requestedStatus,
      reason,
      documentUrl,
      status: 'PENDING_FACULTY',
      facultyId: record.facultyId,
      auditLog: [{
        action: 'SUBMITTED',
        actorId: studentId,
        actorName: req.user.name,
        remarks: 'Correction request raised by student.'
      }]
    });

    // Notify reviewer
    await createSystemNotification(
      record.facultyId,
      'New Attendance Dispute',
      `${req.user.name} raised a discrepancy request for ${new Date(record.date).toDateString()}.`,
      'PENDING_ACTION',
      '/faculty-dashboard'
    );

    // Link reference
    record.correctionRequestId = correction._id;
    await record.save();

    res.status(201).json(correction);
  } catch (error) {
    res.status(500).json({ message: 'Error filing correction claim', error: error.message });
  }
};

exports.getMyCorrections = async (req, res) => {
  try {
    const corrections = await AttendanceCorrection.find({ studentId: req.user._id })
      .populate('recordId')
      .populate('facultyId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json(corrections);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving corrections logs', error: error.message });
  }
};

exports.getPendingCorrections = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'FACULTY') {
      query = { facultyId: req.user._id, status: 'PENDING_FACULTY' };
    } else if (req.user.role === 'HOD') {
      // HOD handles forwarded disputes and approvals
      query = { status: 'PENDING_HOD' };
    } else {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const corrections = await AttendanceCorrection.find(query)
      .populate('studentId', 'name profile')
      .populate('recordId')
      .sort({ createdAt: -1 });
    res.status(200).json(corrections);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending correction queue', error: error.message });
  }
};

exports.actionCorrection = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body; // action: RECOMMEND (by Faculty), APPROVE (by HOD), REJECT
    const actor = req.user;

    const correction = await AttendanceCorrection.findById(id)
      .populate('studentId')
      .populate('recordId');
    if (!correction) return res.status(404).json({ message: 'Dispute request not found' });

    if (action === 'RECOMMEND' && actor.role === 'FACULTY') {
      correction.status = 'PENDING_HOD';
      correction.facultyRemarks = remarks || '';
      correction.auditLog.push({
        action: 'RECOMMENDED',
        actorId: actor._id,
        actorName: actor.name,
        remarks: remarks || 'Recommended for HOD sign-off.'
      });

      // Find HOD
      const hod = await User.findOne({ department: actor.department, role: 'HOD' });
      if (hod) {
        await createSystemNotification(
          hod._id,
          'Dispute Recommended',
          `${actor.name} recommended correction approval for scholar ${correction.studentId.name}.`,
          'PENDING_ACTION',
          '/hod-dashboard'
        );
      }
    } else if (action === 'APPROVE' && actor.role === 'HOD') {
      correction.status = 'APPROVED';
      correction.hodRemarks = remarks || '';
      correction.auditLog.push({
        action: 'APPROVED',
        actorId: actor._id,
        actorName: actor.name,
        remarks: remarks || 'Dispute approved, database lock bypassed.'
      });

      // Update the attendance record
      const record = await AttendanceRecord.findById(correction.recordId);
      if (record) {
        record.auditHistory.push({
          editedBy: actor._id,
          editedAt: new Date(),
          previousStatus: record.status,
          newStatus: correction.requestedStatus,
          reason: `Dispute correction approved. remarks: ${remarks}`
        });
        record.status = correction.requestedStatus;
        record.lastEditedBy = actor._id;
        record.lastEditedAt = new Date();
        record.isLocked = true; // relock
        record.lockReason = 'Locked post-correction approval';
        await record.save();
      }

      await createSystemNotification(
        correction.studentId._id,
        'Correction Approved',
        `Your correction request for ${new Date(record.date).toDateString()} was approved by HOD.`,
        'SUCCESSFUL_ACTION',
        '/student-dashboard'
      );
    } else if (action === 'REJECT') {
      correction.status = 'REJECTED';
      if (actor.role === 'HOD') {
        correction.hodRemarks = remarks || '';
      } else {
        correction.facultyRemarks = remarks || '';
      }
      correction.auditLog.push({
        action: 'REJECTED',
        actorId: actor._id,
        actorName: actor.name,
        remarks: remarks || 'Dispute rejected.'
      });

      await createSystemNotification(
        correction.studentId._id,
        'Correction Rejected',
        `Your correction request for ${new Date(correction.recordId.date).toDateString()} was rejected.`,
        'INFO',
        '/student-dashboard'
      );
    }

    await correction.save();
    res.status(200).json(correction);
  } catch (error) {
    res.status(500).json({ message: 'Error processing correction claim', error: error.message });
  }
};

// ==========================================
// 7. HOLIDAY CALENDAR CONTROLLERS
// ==========================================
exports.getHolidays = async (req, res) => {
  try {
    const deptId = req.user.departmentId || null;
    const holidays = await HolidayCalendar.find({
      $or: [{ departmentId: deptId }, { departmentId: null }],
      isActive: true
    }).sort({ startDate: 1 });
    res.status(200).json(holidays);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving holidays', error: error.message });
  }
};

exports.createHoliday = async (req, res) => {
  try {
    const { holidayName, startDate, endDate, isRecurring, holidayType } = req.body;
    const departmentId = req.user.role === 'SUPER_ADMIN' ? null : req.user.departmentId;

    const holiday = await HolidayCalendar.create({
      departmentId,
      holidayName,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isRecurring,
      holidayType
    });
    res.status(201).json(holiday);
  } catch (error) {
    res.status(500).json({ message: 'Error creating holiday entry', error: error.message });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    // Directive C: Soft delete only
    const holiday = await HolidayCalendar.findByIdAndUpdate(id, { isActive: false }, { new: true });
    res.status(200).json({ message: 'Holiday soft-deleted successfully', holiday });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting holiday', error: error.message });
  }
};

// ==========================================
// 8. DASHBOARD ANALYTICS & STATS
// ==========================================
exports.getStudentDashboardStats = async (req, res) => {
  try {
    const studentId = req.user._id;
    const departmentId = req.user.departmentId;
    const programType = req.user.role === 'STUDENT' ? 'PhD' : 'PG'; // Default program check

    // Resolve current academic session
    const session = await AcademicSessionMaster.findOne({
      $or: [{ departmentId }, { departmentId: null }],
      isCurrent: true
    });

    if (!session) {
      return res.status(200).json({ error: 'No active academic session configured' });
    }

    // Fetch student's records, holidays, and timetables
    const records = await AttendanceRecord.find({
      studentId,
      date: { $gte: session.startDate, $lte: session.endDate }
    });

    const holidays = await HolidayCalendar.find({ isActive: true });
    
    // Roster scheduled slots
    const timetables = await TimetableMaster.find({ departmentId, isActive: true });

    const stats = await calculateStudentStats(
      studentId,
      departmentId,
      programType,
      session,
      records,
      holidays,
      timetables
    );

    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error resolving student analytics', error: error.message });
  }
};

exports.getFacultyDashboardStats = async (req, res) => {
  try {
    const facultyId = req.user._id;
    const departmentId = req.user.departmentId;

    // Get current session
    const session = await AcademicSessionMaster.findOne({
      $or: [{ departmentId }, { departmentId: null }],
      isCurrent: true
    });

    // Roster of faculty class slots
    const courses = await TimetableMaster.find({ facultyId, isActive: true });

    // Scholars assigned
    const scholarsCount = await User.countDocuments({ department: req.user.department, role: 'STUDENT' });

    // Recent bulk records logged by this faculty
    const recentLogs = await AttendanceRecord.find({ facultyId })
      .populate('studentId', 'name')
      .sort({ date: -1 })
      .limit(20);

    res.status(200).json({
      sessionName: session ? session.sessionName : 'No Active Session',
      coursesScheduled: courses.length,
      managedScholars: scholarsCount,
      recentLogs,
      courses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving faculty analytics', error: error.message });
  }
};

exports.getHodDashboardStats = async (req, res) => {
  try {
    const departmentId = req.user.departmentId;
    const deptName = req.user.department;

    const session = await AcademicSessionMaster.findOne({
      $or: [{ departmentId }, { departmentId: null }],
      isCurrent: true
    });

    if (!session) {
      return res.status(200).json({ message: 'No active session registered' });
    }

    // Get all students inside HOD's department
    const students = await User.find({ department: deptName, role: 'STUDENT', isActive: true })
      .select('name profile email username');

    const holidays = await HolidayCalendar.find({ isActive: true });
    const timetables = await TimetableMaster.find({ departmentId, isActive: true });

    const scholarStatsList = [];
    const defaulters = [];
    const warningList = [];

    // Run dynamic calculations for each student
    for (const student of students) {
      const records = await AttendanceRecord.find({
        studentId: student._id,
        date: { $gte: session.startDate, $lte: session.endDate }
      });

      const stats = await calculateStudentStats(
        student._id,
        departmentId,
        'PhD', // default HOD scholar context is research
        session,
        records,
        holidays,
        timetables
      );

      const studentData = {
        studentId: student._id,
        name: student.name,
        enrollmentNumber: student.profile?.enrollmentNumber || 'N/A',
        email: student.profile?.email || student.username,
        percentage: stats.percentage,
        isDefaulter: stats.isDefaulter,
        isWarning: stats.isWarning,
        presentDays: stats.presentDays,
        absentDays: stats.absentDays,
        leaveDays: stats.creditedLeaveDays + stats.excusedLeaveDays
      };

      scholarStatsList.push(studentData);
      if (stats.isDefaulter) defaulters.push(studentData);
      if (stats.isWarning) warningList.push(studentData);
    }

    // Compute department stats
    const averageDeptPercentage = scholarStatsList.length > 0 
      ? parseFloat((scholarStatsList.reduce((acc, curr) => acc + curr.percentage, 0) / scholarStatsList.length).toFixed(2))
      : 100;

    // Get audit logs - fetch last 20 records marked in this dept
    const auditLogs = await AttendanceRecord.find({ departmentId })
      .populate('studentId', 'name')
      .populate('markedBy', 'name')
      .sort({ updatedAt: -1 })
      .limit(20);

    res.status(200).json({
      sessionName: session.sessionName,
      totalStudentsCount: students.length,
      averageDeptPercentage,
      defaulterCount: defaulters.length,
      warningCount: warningList.length,
      defaulters,
      warnings: warningList,
      rosterStats: scholarStatsList,
      auditLogs
    });

  } catch (error) {
    console.error('HOD Stats error:', error);
    res.status(500).json({ message: 'Error retrieving departmental dashboard context', error: error.message });
  }
};

exports.getSuperAdminDashboardStats = async (req, res) => {
  try {
    const departmentsCount = await Department.countDocuments();
    const activeSessionsCount = await AcademicSessionMaster.countDocuments({ isCurrent: true });
    const globalHolidaysCount = await HolidayCalendar.countDocuments({ departmentId: null, isActive: true });
    const totalUsersCount = await User.countDocuments({ isActive: true });

    res.status(200).json({
      departmentsCount,
      activeSessionsCount,
      globalHolidaysCount,
      totalUsersCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating super admin summary statistics', error: error.message });
  }
};

// ==========================================
// 9. LEAVE REQUEST WORKFLOWS (Backward Compatible)
// ==========================================
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, totalDays, reason, documentUrl } = req.body;
    const student = await User.findById(req.user._id);

    let departmentId = null;
    const dept = await Department.findOne({
      $or: [{ name: student.department }, { code: student.department }]
    });
    if (dept) departmentId = dept._id;

    let supervisorId = null;
    if (student.profile?.preferredGuideId) {
      supervisorId = student.profile.preferredGuideId;
    } else {
      const hod = await User.findOne({ department: student.department, role: 'HOD' });
      if (hod) supervisorId = hod._id;
    }

    const leave = await LeaveRequest.create({
      studentId: student._id,
      department: student.department,
      departmentId,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalDays,
      reason,
      documentUrl,
      status: supervisorId ? 'PENDING_SUPERVISOR' : 'PENDING_HOD',
      currentAssigneeId: supervisorId,
      auditLog: [{
        action: 'SUBMITTED',
        actorId: student._id,
        actorName: student.name,
        remarks: 'Leave request filed by scholar.'
      }]
    });

    if (supervisorId) {
      await createSystemNotification(
        supervisorId,
        'Scholar Leave Submitted',
        `${student.name} filed a leave request for ${totalDays} days starting ${new Date(startDate).toDateString()}.`,
        'PENDING_ACTION',
        '/faculty-dashboard'
      );
    }

    res.status(201).json(leave);
  } catch (error) {
    console.error('Error applying leave:', error);
    res.status(500).json({ message: 'Error submitting leave request', error: error.message });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving your leaves list', error: error.message });
  }
};

exports.getPendingLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ currentAssigneeId: req.user._id })
      .populate('studentId', 'name profile');
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving pending leave requests', error: error.message });
  }
};

exports.actionLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body; // action: RECOMMEND, APPROVE, REJECT
    const actor = req.user;

    const leave = await LeaveRequest.findById(id).populate('studentId');
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    if (action === 'RECOMMEND' && actor.role === 'FACULTY') {
      const hod = await User.findOne({ department: leave.department, role: 'HOD' });
      leave.status = 'PENDING_HOD';
      leave.currentAssigneeId = hod ? hod._id : null;
      leave.auditLog.push({
        action: 'RECOMMENDED',
        actorId: actor._id,
        actorName: actor.name,
        remarks: remarks || 'Endorsed for HOD approval.'
      });

      if (hod) {
        await createSystemNotification(
          hod._id,
          'Leave Recommended',
          `${actor.name} recommended leave approval for scholar ${leave.studentId.name}.`,
          'PENDING_ACTION',
          '/hod-dashboard'
        );
      }
    } else if (action === 'APPROVE' && actor.role === 'HOD') {
      leave.status = 'APPROVED';
      leave.currentAssigneeId = null;
      leave.auditLog.push({
        action: 'APPROVED',
        actorId: actor._id,
        actorName: actor.name,
        remarks: remarks || 'Approved by department HOD.'
      });

      // Find current session to log records properly
      const currentSession = await AcademicSessionMaster.findOne({
        $or: [{ departmentId: leave.departmentId }, { departmentId: null }],
        isCurrent: true
      });

      // Credit attendance records automatically for these dates
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const operations = [];

      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        operations.push({
          updateOne: {
            filter: {
              studentId: leave.studentId._id,
              date: new Date(dt),
              courseCode: 'DAILY'
            },
            update: {
              $set: {
                studentId: leave.studentId._id,
                sessionId: currentSession ? currentSession._id : null,
                departmentId: leave.departmentId || null,
                facultyId: actor._id,
                date: new Date(dt),
                status: leave.leaveType === 'MEDICAL' ? 'MEDICAL_LEAVE' 
                      : leave.leaveType === 'DUTY' ? 'DUTY_LEAVE' 
                      : leave.leaveType === 'CASUAL' ? 'CASUAL_LEAVE' 
                      : 'ON_LEAVE',
                markedBy: actor._id,
                markedAt: new Date(),
                remarks: `Auto-credited: Approved Leave (${leave.leaveType})`
              }
            },
            upsert: true
          }
        });
      }

      if (operations.length > 0) {
        await AttendanceRecord.bulkWrite(operations);
      }

      await createSystemNotification(
        leave.studentId._id,
        'Leave Approved',
        `Your ${leave.leaveType} leave request has been approved.`,
        'SUCCESSFUL_ACTION',
        '/student-dashboard'
      );
    } else if (action === 'REJECT') {
      leave.status = 'REJECTED';
      leave.currentAssigneeId = null;
      leave.auditLog.push({
        action: 'REJECTED',
        actorId: actor._id,
        actorName: actor.name,
        remarks: remarks || 'Rejected.'
      });

      await createSystemNotification(
        leave.studentId._id,
        'Leave Request Rejected',
        `Your ${leave.leaveType} leave request was rejected.`,
        'INFO',
        '/student-dashboard'
      );
    }

    await leave.save();
    res.status(200).json(leave);
  } catch (error) {
    console.error('Error actioning leave request:', error);
    res.status(500).json({ message: 'Error processing leave request', error: error.message });
  }
};

