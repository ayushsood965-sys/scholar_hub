const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const LeaveRequest = require('../models/LeaveRequest');

const AttendancePolicyMaster = require('../models/attendance/AttendancePolicyMaster');
const LeaveTypeMaster = require('../models/attendance/LeaveTypeMaster');
const AcademicSessionMaster = require('../models/attendance/AcademicSessionMaster');
const TimetableMaster = require('../models/attendance/TimetableMaster');
const HolidayCalendar = require('../models/attendance/HolidayCalendar');
const AttendanceCorrection = require('../models/attendance/AttendanceCorrection');
const AttendanceRecord = require('../models/attendance/AttendanceRecord');

const DegreeTypeMaster = require('../models/attendance/DegreeTypeMaster');
const DegreeNameMaster = require('../models/attendance/DegreeNameMaster');
const SemesterMaster = require('../models/attendance/SemesterMaster');
const DegreeDepartmentMapping = require('../models/attendance/DegreeDepartmentMapping');

const { calculateStudentStats } = require('../utils/attendanceCalculator');

const createSystemNotification = async (recipientId, title, message, type = 'INFO', link = '') => {
  try {
    await Notification.create({ recipient: recipientId, title, message, type, link });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// ==========================================
// 1. MASTER CRUD (SUPER ADMIN)
// ==========================================
exports.getDegreeTypes = async (req, res) => {
  try {
    const data = await DegreeTypeMaster.find({ isActive: true });
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createDegreeType = async (req, res) => {
  try {
    const data = await DegreeTypeMaster.create(req.body);
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.deleteDegreeType = async (req, res) => {
  try {
    const data = await DegreeTypeMaster.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getDegreeNames = async (req, res) => {
  try {
    const query = { isActive: true };
    if (req.query.degreeTypeId) query.degreeTypeId = req.query.degreeTypeId;
    const data = await DegreeNameMaster.find(query).populate('degreeTypeId');
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createDegreeName = async (req, res) => {
  try {
    const data = await DegreeNameMaster.create(req.body);
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.deleteDegreeName = async (req, res) => {
  try {
    const data = await DegreeNameMaster.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getSemesters = async (req, res) => {
  try {
    const data = await SemesterMaster.find({ isActive: true }).sort({ number: 1 });
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createSemester = async (req, res) => {
  try {
    const data = await SemesterMaster.create(req.body);
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.deleteSemester = async (req, res) => {
  try {
    const data = await SemesterMaster.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getDegreeDeptMappings = async (req, res) => {
  try {
    const data = await DegreeDepartmentMapping.find({ isActive: true })
      .populate({ path: 'degreeNameId', populate: { path: 'degreeTypeId' } })
      .populate('departmentId');
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createDegreeDeptMapping = async (req, res) => {
  try {
    const data = await DegreeDepartmentMapping.create(req.body);
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.deleteDegreeDeptMapping = async (req, res) => {
  try {
    const data = await DegreeDepartmentMapping.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ==========================================
// 2. SESSION CRUD
// ==========================================
exports.getSessions = async (req, res) => {
  try {
    const sessions = await AcademicSessionMaster.find().sort({ startDate: -1 });
    res.status(200).json(sessions);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createSession = async (req, res) => {
  try {
    const session = await AcademicSessionMaster.create(req.body);
    res.status(201).json(session);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.setCurrentSession = async (req, res) => {
  try {
    await AcademicSessionMaster.updateMany({}, { isCurrent: false });
    const session = await AcademicSessionMaster.findByIdAndUpdate(req.params.id, { isCurrent: true }, { new: true });
    res.status(200).json(session);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ==========================================
// 3. POLICY & LEAVE TYPE CRUD
// ==========================================
exports.getPolicies = async (req, res) => {
  try {
    const query = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN'
      ? {} : { departmentId: req.user.departmentId };
    const policies = await AttendancePolicyMaster.find({ ...query, isActive: true }).populate('departmentId');
    res.status(200).json(policies);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createOrUpdatePolicy = async (req, res) => {
  try {
    const { programType, minRequiredPercentage, warningThreshold, maxCondonationPercentage, editLockHours, allowHalfDay, allowMedicalLeave, allowDutyLeave, allowCorrection, correctionWindowDays } = req.body;
    const departmentId = req.user.role === 'SUPER_ADMIN' ? null : req.user.departmentId;
    let policy = await AttendancePolicyMaster.findOne({ departmentId, programType });
    if (policy) {
      Object.assign(policy, { minRequiredPercentage, warningThreshold, maxCondonationPercentage, editLockHours, allowHalfDay, allowMedicalLeave, allowDutyLeave, allowCorrection, correctionWindowDays, isActive: true });
      await policy.save();
    } else {
      policy = await AttendancePolicyMaster.create({ departmentId, programType, minRequiredPercentage, warningThreshold, maxCondonationPercentage, editLockHours, allowHalfDay, allowMedicalLeave, allowDutyLeave, allowCorrection, correctionWindowDays });
    }
    res.status(200).json(policy);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.deletePolicy = async (req, res) => {
  try {
    const policy = await AttendancePolicyMaster.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.status(200).json(policy);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getLeaveTypes = async (req, res) => {
  try {
    const deptId = req.user.departmentId;
    const leaveTypes = await LeaveTypeMaster.find({
      $or: [{ departmentId: deptId }, { departmentId: null }],
      isActive: true
    });
    res.status(200).json(leaveTypes);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createLeaveType = async (req, res) => {
  try {
    const deptId = req.user.role === 'SUPER_ADMIN' ? null : req.user.departmentId;
    const leaveType = await LeaveTypeMaster.create({ ...req.body, departmentId: deptId });
    res.status(201).json(leaveType);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.deleteLeaveType = async (req, res) => {
  try {
    const leaveType = await LeaveTypeMaster.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.status(200).json(leaveType);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ==========================================
// 4. TIMETABLE CRUD
// ==========================================
exports.getTimetables = async (req, res) => {
  try {
    const { sessionId, degreeTypeId, degreeNameId, semesterId } = req.query;
    const query = { isActive: true };
    if (sessionId) query.sessionId = sessionId;
    if (degreeTypeId) query.degreeTypeId = degreeTypeId;
    if (degreeNameId) query.degreeNameId = degreeNameId;
    if (semesterId) query.semesterId = semesterId;
    
    if (req.user.role !== 'SUPER_ADMIN') {
      query.departmentId = req.user.departmentId;
    }
    const slots = await TimetableMaster.find(query).populate('facultyId', 'name username');
    res.status(200).json(slots);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getFacultyTimetables = async (req, res) => {
  try {
    const session = await AcademicSessionMaster.findOne({ isCurrent: true });
    if (!session) return res.status(200).json([]);
    const slots = await TimetableMaster.find({ facultyId: req.user._id, sessionId: session._id, isActive: true })
      .populate('degreeNameId', 'name')
      .populate('semesterId', 'name');
    res.status(200).json(slots);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createTimetableSlot = async (req, res) => {
  try {
    const slot = await TimetableMaster.create({
      ...req.body,
      departmentId: req.user.departmentId
    });
    res.status(201).json(slot);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.deleteTimetableSlot = async (req, res) => {
  try {
    const slot = await TimetableMaster.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.status(200).json(slot);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.cloneTimetable = async (req, res) => {
  try {
    const { sourceSessionId, targetSessionId } = req.body;
    const departmentId = req.user.departmentId;
    const slots = await TimetableMaster.find({ sessionId: sourceSessionId, departmentId, isActive: true });
    const newSlots = slots.map(s => ({
      sessionId: targetSessionId,
      departmentId: s.departmentId,
      degreeTypeId: s.degreeTypeId,
      degreeNameId: s.degreeNameId,
      semesterId: s.semesterId,
      subjectCode: s.subjectCode,
      subjectName: s.subjectName,
      facultyId: s.facultyId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime
    }));
    if (newSlots.length > 0) {
      await TimetableMaster.insertMany(newSlots);
    }
    res.status(200).json({ message: `Cloned ${newSlots.length} slots` });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ==========================================
// 5. FACULTY ATTENDANCE MATRIX
// ==========================================
exports.getAttendanceMatrix = async (req, res) => {
  try {
    const { sessionId, degreeTypeId, degreeNameId, semesterId, date } = req.query;
    const departmentId = req.user.departmentId;
    const targetDate = new Date(date);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][targetDate.getDay()];
    
    // Determine program type from degreeTypeId
    const dt = degreeTypeId ? await DegreeTypeMaster.findById(degreeTypeId) : null;
    const isPhD = dt && dt.code === 'PHD';

    // Get students matching criteria
    const studentQuery = { role: 'STUDENT', department: req.user.department, isActive: true };
    if (!isPhD) {
      if (degreeTypeId) studentQuery['profile.degreeTypeId'] = degreeTypeId;
      if (degreeNameId) studentQuery['profile.degreeNameId'] = degreeNameId;
      if (semesterId) studentQuery['profile.semesterId'] = semesterId;
    } else {
      if (degreeTypeId) studentQuery['profile.degreeTypeId'] = degreeTypeId;
    }
    const students = await User.find(studentQuery).select('name username profile');

    let classes = [];
    if (!isPhD) {
      classes = await TimetableMaster.find({
        sessionId, degreeTypeId, degreeNameId, semesterId,
        departmentId, dayOfWeek, isActive: true
      });
    }

    // Get existing records for this date to pre-fill matrix
    const records = await AttendanceRecord.find({
      departmentId,
      date: targetDate,
      sessionId
    });
    
    const matrix = students.map(st => {
      const existing = records.find(r => r.studentId.toString() === st._id.toString());
      return {
        student: st,
        record: existing || null
      };
    });

    res.status(200).json({ students: matrix, classes, isPhD });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.markAttendanceBulk = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { sessionId, degreeTypeId, degreeNameId, semesterId, date, records } = req.body;
    const facultyId = req.user._id;
    const departmentId = req.user.departmentId;
    
    const dt = await DegreeTypeMaster.findById(degreeTypeId);
    const isPhD = dt && dt.code === 'PHD';

    const operations = records.map(rec => ({
      updateOne: {
        filter: {
          studentId: rec.studentId,
          date: new Date(date)
        },
        update: {
          $set: {
            studentId: rec.studentId,
            sessionId,
            degreeTypeId,
            degreeNameId: isPhD ? null : degreeNameId,
            semesterId: isPhD ? null : semesterId,
            facultyId,
            departmentId,
            date: new Date(date),
            status: rec.status,
            classes: rec.classes || [],
            markedBy: facultyId,
            markedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    let txSuccess = false;
    try {
      await session.withTransaction(async () => {
        await AttendanceRecord.bulkWrite(operations, { session });
      });
      txSuccess = true;
    } catch (txError) {
      await AttendanceRecord.bulkWrite(operations);
    }
    res.status(200).json({ message: 'Saved successfully', transactional: txSuccess });
  } catch (error) { res.status(500).json({ message: error.message }); }
  finally { session.endSession(); }
};

// ==========================================
// 6. LEAVE WORKFLOWS
// ==========================================
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, totalDays, reason, documentUrl } = req.body;
    const student = await User.findById(req.user._id);
    const departmentId = (await Department.findOne({ name: student.department }))?._id;

    let supervisorId = student.profile?.preferredGuideId;
    if (!supervisorId) supervisorId = (await User.findOne({ department: student.department, role: 'HOD' }))?._id;

    const leave = await LeaveRequest.create({
      studentId: student._id, department: student.department, departmentId,
      leaveType, startDate: new Date(startDate), endDate: new Date(endDate),
      totalDays, reason, documentUrl,
      status: supervisorId ? 'PENDING_SUPERVISOR' : 'PENDING_HOD',
      currentAssigneeId: supervisorId,
      auditLog: [{ action: 'SUBMITTED', actorId: student._id, actorName: student.name, remarks: 'Applied' }]
    });
    res.status(201).json(leave);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(leaves);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getPendingLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ currentAssigneeId: req.user._id }).populate('studentId', 'name profile');
    res.status(200).json(leaves);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.actionLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body;
    const actor = req.user;
    const leave = await LeaveRequest.findById(id).populate('studentId');

    if (action === 'RECOMMEND') {
      const hod = await User.findOne({ department: leave.department, role: 'HOD' });
      leave.status = 'PENDING_HOD';
      leave.currentAssigneeId = hod?._id;
      leave.auditLog.push({ action: 'RECOMMENDED', actorId: actor._id, actorName: actor.name, remarks });
    } else if (action === 'APPROVE') {
      leave.status = 'APPROVED';
      leave.currentAssigneeId = null;
      leave.auditLog.push({ action: 'APPROVED', actorId: actor._id, actorName: actor.name, remarks });

      const currentSession = await AcademicSessionMaster.findOne({
        $or: [{ departmentId: leave.departmentId }, { departmentId: null }],
        isCurrent: true
      });
      const operations = [];
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        operations.push({
          updateOne: {
            filter: { studentId: leave.studentId._id, date: new Date(dt) },
            update: {
              $set: {
                studentId: leave.studentId._id,
                sessionId: currentSession?._id,
                departmentId: leave.departmentId,
                facultyId: actor._id,
                date: new Date(dt),
                status: 'ON_LEAVE',
                isLeaveOverride: true,
                leaveRequestId: leave._id,
                markedBy: actor._id,
                markedAt: new Date(),
                isLocked: true,
                lockReason: 'Approved Leave',
                degreeTypeId: leave.studentId.profile?.degreeTypeId || null,
                degreeNameId: leave.studentId.profile?.degreeNameId || null,
                semesterId: leave.studentId.profile?.semesterId || null
              }
            },
            upsert: true
          }
        });
      }
      if (operations.length > 0) await AttendanceRecord.bulkWrite(operations);
    } else if (action === 'REJECT') {
      leave.status = 'REJECTED';
      leave.currentAssigneeId = null;
      leave.auditLog.push({ action: 'REJECTED', actorId: actor._id, actorName: actor.name, remarks });
    }
    await leave.save();
    res.status(200).json(leave);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ==========================================
// 7. CORRECTION WORKFLOWS
// ==========================================
exports.applyCorrection = async (req, res) => {
  try {
    const { recordId, requestedStatus, reason, documentUrl } = req.body;
    const record = await AttendanceRecord.findById(recordId);
    if (!record || record.studentId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Unauthorized' });
    
    const correction = await AttendanceCorrection.create({
      studentId: req.user._id, recordId, requestedStatus, reason, documentUrl,
      status: 'PENDING_FACULTY', facultyId: record.facultyId,
      auditLog: [{ action: 'SUBMITTED', actorId: req.user._id, actorName: req.user.name, remarks: 'Submitted' }]
    });
    record.correctionRequestId = correction._id;
    await record.save();
    res.status(201).json(correction);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getMyCorrections = async (req, res) => {
  try {
    const corrections = await AttendanceCorrection.find({ studentId: req.user._id }).populate('recordId').populate('facultyId', 'name').sort({ createdAt: -1 });
    res.status(200).json(corrections);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getPendingCorrections = async (req, res) => {
  try {
    const query = req.user.role === 'FACULTY' ? { facultyId: req.user._id, status: 'PENDING_FACULTY' } : { status: 'PENDING_HOD' };
    const corrections = await AttendanceCorrection.find(query).populate('studentId', 'name profile').populate('recordId');
    res.status(200).json(corrections);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.actionCorrection = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body;
    const actor = req.user;
    const correction = await AttendanceCorrection.findById(id).populate('recordId');

    if (action === 'RECOMMEND') {
      correction.status = 'PENDING_HOD';
      correction.auditLog.push({ action: 'RECOMMENDED', actorId: actor._id, actorName: actor.name, remarks });
    } else if (action === 'APPROVE') {
      correction.status = 'APPROVED';
      correction.auditLog.push({ action: 'APPROVED', actorId: actor._id, actorName: actor.name, remarks });
      const record = await AttendanceRecord.findById(correction.recordId);
      record.status = correction.requestedStatus;
      record.isLocked = true;
      record.lockReason = 'Correction Approved';
      await record.save();
    } else if (action === 'REJECT') {
      correction.status = 'REJECTED';
      correction.auditLog.push({ action: 'REJECTED', actorId: actor._id, actorName: actor.name, remarks });
    }
    await correction.save();
    res.status(200).json(correction);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ==========================================
// 8. HOLIDAYS & STATS
// ==========================================
exports.getHolidays = async (req, res) => {
  try {
    const holidays = await HolidayCalendar.find({ isActive: true }).sort({ startDate: 1 });
    res.status(200).json(holidays);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createHoliday = async (req, res) => {
  try {
    const holiday = await HolidayCalendar.create(req.body);
    res.status(201).json(holiday);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.deleteHoliday = async (req, res) => {
  try {
    const holiday = await HolidayCalendar.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.status(200).json(holiday);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getStudentDashboardStats = async (req, res) => {
  try {
    const session = await AcademicSessionMaster.findOne({ isCurrent: true });
    if (!session) return res.status(200).json({ error: 'No active session' });
    const records = await AttendanceRecord.find({ studentId: req.user._id, date: { $gte: session.startDate, $lte: session.endDate } });
    const holidays = await HolidayCalendar.find({ isActive: true });
    const dt = req.user.profile?.degreeTypeId ? await DegreeTypeMaster.findById(req.user.profile.degreeTypeId) : null;
    const timetables = dt && dt.code !== 'PHD' ? await TimetableMaster.find({ sessionId: session._id, semesterId: req.user.profile?.semesterId, isActive: true }) : [];
    const stats = await calculateStudentStats(req.user, session, records, holidays, timetables);
    res.status(200).json(stats);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getFacultyDashboardStats = async (req, res) => {
  try {
    const session = await AcademicSessionMaster.findOne({ isCurrent: true });
    const courses = await TimetableMaster.find({ facultyId: req.user._id, isActive: true });
    const scholarsCount = await User.countDocuments({ department: req.user.department, role: 'STUDENT' });
    const recentLogs = await AttendanceRecord.find({ facultyId: req.user._id }).populate('studentId', 'name').sort({ date: -1 }).limit(20);
    res.status(200).json({ sessionName: session?.sessionName || 'No Active Session', coursesScheduled: courses.length, managedScholars: scholarsCount, recentLogs, courses });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getHodDashboardStats = async (req, res) => {
  try {
    const session = await AcademicSessionMaster.findOne({ isCurrent: true });
    const students = await User.find({ department: req.user.department, role: 'STUDENT', isActive: true }).select('name profile email username');
    const holidays = await HolidayCalendar.find({ isActive: true });
    
    const scholarStatsList = [];
    const defaulters = [];
    const warnings = [];

    for (const student of students) {
      const records = await AttendanceRecord.find({ studentId: student._id, date: { $gte: session.startDate, $lte: session.endDate } });
      const dt = student.profile?.degreeTypeId ? await DegreeTypeMaster.findById(student.profile.degreeTypeId) : null;
      const timetables = dt && dt.code !== 'PHD' ? await TimetableMaster.find({ sessionId: session._id, semesterId: student.profile?.semesterId, isActive: true }) : [];
      const stats = await calculateStudentStats(student, session, records, holidays, timetables);
      const sData = { studentId: student._id, name: student.name, enrollmentNumber: student.profile?.enrollmentNumber || 'N/A', email: student.profile?.email || student.username, ...stats };
      scholarStatsList.push(sData);
      if (stats.isDefaulter) defaulters.push(sData);
      if (stats.isWarning) warnings.push(sData);
    }
    const avg = scholarStatsList.length > 0 ? parseFloat((scholarStatsList.reduce((acc, curr) => acc + curr.percentage, 0) / scholarStatsList.length).toFixed(2)) : 100;
    const auditLogs = await AttendanceRecord.find({ departmentId: req.user.departmentId }).populate('studentId', 'name').populate('markedBy', 'name').sort({ updatedAt: -1 }).limit(20);
    res.status(200).json({ sessionName: session?.sessionName, totalStudentsCount: students.length, averageDeptPercentage: avg, defaulterCount: defaulters.length, warningCount: warnings.length, defaulters, warnings, rosterStats: scholarStatsList, auditLogs });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getSuperAdminDashboardStats = async (req, res) => {
  try {
    const departmentsCount = await Department.countDocuments();
    const activeSessionsCount = await AcademicSessionMaster.countDocuments({ isCurrent: true });
    const totalStudents = await User.countDocuments({ role: 'STUDENT', isActive: true });
    const totalPolicies = await AttendancePolicyMaster.countDocuments({ isActive: true });
    
    // We can also aggregate per-department stats if needed
    const departments = await Department.find();
    const deptStats = [];
    for (const d of departments) {
      const studentCount = await User.countDocuments({ department: d.name, role: 'STUDENT' });
      deptStats.push({ name: d.name, studentCount, averagePercentage: 100, defaulterCount: 0, activeSession: '2025-26' }); // Mocked aggregate for now
    }

    res.status(200).json({ departmentsCount, activeSessionsCount, totalStudents, totalPolicies, departments: deptStats });
  } catch (error) { 
    console.error("Error in getSuperAdminDashboardStats:", error);
    res.status(500).json({ message: error.message }); 
  }
};
