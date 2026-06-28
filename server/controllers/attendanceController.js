const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const LeaveRequest = require('../models/LeaveRequest');
const paginate = require('../utils/paginate');

const AttendancePolicyMaster = require('../models/attendance/AttendancePolicyMaster');
const LeaveTypeMaster = require('../models/attendance/LeaveTypeMaster');
const AcademicSessionMaster = require('../models/attendance/AcademicSessionMaster');
const TimetableMaster = require('../models/attendance/TimetableMaster');
const HolidayCalendar = require('../models/attendance/HolidayCalendar');
const AttendanceCorrection = require('../models/attendance/AttendanceCorrection');
const AttendanceRecord = require('../models/attendance/AttendanceRecord');
const StudentSemesterMapping = require('../models/attendance/StudentSemesterMapping');

const DegreeTypeMaster = require('../models/attendance/DegreeTypeMaster');
const DegreeNameMaster = require('../models/attendance/DegreeNameMaster');
const SemesterMaster = require('../models/attendance/SemesterMaster');
const SemesterDegreeMapping = require('../models/attendance/SemesterDegreeMapping');
const CategoryGenderMaster = require('../models/CategoryGenderMaster');

const { calculateStudentStats } = require('../utils/attendanceCalculator');
const { createNotification } = require('./notificationController');

const createSystemNotification = async (recipientId, title, message, type = 'INFO', link = '') => {
  try {
    await Notification.create({ recipient: recipientId, title, message, type, link });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

// Format a Date as YYYY-MM-DD in local timezone (avoids UTC offset from toISOString)
const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
exports.updateDegreeType = async (req, res) => {
  try {
    const { name, code, isActive } = req.body;
    const data = await DegreeTypeMaster.findById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Degree Type not found' });
    if (name) data.name = name;
    if (code) data.code = code.toUpperCase();
    if (isActive !== undefined) data.isActive = isActive;
    await data.save();
    res.status(200).json(data);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A degree type with this name or code already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getDegreeNames = async (req, res) => {
  try {
    const query = { isActive: true };
    if (req.query.degreeTypeId) query.degreeTypeId = req.query.degreeTypeId;
    // Filter by faculty/HOD's own department (only when authenticated)
    if (req.user && (req.user.role === 'FACULTY' || req.user.role === 'HOD')) {
      if (req.user.departmentId) {
        query.departmentId = req.user.departmentId;
      }
    }
    const data = await DegreeNameMaster.find(query).populate('degreeTypeId').populate('departmentId');
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createDegreeName = async (req, res) => {
  try {
    const { name, code, degreeTypeId, departmentId } = req.body;
    // Duplicate validation: check for existing active degree name with same name+code+degreeTypeId+departmentId
    const duplicateQuery = { isActive: true, name: name.trim(), code: code.trim().toUpperCase() };
    if (degreeTypeId) duplicateQuery.degreeTypeId = degreeTypeId;
    if (departmentId) duplicateQuery.departmentId = departmentId;
    const existing = await DegreeNameMaster.findOne(duplicateQuery);
    if (existing) {
      return res.status(409).json({ message: 'A degree name with this name, code, degree type, and department combination already exists.' });
    }
    const data = await DegreeNameMaster.create(req.body);
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.updateDegreeName = async (req, res) => {
  try {
    const { name, code, degreeTypeId, departmentId } = req.body;
    // Duplicate validation: exclude current record
    const duplicateQuery = { isActive: true, _id: { $ne: req.params.id }, name: name.trim(), code: code.trim().toUpperCase() };
    if (degreeTypeId) duplicateQuery.degreeTypeId = degreeTypeId;
    if (departmentId) duplicateQuery.departmentId = departmentId;
    const existing = await DegreeNameMaster.findOne(duplicateQuery);
    if (existing) {
      return res.status(409).json({ message: 'A degree name with this name, code, degree type, and department combination already exists.' });
    }
    const data = await DegreeNameMaster.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ message: 'Degree name not found' });
    res.status(200).json(data);
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
exports.updateSemester = async (req, res) => {
  try {
    const { name, number, isActive } = req.body;
    const data = await SemesterMaster.findById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Semester not found' });
    if (name) data.name = name;
    if (number !== undefined) data.number = number;
    if (isActive !== undefined) data.isActive = isActive;
    await data.save();
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getSemesterDegreeMappings = async (req, res) => {
  try {
    const data = await SemesterDegreeMapping.find({ isActive: true })
      .populate('degreeNameId')
      .populate('semesterId');
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createSemesterDegreeMapping = async (req, res) => {
  try {
    const { degreeNameId, semesterId } = req.body;
    const existing = await SemesterDegreeMapping.findOne({ degreeNameId, semesterId, isActive: true });
    if (existing) {
      return res.status(400).json({ message: 'This semester is already mapped to the selected degree.' });
    }
    const inactiveExisting = await SemesterDegreeMapping.findOne({ degreeNameId, semesterId, isActive: false });
    if (inactiveExisting) {
      inactiveExisting.isActive = true;
      await inactiveExisting.save();
      return res.status(201).json(inactiveExisting);
    }
    const data = await SemesterDegreeMapping.create(req.body);
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.deleteSemesterDegreeMapping = async (req, res) => {
  try {
    const data = await SemesterDegreeMapping.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.updateSemesterDegreeMapping = async (req, res) => {
  try {
    const { degreeNameId, semesterId } = req.body;
    const existing = await SemesterDegreeMapping.findOne({ degreeNameId, semesterId, isActive: true, _id: { $ne: req.params.id } });
    if (existing) {
      return res.status(400).json({ message: 'This semester is already mapped to the selected degree.' });
    }
    const data = await SemesterDegreeMapping.findByIdAndUpdate(req.params.id, { degreeNameId, semesterId }, { new: true })
      .populate('degreeNameId')
      .populate('semesterId');
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
exports.updateSession = async (req, res) => {
  try {
    const { sessionName, startDate, endDate, isActive } = req.body;
    const session = await AcademicSessionMaster.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (sessionName) session.sessionName = sessionName;
    if (startDate) session.startDate = startDate;
    if (endDate) session.endDate = endDate;
    if (isActive !== undefined) session.isActive = isActive;
    await session.save();
    res.status(200).json(session);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.deleteSession = async (req, res) => {
  try {
    const session = await AcademicSessionMaster.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.isCurrent) {
      return res.status(400).json({ message: 'Cannot delete the active/current session. Please set another session as current first.' });
    }
    await AcademicSessionMaster.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.status(200).json({ message: 'Session deleted successfully' });
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
    const { sessionId, degreeTypeId, degreeNameId, semesterId, dayOfWeek, startTime, endTime } = req.body;
    
    // Validate time overlap
    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);
    if (newStart >= newEnd) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }
    
    const overlapQuery = {
      sessionId, degreeTypeId, degreeNameId, semesterId,
      departmentId: req.user.departmentId, dayOfWeek, isActive: true
    };
    const existingSlots = await TimetableMaster.find(overlapQuery);
    for (const slot of existingSlots) {
      const exStart = timeToMinutes(slot.startTime);
      const exEnd = timeToMinutes(slot.endTime);
      if (newStart < exEnd && newEnd > exStart) {
        return res.status(409).json({ 
          message: `Time slot conflicts with existing entry: ${slot.startTime} - ${slot.endTime} (${slot.subjectName}). Please choose a different time.` 
        });
      }
    }
    
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
exports.updateTimetableSlot = async (req, res) => {
  try {
    const { sessionId, degreeTypeId, degreeNameId, semesterId, dayOfWeek, startTime, endTime } = req.body;
    
    // Validate time overlap (exclude current slot from check)
    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);
    if (newStart >= newEnd) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }
    
    const overlapQuery = {
      sessionId, degreeTypeId, degreeNameId, semesterId,
      departmentId: req.user.departmentId, dayOfWeek, isActive: true,
      _id: { $ne: req.params.id }
    };
    const existingSlots = await TimetableMaster.find(overlapQuery);
    for (const slot of existingSlots) {
      const exStart = timeToMinutes(slot.startTime);
      const exEnd = timeToMinutes(slot.endTime);
      if (newStart < exEnd && newEnd > exStart) {
        return res.status(409).json({ 
          message: `Time slot conflicts with existing entry: ${slot.startTime} - ${slot.endTime} (${slot.subjectName}). Please choose a different time.` 
        });
      }
    }
    
    const slot = await TimetableMaster.findByIdAndUpdate(
      req.params.id,
      { ...req.body, departmentId: req.user.departmentId },
      { new: true, runValidators: true }
    );
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
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

    let classes = [];
    if (!isPhD) {
      classes = await TimetableMaster.find({
        sessionId, degreeTypeId, degreeNameId, semesterId,
        facultyId: req.user._id,
        departmentId, dayOfWeek, isActive: true
      }).populate('facultyId', 'name');
    }

    // ── Fetch StudentSemesterMapping to determine which students are mapped to which subjects ──
    const mappings = await StudentSemesterMapping.find({
      sessionId, degreeTypeId, degreeNameId, semesterId, departmentId
    });

    // Build map: subjectId (timetableSlotId) → Set of studentIds explicitly mapped to it
    const subjectStudentMap = {};
    if (!isPhD) {
      classes.forEach(c => { subjectStudentMap[c._id.toString()] = new Set(); });
      mappings.forEach(m => {
        const stId = m.studentId.toString();
        m.mappedSubjects.forEach(sub => {
          const slotId = sub.timetableSlotId.toString();
          if (subjectStudentMap[slotId]) {
            subjectStudentMap[slotId].add(stId);
          }
        });
      });
    }

    // Collect all unique studentIds that are mapped to ANY subject in this timetable
    const allMappedStudentIds = new Set();
    Object.values(subjectStudentMap).forEach(set => {
      set.forEach(id => allMappedStudentIds.add(id));
    });

    // Query students: only those who are mapped via StudentSemesterMapping
    let students = [];
    if (isPhD || allMappedStudentIds.size > 0) {
      const studentQuery = { role: 'STUDENT', department: req.user.department, isActive: true };
      if (!isPhD) {
        studentQuery._id = { $in: [...allMappedStudentIds] };
        if (degreeTypeId) studentQuery['profile.degreeTypeId'] = degreeTypeId;
        if (degreeNameId) studentQuery['profile.degreeNameId'] = degreeNameId;
      } else {
        if (degreeTypeId) studentQuery['profile.degreeTypeId'] = degreeTypeId;
      }
      students = await User.find(studentQuery).select('name username profile');
    }

    // Augment classes with mapping info for the frontend
    const classesWithMapping = classes.map(c => {
      const slotId = c._id.toString();
      const mappedIds = subjectStudentMap[slotId] || new Set();
      const mappedIdsArray = [...mappedIds];
      // Compute the "student set identity" — a string that uniquely identifies this set
      const sortedIds = [...mappedIdsArray].sort().join(',');
      return {
        _id: c._id,
        subjectCode: c.subjectCode,
        subjectName: c.subjectName,
        startTime: c.startTime,
        endTime: c.endTime,
        dayOfWeek: c.dayOfWeek,
        facultyId: c.facultyId,
        mappedStudentIds: mappedIdsArray,
        mappedStudentCount: mappedIdsArray.length,
        studentSetKey: sortedIds  // used to group subjects with identical mapped student sets
      };
    });

    // Get existing records for this date to pre-fill matrix
    const records = await AttendanceRecord.find({
      departmentId,
      date: targetDate,
      sessionId
    });

    // Fetch leave requests overlapping the target date for these students
    const leaves = await LeaveRequest.find({
      studentId: { $in: students.map(s => s._id) },
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
      status: { $in: ['APPROVED', 'PENDING_SUPERVISOR', 'PENDING_HOD'] }
    });

    // Calculate lock status based on policy
    let policy = await AttendancePolicyMaster.findOne({ departmentId, programType: dt?.code || 'PG' });
    if (!policy) {
      policy = await AttendancePolicyMaster.findOne({ departmentId: null, programType: dt?.code || 'PG' });
    }
    const editLockHours = policy ? policy.editLockHours : 48;

    let isLocked = false;
    const sampleRecord = records.find(r => r.createdAt);
    if (sampleRecord) {
      const hoursSinceCreation = (new Date() - new Date(sampleRecord.createdAt)) / (1000 * 60 * 60);
      if (hoursSinceCreation > editLockHours) {
        isLocked = true;
      }
    }
    
    const matrix = students.map(st => {
      const existing = records.find(r => r.studentId.toString() === st._id.toString());
      const leave = leaves.find(l => l.studentId.toString() === st._id.toString());
      return {
        student: st,
        record: existing || null,
        leave: leave || null
      };
    });

    // Determine partial mapping info: check if all subjects share the same mapped student set
    const uniqueSetKeys = new Set(classesWithMapping.map(c => c.studentSetKey));
    const hasPartialMapping = uniqueSetKeys.size > 1;

    res.status(200).json({ 
      students: matrix, 
      classes: classesWithMapping, 
      isPhD, 
      isLocked,
      hasPartialMapping,
      totalMappedStudents: allMappedStudentIds.size
    });
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

    // Get policy lock duration
    let policy = await AttendancePolicyMaster.findOne({ departmentId, programType: dt?.code || 'PG' });
    if (!policy) {
      policy = await AttendancePolicyMaster.findOne({ departmentId: null, programType: dt?.code || 'PG' });
    }
    const editLockHours = policy ? policy.editLockHours : 48;

    // Check if dynamic lock is active (records created more than editLockHours ago)
    const existingRecords = await AttendanceRecord.find({
      departmentId,
      date: new Date(date),
      sessionId
    });
    const sampleRecord = existingRecords.find(r => r.createdAt);
    if (sampleRecord) {
      const hoursSinceCreation = (new Date() - new Date(sampleRecord.createdAt)) / (1000 * 60 * 60);
      if (hoursSinceCreation > editLockHours) {
        return res.status(400).json({ message: `Attendance register is locked. The ${editLockHours}-hour editing window has expired.` });
      }
    }

    const operations = records.map(rec => {
      const existing = existingRecords.find(er => er.studentId.toString() === rec.studentId.toString());
      if (existing && (existing.isLeaveOverride || existing.lockReason === 'Approved Leave')) {
        // Preserve approved leave overrides
        return {
          updateOne: {
            filter: { studentId: rec.studentId, date: new Date(date) },
            update: {
              $set: {
                status: 'ON_LEAVE',
                isLeaveOverride: true,
                lockReason: 'Approved Leave',
                isLocked: true
              }
            }
          }
        };
      }

      return {
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
              leaveType: rec.leaveType || '',
              leaveRequestId: rec.leaveRequestId || null,
              classes: rec.classes || [],
              markedBy: facultyId,
              markedAt: new Date()
            }
          },
          upsert: true
        }
      };
    });

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

    // Notify the supervisor (faculty/HOD) of the new leave application
    if (supervisorId) {
      await createNotification({
        recipient: supervisorId,
        title: '📋 New Leave Application',
        message: `${student.name} has applied for ${leaveType} from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()} (${totalDays} day(s)).`,
        type: 'LEAVE_APPLIED',
        link: 'leaves',
        source: 'SCHOLAR_TRACK'
      });
    }

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
    let query;
    const user = req.user;

    if (user.role === 'FACULTY' && user.subRole !== 'HOD') {
      // Faculty sees only leaves assigned to them, pending supervisor review
      query = { currentAssigneeId: user._id, status: 'PENDING_SUPERVISOR' };
    } else if (user.role === 'HOD' || user.subRole === 'HOD') {
      // HOD sees leaves forwarded by faculty, pending HOD approval — only in their department
      query = { status: 'PENDING_HOD', department: user.department };
    } else {
      // Admin/Super Admin sees all pending
      query = { status: { $in: ['PENDING_SUPERVISOR', 'PENDING_HOD'] } };
    }

    let mongoQuery = LeaveRequest.find(query)
      .populate('studentId', 'name username profile')
      .populate('currentAssigneeId', 'name')
      .sort({ createdAt: -1 });

    const leaves = await paginate(mongoQuery, req.query);

    res.status(200).json(leaves);
  } catch (error) {
    console.error('Error in getPendingLeaves:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Returns ALL leaves (any status) that have been ROUTED THROUGH the current faculty.
 * This includes:
 *   1. Leaves where currentAssigneeId = this faculty (assigned as supervisor/reviewer)
 *   2. Leaves of students mapped to this faculty via StudentSemesterMapping
 *   3. Leaves where this faculty appears in the auditLog (recommended, approved, rejected, etc.)
 * Filters by date range (mandatory) and subject (optional).
 * Query params: fromDate (YYYY-MM-DD), toDate (YYYY-MM-DD), subject (string, optional)
 */
exports.getLeaveLogs = async (req, res) => {
  try {
    const { fromDate, toDate, subject } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'Both fromDate and toDate are required (YYYY-MM-DD).' });
    }

    const from = new Date(fromDate + 'T00:00:00');
    const to = new Date(toDate + 'T23:59:59');

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    // Step 1: Find all students mapped to this faculty
    const mappings = await StudentSemesterMapping.find({ facultyId: req.user._id });
    const mappedStudentIds = [...new Set(mappings.map(m => m.studentId.toString()))];

    // Step 2: Build the date overlap filter
    const dateFilter = {
      $or: [
        { startDate: { $gte: from, $lte: to } },
        { endDate: { $gte: from, $lte: to } },
        { startDate: { $lte: from }, endDate: { $gte: to } }
      ]
    };

    // Step 3: Build the "routed through this faculty" condition
    // A leave is "routed through" the faculty if:
    //   (a) the faculty is the current assignee, OR
    //   (b) the student is mapped to this faculty, OR
    //   (c) the faculty appears in the auditLog (recommended/approved/rejected)
    const routedConditions = [
      { currentAssigneeId: req.user._id },
      { auditLog: { $elemMatch: { actorId: req.user._id } } }
    ];
    if (mappedStudentIds.length > 0) {
      routedConditions.push({ studentId: { $in: mappedStudentIds } });
    }
    const routedFilter = { $or: routedConditions };

    // Step 4: Build subject filter (optional)
    let subjectStudentIds = null;
    if (subject && subject.trim()) {
      const subjectMappings = mappings.filter(m =>
        m.mappedSubjects?.some(s =>
          s.subjectName?.toLowerCase().includes(subject.trim().toLowerCase()) ||
          s.subjectCode?.toLowerCase().includes(subject.trim().toLowerCase())
        )
      );
      if (subjectMappings.length > 0) {
        subjectStudentIds = subjectMappings.map(m => m.studentId);
      }
    }

    // Step 5: Combine everything
    let finalQuery;
    if (subject && subject.trim() && subjectStudentIds !== null) {
      // Subject filter active: show leaves for subject-mapped students, or leaves where faculty is assignee or in auditLog
      finalQuery = {
        ...dateFilter,
        $or: [
          { studentId: { $in: subjectStudentIds } },
          { currentAssigneeId: req.user._id },
          { auditLog: { $elemMatch: { actorId: req.user._id } } }
        ]
      };
    } else {
      // No subject filter: show all leaves routed through this faculty
      finalQuery = {
        ...dateFilter,
        ...routedFilter
      };
    }

    const logs = await LeaveRequest.find(finalQuery)
      .populate('studentId', 'name username profile')
      .populate('currentAssigneeId', 'name')
      .sort({ createdAt: -1 });

    // Step 6: Enrich with subject info for each log entry
    const enrichedLogs = logs.map(log => {
      const studentIdStr = log.studentId?._id?.toString() || log.studentId?.toString();
      const studentMappings = mappings.filter(m => m.studentId.toString() === studentIdStr);
      const subjects = studentMappings.flatMap(m =>
        (m.mappedSubjects || []).map(s => ({
          subjectName: s.subjectName || 'N/A',
          subjectCode: s.subjectCode || ''
        }))
      );
      const uniqueSubjects = [...new Map(subjects.map(s => [s.subjectName, s])).values()];
      return {
        ...log.toObject(),
        subjects: uniqueSubjects
      };
    });

    res.status(200).json(enrichedLogs);
  } catch (error) {
    console.error('Error in getLeaveLogs:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.actionLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body;
    const actor = req.user;
    const isHOD = actor.role === 'HOD' || actor.subRole === 'HOD';

    const leave = await LeaveRequest.findById(id).populate('studentId');
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    if (!remarks || remarks.trim().length < 5) {
      return res.status(400).json({ message: 'Please provide remarks (at least 5 characters).' });
    }

    if (action === 'RECOMMEND') {
      if (isHOD) {
        return res.status(400).json({ message: 'HOD cannot recommend. Use Approve or Reject.' });
      }
      if (leave.status !== 'PENDING_SUPERVISOR') {
        return res.status(400).json({ message: 'This leave has already been processed.' });
      }
      if (leave.currentAssigneeId?.toString() !== actor._id.toString()) {
        return res.status(403).json({ message: 'This leave is not assigned to you.' });
      }

      const hod = await User.findOne({
        $or: [
          { role: 'HOD' },
          { role: 'FACULTY', subRole: 'HOD' }
        ],
        department: leave.studentId?.department || leave.department,
        isActive: true
      });

      leave.status = 'PENDING_HOD';
      leave.currentAssigneeId = hod?._id || null;
      leave.auditLog.push({
        action: 'RECOMMENDED',
        actorId: actor._id,
        actorName: actor.name,
        remarks
      });

      // Notify HOD that leave has been forwarded
      if (hod) {
        await createNotification({
          recipient: hod._id,
          title: '📋 Leave Forwarded by Faculty',
          message: `Prof. ${actor.name} has recommended ${leave.studentId?.name || 'a student'}'s ${leave.leaveType} leave for HOD approval.`,
          type: 'LEAVE_APPLIED',
          link: 'approvals',
          source: 'SCHOLAR_TRACK'
        });
      }

      // Notify student that leave is forwarded to HOD
      await createNotification({
        recipient: leave.studentId._id,
        title: '📋 Leave Forwarded',
        message: `Your ${leave.leaveType} leave application has been forwarded to the HOD for final approval.`,
        type: 'LEAVE_STATUS',
        link: 'leave',
        source: 'SCHOLAR_TRACK'
      });

    } else if (action === 'APPROVE') {
      if (!isHOD) {
        return res.status(400).json({ message: 'Only HOD can approve leaves. Use Recommend to forward.' });
      }
      if (leave.status !== 'PENDING_HOD') {
        return res.status(400).json({ message: 'This leave is not pending HOD approval.' });
      }
      leave.status = 'APPROVED';
      leave.currentAssigneeId = null;
      leave.auditLog.push({
        action: 'APPROVED',
        actorId: actor._id,
        actorName: actor.name,
        remarks
      });

      // Notify student that leave is approved
      await createNotification({
        recipient: leave.studentId._id,
        title: '✅ Leave Approved',
        message: `Your ${leave.leaveType} leave from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been approved.`,
        type: 'LEAVE_STATUS',
        link: 'leave',
        source: 'SCHOLAR_TRACK'
      });

      // Create/upsert attendance records for approved leave period
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
      if (leave.status === 'PENDING_SUPERVISOR' && leave.currentAssigneeId?.toString() !== actor._id.toString()) {
        return res.status(403).json({ message: 'This leave is not assigned to you.' });
      }
      if (leave.status !== 'PENDING_SUPERVISOR' && leave.status !== 'PENDING_HOD') {
        return res.status(400).json({ message: 'This leave cannot be rejected in its current state.' });
      }
      leave.status = 'REJECTED';
      leave.currentAssigneeId = null;
      leave.auditLog.push({
        action: 'REJECTED',
        actorId: actor._id,
        actorName: actor.name,
        remarks
      });

      // Notify student that leave is rejected
      await createNotification({
        recipient: leave.studentId._id,
        title: '❌ Leave Rejected',
        message: `Your ${leave.leaveType} leave application has been rejected. Remarks: ${remarks}`,
        type: 'LEAVE_STATUS',
        link: 'leave',
        source: 'SCHOLAR_TRACK'
      });

      // Retroactively mark attendance records as ABSENT for the rejected leave period
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const rejectOperations = [];
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        rejectOperations.push({
          updateOne: {
            filter: { studentId: leave.studentId._id, date: new Date(dt), leaveRequestId: leave._id },
            update: {
              $set: {
                status: 'ABSENT',
                isLeaveOverride: false,
                leaveRequestId: null,
                leaveType: '',
                lockReason: '',
                isLocked: false,
                lastEditedBy: actor._id,
                lastEditedAt: new Date()
              }
            }
          }
        });
      }
      if (rejectOperations.length > 0) await AttendanceRecord.bulkWrite(rejectOperations);
    } else {
      return res.status(400).json({ message: 'Invalid action. Use RECOMMEND, APPROVE, or REJECT.' });
    }

    await leave.save();
    res.status(200).json({ message: `Leave ${action.toLowerCase()}ed successfully.`, leave });
  } catch (error) {
    console.error('Error in actionLeave:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 7. CORRECTION WORKFLOWS
// ==========================================

// Get student's absences with correction eligibility info
exports.getMyAbsences = async (req, res) => {
  try {
    const records = await AttendanceRecord.find({
      studentId: req.user._id,
      status: 'ABSENT'
    })
    .populate('classes.timetableSlotId')
    .sort({ date: -1 });

    // Get all existing corrections by this student
    const corrections = await AttendanceCorrection.find({
      studentId: req.user._id
    });

    // Build a map: date + timetableSlotId → correction info
    // key = `${dateStr}_${slotId}`
    const correctionMap = {};
    corrections.forEach(c => {
      const dateStr = c.createdAt ? 'override' : '';
      (c.timetableSlotIds || []).forEach(slotId => {
        // We need the date from the record, not correction
      });
    });

    // Instead, let's build this from the corrections referencing recordIds
    const recordCorrectionMap = {};
    corrections.forEach(c => {
      const rid = c.recordId?.toString() || '';
      (c.timetableSlotIds || []).forEach(slotId => {
        const key = `${rid}_${slotId.toString()}`;
        if (!recordCorrectionMap[key]) {
          recordCorrectionMap[key] = { attempts: 0, latestStatus: null };
        }
        recordCorrectionMap[key].attempts = Math.max(
          recordCorrectionMap[key].attempts,
          c.correctionAttempt || 1
        );
        // Track the latest status for this subject
        if (c.status === 'APPROVED' || c.status === 'REJECTED' || 
            c.status === 'PENDING_FACULTY' || c.status === 'PENDING_HOD') {
          recordCorrectionMap[key].latestStatus = c.status;
        }
      });
    });

    // Group absent subjects by date
    const dateMap = {};
    records.forEach(record => {
      const dateStr = new Date(record.date).toISOString().split('T')[0];
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = {
          date: record.date,
          recordId: record._id,
          absentSubjects: [],
          hasAvailableSubjects: false
        };
      }

      // Find classes where student was absent (selected: false or no class record with selected)
      const absentClasses = (record.classes || []).filter(c => {
        // Class is "selected" means it was marked (attendance was taken for it)
        // Student is absent for this subject if selected is false
        // Actually in the attendance system, classes array stores which subjects were selected
        // If a subject's class has selected: true, it was part of the attendance marking
        // Absent means the status was marked ABSENT for this subject
        
        // Simplifying: if the record status is ABSENT and this class entry exists
        // with selected: true, then student was marked absent for this subject
        return c.selected === true;
      }).map(c => ({
        timetableSlotId: c.timetableSlotId?._id || c.timetableSlotId,
        subjectName: c.subjectName || c.timetableSlotId?.subjectName || 'Unknown',
        subjectCode: c.timetableSlotId?.subjectCode || ''
      }));

      // Also include any subjects where the class entry has timetableSlotId populated
      // but selection state was false (meaning it was an unmarked subject)
      // Actually let me re-read: In AttendanceRecord, classes array stores:
      // [{timetableSlotId, subjectName, selected}] where selected=true means faculty decided
      // to take attendance for this subject
      
      // The logic: If a student was marked ABSENT for a record, but we need to know
      // which SPECIFIC subjects they were absent for. The classes array tells us which
      // subjects were taught and their selection state.

      // Actually the simplest approach: if the record.status is 'ABSENT' and a class entry
      // has selected:true, that means the student was marked for that subject with ABSENT status

      dateMap[dateStr].absentSubjects.push(...absentClasses);
    });

    // Now filter each date: remove subjects that have been corrected (APPROVED)
    // or have maxed out on attempts
    Object.values(dateMap).forEach(dateEntry => {
      const recordId = dateEntry.recordId.toString();
      
      dateEntry.absentSubjects = dateEntry.absentSubjects.filter(sub => {
        const slotId = sub.timetableSlotId?.toString() || '';
        const key = `${recordId}_${slotId}`;
        const info = recordCorrectionMap[key];
        
        if (!info) {
          // No correction ever made for this subject
          sub.eligible = true;
          sub.correctionAttempts = 0;
          sub.latestStatus = null;
          return true;
        }
        
        sub.correctionAttempts = info.attempts;
        sub.latestStatus = info.latestStatus;

        // Don't show if APPROVED (already corrected)
        if (info.latestStatus === 'APPROVED') {
          sub.eligible = false;
          return false; // Remove from available list
        }
        
        // Show if PENDING or REJECTED (can be corrected again if under max)
        if (info.attempts >= 2) {
          // Max 2 attempts reached - still show but mark as locked
          sub.eligible = false;
          sub.locked = true;
          return true; // Show but with lock icon
        }
        
        // Still eligible
        sub.eligible = true;
        return true;
      });

      dateEntry.hasAvailableSubjects = dateEntry.absentSubjects.some(s => s.eligible);
    });

    // Only return dates that have at least one subject to show
    const result = Object.values(dateMap).filter(d => d.absentSubjects.length > 0);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student applies for a correction
exports.applyCorrection = async (req, res) => {
  try {
    const { recordId, timetableSlotIds = [], correctionType, leaveType, reason, documentUrl } = req.body;
    
    if (!recordId) {
      return res.status(400).json({ message: 'Record reference is required.' });
    }
    if (!timetableSlotIds || timetableSlotIds.length === 0) {
      return res.status(400).json({ message: 'Please select at least one subject to correct.' });
    }
    if (!correctionType || !['PRESENT', 'ON_LEAVE'].includes(correctionType)) {
      return res.status(400).json({ message: 'Please select a valid correction type (Present or On Leave).' });
    }
    if (correctionType === 'ON_LEAVE' && !leaveType) {
      return res.status(400).json({ message: 'Please specify the leave type for your correction request.' });
    }
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ message: 'Please provide a reason (at least 10 characters).' });
    }

    const record = await AttendanceRecord.findById(recordId);
    if (!record || record.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You cannot request correction for this record.' });
    }

    // Check existing corrections for these subjects
    const existingCorrections = await AttendanceCorrection.find({
      studentId: req.user._id,
      recordId,
      timetableSlotIds: { $in: timetableSlotIds }
    }).sort({ createdAt: -1 });

    // Group existing corrections by timetableSlotId to check per-subject limits
    const maxAttemptsReached = [];
    const justRejectedSubjects = [];
    
    timetableSlotIds.forEach(slotId => {
      const subjectCorrections = existingCorrections.filter(c => 
        (c.timetableSlotIds || []).some(s => s.toString() === slotId)
      );
      
      // Check if any correction is already APPROVED for this subject
      const approvedCorrection = subjectCorrections.find(c => c.status === 'APPROVED');
      if (approvedCorrection) {
        maxAttemptsReached.push(slotId);
        return;
      }

      // Count total attempts (approved + rejected)
      const totalAttempts = subjectCorrections.length;
      if (totalAttempts >= 2) {
        maxAttemptsReached.push(slotId);
        return;
      }

      // Check if the last correction for this subject was REJECTED
      const lastCorrection = subjectCorrections[subjectCorrections.length - 1];
      if (lastCorrection && lastCorrection.status === 'REJECTED') {
        justRejectedSubjects.push({
          slotId,
          attemptsSoFar: totalAttempts,
          isLastAttempt: totalAttempts + 1 >= 2
        });
      }
    });

    // If any subject has reached max attempts, block the entire request
    if (maxAttemptsReached.length > 0) {
      return res.status(400).json({
        message: 'One or more selected subjects have already reached the maximum correction attempts (2). These subjects cannot be corrected again.',
        blockedSubjects: maxAttemptsReached
      });
    }

    // Calculate the attempt number for this new correction
    const maxAttempt = existingCorrections.reduce((max, c) => Math.max(max, c.correctionAttempt || 0), 0);
    const thisAttempt = maxAttempt + 1;
    const isLastChance = thisAttempt >= 2;

    const correction = await AttendanceCorrection.create({
      studentId: req.user._id,
      recordId,
      timetableSlotIds,
      correctionType,
      leaveType: correctionType === 'ON_LEAVE' ? leaveType : '',
      reason,
      documentUrl: documentUrl || '',
      status: 'PENDING_FACULTY',
      facultyId: record.facultyId,
      correctionAttempt: thisAttempt,
      auditLog: [{
        action: 'SUBMITTED',
        actorId: req.user._id,
        actorName: req.user.name,
        remarks: `Correction request submitted for ${timetableSlotIds.length} subject(s). Attempt #${thisAttempt}`
      }]
    });

    // Notify the faculty of the new correction request
    if (record?.facultyId) {
      await createNotification({
        recipient: record.facultyId,
        title: '📋 New Attendance Correction Request',
        message: `${req.user.name} has requested correction for ${timetableSlotIds.length} subject(s) on ${new Date(record.date).toLocaleDateString()}. Attempt #${thisAttempt}.`,
        type: 'CORRECTION_APPLIED',
        link: 'corrections',
        source: 'SCHOLAR_TRACK'
      });
    }

    // If this is the last chance, return a warning message
    const responseMsg = isLastChance
      ? 'Correction request submitted. This is your final attempt for these subjects. You will not be able to request correction again for the selected subjects and date after this.'
      : 'Correction request submitted successfully. It will be reviewed by the faculty.';

    res.status(201).json({
      correction,
      message: responseMsg,
      isLastChance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student's own correction requests
exports.getMyCorrections = async (req, res) => {
  try {
    const corrections = await AttendanceCorrection.find({ studentId: req.user._id })
      .populate('recordId')
      .populate('facultyId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json(corrections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending corrections for faculty/HOD
exports.getPendingCorrections = async (req, res) => {
  try {
    let query;
    if (req.user.role === 'FACULTY' || req.user.subRole === 'FACULTY') {
      // Faculty sees corrections pending their review
      query = { facultyId: req.user._id, status: 'PENDING_FACULTY' };
    } else {
      // HOD sees corrections forwarded by faculty
      query = { status: 'PENDING_HOD' };
    }
    
    let mongoQuery = AttendanceCorrection.find(query)
      .populate('studentId', 'name username profile')
      .populate('recordId')
      .populate('facultyId', 'name')
      .sort({ createdAt: -1 });

    const corrections = await paginate(mongoQuery, req.query);
    
    res.status(200).json(corrections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Faculty/HOD action on a correction
exports.actionCorrection = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body;
    const actor = req.user;
    const isHOD = actor.role === 'HOD' || actor.subRole === 'HOD';

    const correction = await AttendanceCorrection.findById(id).populate('recordId');
    if (!correction) {
      return res.status(404).json({ message: 'Correction request not found.' });
    }

    if (action === 'RECOMMEND') {
      // Faculty recommends sending to HOD
      if (isHOD) {
        return res.status(400).json({ message: 'HOD cannot recommend. Use Approve or Reject.' });
      }
      if (correction.status !== 'PENDING_FACULTY') {
        return res.status(400).json({ message: 'This correction has already been processed.' });
      }
      if (!remarks || remarks.trim().length < 5) {
        return res.status(400).json({ message: 'Please provide remarks (at least 5 characters) before recommending to HOD.' });
      }
      correction.status = 'PENDING_HOD';
      correction.facultyRemarks = remarks;
      correction.auditLog.push({
        action: 'RECOMMENDED',
        actorId: actor._id,
        actorName: actor.name,
        remarks
      });

      // Notify HOD that correction has been forwarded
      const hod = await User.findOne({
        $or: [{ role: 'HOD' }, { role: 'FACULTY', subRole: 'HOD' }],
        department: correction.studentId?.department || req.user.department,
        isActive: true
      });
      if (hod) {
        await createNotification({
          recipient: hod._id,
          title: '📋 Correction Forwarded by Faculty',
          message: `Prof. ${actor.name} has recommended ${correction.studentId?.name || 'a student'}'s attendance correction for HOD approval.`,
          type: 'CORRECTION_APPLIED',
          link: 'approvals',
          source: 'SCHOLAR_TRACK'
        });
      }

      // Notify student that correction is forwarded to HOD
      await createNotification({
        recipient: correction.studentId,
        title: '📋 Correction Forwarded',
        message: `Your attendance correction request has been forwarded to the HOD for final approval.`,
        type: 'CORRECTION_STATUS',
        link: 'corrections',
        source: 'SCHOLAR_TRACK'
      });

    } else if (action === 'APPROVE') {
      // Only HOD can finally approve
      if (!isHOD) {
        return res.status(400).json({ message: 'Faculty cannot approve corrections directly. Use Recommend to send to HOD.' });
      }
      if (correction.status !== 'PENDING_HOD') {
        return res.status(400).json({ message: 'This correction is not pending HOD approval.' });
      }
      if (!remarks || remarks.trim().length < 5) {
        return res.status(400).json({ message: 'Please provide remarks (at least 5 characters) for approval.' });
      }

      // Update the attendance record's classes for the corrected subjects
      const record = await AttendanceRecord.findById(correction.recordId);
      if (record) {
        const correctedSlotIds = (correction.timetableSlotIds || []).map(id => id.toString());
        
        // Update the specific subjects in the classes array
        record.classes = record.classes.map(cls => {
          const slotId = cls.timetableSlotId?.toString() || '';
          if (correctedSlotIds.includes(slotId)) {
            return {
              ...cls.toObject(),
              selected: correction.correctionType === 'PRESENT' ? true : false,
              correctionStatus: correction.correctionType === 'PRESENT' ? 'PRESENT' : 'ON_LEAVE',
              correctionApproved: true,
              leaveType: correction.correctionType === 'ON_LEAVE' ? correction.leaveType : ''
            };
          }
          return cls;
        });

        // If ALL subjects in the record are now corrected, update the overall status
        const allClassesCorrected = record.classes.every(cls => cls.correctionApproved);
        if (allClassesCorrected) {
          record.status = correction.correctionType;
          if (correction.correctionType === 'ON_LEAVE') {
            record.leaveType = correction.leaveType;
          }
        }
        
        record.isLocked = true;
        record.lockReason = 'Correction Approved';
        record.correctionRequestId = correction._id;
        await record.save();
      }

      correction.hodRemarks = remarks;
      correction.status = 'APPROVED';
      correction.auditLog.push({
        action: 'APPROVED',
        actorId: actor._id,
        actorName: actor.name,
        remarks
      });

      // Notify student that correction is approved
      await createNotification({
        recipient: correction.studentId,
        title: '✅ Correction Approved',
        message: `Your attendance correction request for ${correction.correctionType} has been approved.`,
        type: 'CORRECTION_STATUS',
        link: 'corrections',
        source: 'SCHOLAR_TRACK'
      });

    } else if (action === 'REJECT') {
      if (!remarks || remarks.trim().length < 5) {
        return res.status(400).json({ message: 'Please provide remarks (at least 5 characters) explaining the rejection.' });
      }
      
      if (correction.status === 'PENDING_FACULTY' || correction.status === 'PENDING_HOD') {
        correction.status = 'REJECTED';
        if (isHOD) {
          correction.hodRemarks = remarks;
        } else {
          correction.facultyRemarks = remarks;
        }
        correction.auditLog.push({
          action: 'REJECTED',
          actorId: actor._id,
          actorName: actor.name,
          remarks
        });
      } else {
        return res.status(400).json({ message: 'This correction cannot be rejected in its current state.' });
      }

      // Notify student that correction is rejected
      await createNotification({
        recipient: correction.studentId,
        title: '❌ Correction Rejected',
        message: `Your attendance correction request has been rejected. Remarks: ${remarks}`,
        type: 'CORRECTION_STATUS',
        link: 'corrections',
        source: 'SCHOLAR_TRACK'
      });
    } else {
      return res.status(400).json({ message: 'Invalid action. Use RECOMMEND, APPROVE, or REJECT.' });
    }

    await correction.save();
    res.status(200).json(correction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
exports.updateHoliday = async (req, res) => {
  try {
    const { title, startDate, endDate, isRecurring, isActive } = req.body;
    const data = await HolidayCalendar.findById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Holiday not found' });
    if (title) data.title = title;
    if (startDate) data.startDate = startDate;
    if (endDate) data.endDate = endDate;
    if (isRecurring !== undefined) data.isRecurring = isRecurring;
    if (isActive !== undefined) data.isActive = isActive;
    await data.save();
    res.status(200).json(data);
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
    const facultyId = req.user._id;
    const deptId = req.user.department;

    // 1. All timetable courses for this faculty
    const courses = await TimetableMaster.find({ facultyId, isActive: true })
      .populate('degreeNameId', 'name')
      .populate('semesterId', 'name');

    // 2. Next week's classes — compute dates for next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const nextWeekClasses = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = dayNames[d.getDay()];
      if (dayName === 'Sunday') continue; // Skip Sunday — no academic classes
      const dateStr = toLocalDateString(d);
      const dayCourses = courses.filter(c => c.dayOfWeek === dayName);
      for (const c of dayCourses) {
        nextWeekClasses.push({
          _id: c._id,
          date: dateStr,
          dayOfWeek: dayName,
          subjectName: c.subjectName,
          subjectCode: c.subjectCode,
          startTime: c.startTime,
          endTime: c.endTime,
          degreeNameId: c.degreeNameId,
          semesterId: c.semesterId,
        });
      }
    }
    // Sort by date then start time
    nextWeekClasses.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    // 3. Pending leaves count (assigned to this faculty)
    const pendingLeavesCount = await LeaveRequest.countDocuments({ currentAssigneeId: facultyId, status: { $in: ['PENDING_FACULTY', 'PENDING'] } });

    // 4. Pending corrections count (assigned to this faculty)
    const pendingCorrectionsCount = await AttendanceCorrection.countDocuments({ facultyId, status: 'PENDING_FACULTY' });

    // 5. Low-attendance students — NOT computed here (lazy-loaded on "View List" click)
    // This avoids N+1 queries on every dashboard load
    const lowAttendanceCount = 0;

    // 6. Today's classes
    const todayDayName = dayNames[today.getDay()];
    const todayStr = toLocalDateString(today);
    const todayClasses = courses
      .filter(c => c.dayOfWeek === todayDayName)
      .map(c => ({
        _id: c._id,
        subjectName: c.subjectName,
        subjectCode: c.subjectCode,
        startTime: c.startTime,
        endTime: c.endTime,
        degreeNameId: c.degreeNameId,
        semesterId: c.semesterId,
      }));

    // Get today's marked attendance for this faculty
    const markedToday = await AttendanceRecord.find({
      facultyId,
      date: todayStr,
    }).select('timetableSlotId');

    const scholarsCount = await User.countDocuments({ department: deptId, role: 'STUDENT', isActive: true });

    res.status(200).json({
      sessionName: session?.sessionName || 'No Active Session',
      coursesScheduled: courses.length,
      managedScholars: scholarsCount,
      todayClasses,
      markedToday: markedToday.map(m => ({ timetableSlotId: m.timetableSlotId })),
      nextWeekClasses,
      pendingLeavesCount,
      pendingCorrectionsCount,
      lowAttendanceCount,
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// Lazy-load endpoint: detailed list of low-attendance students for this faculty's department
exports.getFacultyLowAttendanceStudents = async (req, res) => {
  try {
    const session = await AcademicSessionMaster.findOne({ isCurrent: true });
    const deptId = req.user.department;

    if (!session) {
      return res.status(200).json([]);
    }

    // Fetch all department students
    const students = await User.find({ department: deptId, role: 'STUDENT', isActive: true })
      .select('name profile email username department');

    if (students.length === 0) {
      return res.status(200).json([]);
    }

    const studentIds = students.map(s => s._id);

    // Batch fetch: all attendance records for all students in this session
    const allRecords = await AttendanceRecord.find({
      studentId: { $in: studentIds },
      date: { $gte: session.startDate, $lte: session.endDate }
    }).select('studentId date status classes isLeaveOverride timetableSlotId');

    // Group records by studentId
    const recordsByStudent = {};
    for (const rec of allRecords) {
      const sid = rec.studentId.toString();
      if (!recordsByStudent[sid]) recordsByStudent[sid] = [];
      recordsByStudent[sid].push(rec);
    }

    // Batch fetch: all degree types
    const degreeTypeIds = [...new Set(students.map(s => s.profile?.degreeTypeId).filter(Boolean))];
    const degreeTypes = degreeTypeIds.length > 0
      ? await DegreeTypeMaster.find({ _id: { $in: degreeTypeIds } }).select('code')
      : [];
    const degreeTypeMap = {};
    for (const dt of degreeTypes) degreeTypeMap[dt._id.toString()] = dt.code;

    // Batch fetch: all active timetables
    const allTimetables = await TimetableMaster.find({ isActive: true })
      .select('sessionId semesterId dayOfWeek');

    // Batch fetch: holidays
    const holidays = await HolidayCalendar.find({ isActive: true });

    const studentSemesterMap = {};
    for (const s of students) {
      studentSemesterMap[s._id.toString()] = s.profile?.semesterId?.toString() || null;
    }

    const studentStatsList = [];

    for (const student of students) {
      const sid = student._id.toString();
      const records = recordsByStudent[sid] || [];
      const degreeCode = student.profile?.degreeTypeId ? degreeTypeMap[student.profile.degreeTypeId.toString()] : null;
      const isPhD = degreeCode === 'PHD';

      // Get timetables for this student's semester
      const timetables = !isPhD ? allTimetables.filter(t =>
        t.sessionId?.toString() === session._id.toString() &&
        (!t.semesterId || t.semesterId.toString() === studentSemesterMap[sid])
      ) : [];

      const stats = await calculateStudentStats(student, session, records, holidays, timetables);

      if (stats.isDefaulter) {
        studentStatsList.push({
          studentId: student._id,
          name: student.name,
          enrollmentNumber: student.profile?.enrollmentNumber || 'N/A',
          email: student.profile?.email || student.username,
          percentage: stats.percentage,
          minRequiredPercentage: stats.minRequiredPercentage,
        });
      }
    }

    res.status(200).json(studentStatsList);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getHodDashboardStats = async (req, res) => {
  try {
    const session = await AcademicSessionMaster.findOne({ isCurrent: true });
    if (!session) {
      return res.status(200).json({
        sessionName: 'No Active Session',
        totalStudentsCount: 0,
        averageDeptPercentage: 100,
        defaulterCount: 0,
        warningCount: 0,
        defaulters: [],
        warnings: [],
        rosterStats: [],
        auditLogs: []
      });
    }
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
    const [
      departmentsCount,
      activeSessionsCount,
      totalStudents,
      totalPolicies,
      totalFacultyCount,
      totalHodCount,
      totalScholarsCount
    ] = await Promise.all([
      Department.countDocuments(),
      AcademicSessionMaster.countDocuments({ isCurrent: true }),
      User.countDocuments({ role: 'STUDENT', isActive: true }),
      AttendancePolicyMaster.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'FACULTY', subRole: { $ne: 'HOD' } }),
      User.countDocuments({ $or: [{ role: 'HOD' }, { role: 'FACULTY', subRole: 'HOD' }] }),
      User.countDocuments({ role: 'STUDENT' })
    ]);

    res.status(200).json({ 
      departmentsCount, 
      activeSessionsCount, 
      totalStudents, 
      totalPolicies, 
      syncStats: {
        faculty: totalFacultyCount,
        hods: totalHodCount,
        scholars: totalScholarsCount
      }
    });
  } catch (error) { 
    console.error("Error in getSuperAdminDashboardStats:", error);
    res.status(500).json({ message: error.message }); 
  }
};

exports.getMyAbsences = async (req, res) => {
  try {
    const records = await AttendanceRecord.find({
      studentId: req.user._id,
      status: 'ABSENT'
    })
    .populate('timetableId')
    .populate('classes.timetableSlotId')
    .sort({ date: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMarkedAttendance = async (req, res) => {
  try {
    const { sessionId, timetableSlotId, date } = req.query;
    const departmentId = req.user.departmentId;
    const targetDate = new Date(date);

    const records = await AttendanceRecord.find({
      departmentId,
      date: targetDate,
      sessionId,
      classes: {
        $elemMatch: {
          timetableSlotId,
          selected: true
        }
      }
    }).populate('studentId', 'name username profile');

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAttendanceEntry = async (req, res) => {
  try {
    const { studentId, date, timetableSlotId } = req.body;
    const departmentId = req.user.departmentId;
    const targetDate = new Date(date);

    const record = await AttendanceRecord.findOne({
      studentId,
      date: targetDate,
      departmentId
    });

    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    // Update the specific class selection to false
    record.classes = record.classes.map(c => {
      if (c.timetableSlotId.toString() === timetableSlotId.toString()) {
        c.selected = false;
      }
      return c;
    });

    // Check if any class is still selected
    const hasSelectedClasses = record.classes.some(c => c.selected);

    if (!hasSelectedClasses) {
      // Delete the entire record if no classes are active
      await AttendanceRecord.deleteOne({ _id: record._id });
      return res.status(200).json({ message: 'Record deleted completely.', deleted: true });
    } else {
      await record.save();
      return res.status(200).json({ message: 'Class attendance deleted.', deleted: false });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// CATEGORY & GENDER MASTER (SUPER ADMIN)
// ==========================================

exports.getCategoryGenderMasters = async (req, res) => {
  try {
    const { type } = req.query;
    const query = { isActive: true };
    if (type) query.type = type.toUpperCase();
    const data = await CategoryGenderMaster.find(query).sort({ type: 1, sortOrder: 1, label: 1 });
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createCategoryGenderMaster = async (req, res) => {
  try {
    const { type, label, value, sortOrder } = req.body;
    if (!type || !label || !value) {
      return res.status(400).json({ message: 'Type, label, and value are required' });
    }
    const data = await CategoryGenderMaster.create({
      type: type.toUpperCase(),
      label,
      value,
      sortOrder: sortOrder || 0
    });
    res.status(201).json(data);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This value already exists for the selected type' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.updateCategoryGenderMaster = async (req, res) => {
  try {
    const { label, value, sortOrder, isActive } = req.body;
    const data = await CategoryGenderMaster.findById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Record not found' });
    if (label) data.label = label;
    if (value) data.value = value;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (isActive !== undefined) data.isActive = isActive;
    await data.save();
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteCategoryGenderMaster = async (req, res) => {
  try {
    const data = await CategoryGenderMaster.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!data) return res.status(404).json({ message: 'Record not found' });
    res.status(200).json({ message: 'Deleted successfully', data });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
