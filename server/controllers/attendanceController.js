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

const { calculateStudentStats, getTimetableLectures } = require('../utils/attendanceCalculator');
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
    const query = { isActive: true };
    if (req.user && (req.user.role === 'FACULTY' || req.user.role === 'HOD') && req.user.departmentId) {
      const deptDegreeNames = await DegreeNameMaster.find({ departmentId: req.user.departmentId, isActive: true });
      const degreeTypeIds = deptDegreeNames.map(dn => dn.degreeTypeId).filter(Boolean);
      query._id = { $in: degreeTypeIds };
    }
    const data = await DegreeTypeMaster.find(query);
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createDegreeType = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ message: 'Name and Code are required' });
    }
    const duplicate = await DegreeTypeMaster.findOne({
      $or: [
        { name: name.trim() },
        { code: code.trim().toUpperCase() }
      ]
    });
    if (duplicate) {
      return res.status(400).json({ message: 'Degree Type Name or Code already exists' });
    }
    const data = await DegreeTypeMaster.create({
      name: name.trim(),
      code: code.trim().toUpperCase()
    });
    res.status(201).json(data);
  } catch (error) {
    if (error.code === 11000) {
      let dupMessage = 'A duplicate entry already exists in the database.';
      if (error.keyValue) {
        const fields = Object.keys(error.keyValue);
        dupMessage = `Duplicate entry detected: ${fields.join(', ')} '${error.keyValue[fields[0]]}' already exists.`;
      }
      return res.status(409).json({ message: dupMessage });
    }
    res.status(500).json({ message: error.message });
  }
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
  } catch (error) {
    if (error.code === 11000) {
      let dupMessage = 'A duplicate entry already exists in the database.';
      if (error.keyValue) {
        const fields = Object.keys(error.keyValue);
        dupMessage = `Duplicate entry detected: ${fields.join(', ')} '${error.keyValue[fields[0]]}' already exists.`;
      }
      return res.status(409).json({ message: dupMessage });
    }
    res.status(500).json({ message: error.message });
  }
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
  } catch (error) {
    if (error.code === 11000) {
      let dupMessage = 'A duplicate entry already exists in the database.';
      if (error.keyValue) {
        const fields = Object.keys(error.keyValue);
        dupMessage = `Duplicate entry detected: ${fields.join(', ')} '${error.keyValue[fields[0]]}' already exists.`;
      }
      return res.status(409).json({ message: dupMessage });
    }
    res.status(500).json({ message: error.message });
  }
};
exports.deleteDegreeName = async (req, res) => {
  try {
    const data = await DegreeNameMaster.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    res.status(200).json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getSemesters = async (req, res) => {
  try {
    const query = { isActive: true };
    if (req.user && (req.user.role === 'FACULTY' || req.user.role === 'HOD') && req.user.departmentId) {
      const deptDegreeNames = await DegreeNameMaster.find({ departmentId: req.user.departmentId, isActive: true });
      const degreeNameIds = deptDegreeNames.map(dn => dn._id);
      const mappings = await SemesterDegreeMapping.find({ degreeNameId: { $in: degreeNameIds }, isActive: true });
      const semesterIds = mappings.map(m => m.semesterId).filter(Boolean);
      query._id = { $in: semesterIds };
    }
    const data = await SemesterMaster.find(query).sort({ number: 1 });
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
    const query = { isActive: true };
    if (req.user && (req.user.role === 'FACULTY' || req.user.role === 'HOD') && req.user.departmentId) {
      const deptDegreeNames = await DegreeNameMaster.find({ departmentId: req.user.departmentId, isActive: true });
      const degreeNameIds = deptDegreeNames.map(dn => dn._id);
      query.degreeNameId = { $in: degreeNameIds };
    }
    const data = await SemesterDegreeMapping.find(query)
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
    const { _id, programType, minRequiredPercentage, warningThreshold, maxCondonationPercentage, editLockHours, allowHalfDay, allowMedicalLeave, allowDutyLeave, allowCorrection, correctionWindowDays } = req.body;
    const departmentId = req.user.role === 'SUPER_ADMIN' ? null : req.user.departmentId;
    
    // Check if another active policy exists for the same program type
    const existingActivePolicy = await AttendancePolicyMaster.findOne({
      departmentId,
      programType,
      isActive: true,
      ...(_id ? { _id: { $ne: _id } } : {})
    });
    
    if (existingActivePolicy) {
      return res.status(400).json({ message: `A policy configuration for program type '${programType}' already exists.` });
    }

    let policy;
    if (_id) {
      policy = await AttendancePolicyMaster.findById(_id);
      if (policy) {
        Object.assign(policy, { minRequiredPercentage, warningThreshold, maxCondonationPercentage, editLockHours, allowHalfDay, allowMedicalLeave, allowDutyLeave, allowCorrection, correctionWindowDays, isActive: true });
        await policy.save();
      }
    } else {
      policy = await AttendancePolicyMaster.findOne({ departmentId, programType });
      if (policy) {
        Object.assign(policy, { minRequiredPercentage, warningThreshold, maxCondonationPercentage, editLockHours, allowHalfDay, allowMedicalLeave, allowDutyLeave, allowCorrection, correctionWindowDays, isActive: true });
        await policy.save();
      } else {
        policy = await AttendancePolicyMaster.create({ departmentId, programType, minRequiredPercentage, warningThreshold, maxCondonationPercentage, editLockHours, allowHalfDay, allowMedicalLeave, allowDutyLeave, allowCorrection, correctionWindowDays });
      }
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
exports.updateLeaveType = async (req, res) => {
  try {
    const data = await LeaveTypeMaster.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ message: 'Leave type not found' });
    res.status(200).json(data);
  } catch (error) {
    if (error.code === 11000) {
      let dupMessage = 'A duplicate entry already exists in the database.';
      if (error.keyValue) {
        const fields = Object.keys(error.keyValue);
        dupMessage = `Duplicate entry detected: ${fields.join(', ')} '${error.keyValue[fields[0]]}' already exists.`;
      }
      return res.status(409).json({ message: dupMessage });
    }
    res.status(500).json({ message: error.message });
  }
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
      endTime: s.endTime,
      totalClassesInSemester: s.totalClassesInSemester || 90
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
    
    // Check if targetDate falls on a holiday
    const holiday = await HolidayCalendar.findOne({
      isActive: true,
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
      $or: [{ departmentId }, { departmentId: null }]
    });
    if (holiday) {
      return res.status(400).json({ message: `Cannot mark attendance. Selected date falls on a holiday: ${holiday.title}.` });
    }

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
    
    const targetDate = new Date(date);
    const holiday = await HolidayCalendar.findOne({
      isActive: true,
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
      $or: [{ departmentId }, { departmentId: null }]
    });
    if (holiday) {
      return res.status(400).json({ message: `Cannot save attendance. Selected date falls on a holiday: ${holiday.title}.` });
    }

    const dt = await DegreeTypeMaster.findById(degreeTypeId);
    const isPhD = dt && dt.code === 'PHD';

    // Validate that all students being marked belong to the selected degree type/name
    const studentIds = records.map(r => r.studentId);
    const invalidStudents = await User.find({
      _id: { $in: studentIds },
      $or: [
        { 'profile.degreeTypeId': { $ne: new mongoose.Types.ObjectId(degreeTypeId) } },
        ...(!isPhD ? [{ 'profile.degreeNameId': { $ne: new mongoose.Types.ObjectId(degreeNameId) } }] : [])
      ]
    });
    if (invalidStudents.length > 0) {
      return res.status(400).json({
        message: `Validation failed: Some students being marked do not belong to the selected degree type/name.`
      });
    }

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
    const { leaveTypeId, startDate, endDate, reason, documentUrl, isHalfDay } = req.body;
    const student = await User.findById(req.user._id);
    const departmentId = (await Department.findOne({ name: student.department }))?._id;
    
    const leaveRule = await LeaveTypeMaster.findById(leaveTypeId);
    if (!leaveRule) {
      return res.status(404).json({ message: 'Selected Leave Type not found.' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return res.status(400).json({ message: 'End date cannot be before start date.' });
    }

    if (isHalfDay) {
      if (start.toDateString() !== end.toDateString()) {
        return res.status(400).json({ message: 'Half-day leaves can only be applied for a single day.' });
      }
      if (!leaveRule.allowHalfDay) {
        return res.status(400).json({ message: 'Half-day leaves are not allowed for this leave type.' });
      }
    }
    
    if (leaveRule.applicableGender !== 'All' && student.profile?.gender) {
      if (student.profile.gender.toLowerCase() !== leaveRule.applicableGender.toLowerCase()) {
        return res.status(400).json({ message: `This leave type is only applicable for ${leaveRule.applicableGender} students.` });
      }
    }
    
    if (leaveRule.advanceNoticeDays > 0) {
      const daysDiff = (start - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24);
      if (daysDiff < leaveRule.advanceNoticeDays) {
        return res.status(400).json({ message: `Advance notice of ${leaveRule.advanceNoticeDays} days is required for this leave type.` });
      }
    }
    
    if (leaveRule.documentUploadRule === 'mandatory' && !documentUrl) {
      return res.status(400).json({ message: 'Supporting document upload is mandatory for this leave type.' });
    }
    
    const holidays = await HolidayCalendar.find({
      isActive: true,
      $or: [{ departmentId }, { departmentId: null }]
    });
    
    let totalDays = 0;
    if (isHalfDay) {
      totalDays = 0.5;
    } else {
      let cur = new Date(start);
      while (cur <= end) {
        const day = cur.getDay();
        const curStr = cur.toISOString().split('T')[0];
        const isSun = (day === 0);
        const isHoli = holidays.some(h => {
          const hStart = new Date(h.startDate).toISOString().split('T')[0];
          const hEnd = new Date(h.endDate).toISOString().split('T')[0];
          return curStr >= hStart && curStr <= hEnd;
        });
        
        if (leaveRule.includeHolidays) {
          totalDays++;
        } else {
          if (!isSun && !isHoli) {
            totalDays++;
          }
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    
    if (totalDays === 0) {
      return res.status(400).json({ message: 'Selected leave period does not contain any working days.' });
    }
    
    if (totalDays < leaveRule.minDaysPerRequest) {
      return res.status(400).json({ message: `Minimum duration for this leave request must be at least ${leaveRule.minDaysPerRequest} day(s).` });
    }
    
    if (leaveRule.maxDaysLimit !== null) {
      const limitType = leaveRule.maxDaysLimitType || 'year';
      let dateFilter = {};
      
      if (limitType === 'year') {
        const currentYear = start.getFullYear();
        dateFilter = {
          startDate: { $gte: new Date(`${currentYear}-01-01`) },
          endDate: { $lte: new Date(`${currentYear}-12-31`) }
        };
      } else {
        dateFilter = {
          startDate: { $gte: new Date(new Date(start).setDate(start.getDate() - 150)) }
        };
      }
      
      const existingLeaves = await LeaveRequest.find({
        studentId: student._id,
        leaveType: leaveRule.leaveName,
        status: { $in: ['APPROVED', 'PENDING_SUPERVISOR', 'PENDING_HOD'] },
        ...dateFilter
      });
      
      const usedDays = existingLeaves.reduce((sum, l) => sum + l.totalDays, 0);
      if (usedDays + totalDays > leaveRule.maxDaysLimit) {
        return res.status(400).json({
          message: `Leave limit exceeded. Max allowed is ${leaveRule.maxDaysLimit} days per ${limitType}. You have already taken/applied for ${usedDays} days.`
        });
      }
    }
    
    let supervisorId = student.profile?.preferredGuideId;
    if (!supervisorId) supervisorId = (await User.findOne({ department: student.department, role: 'HOD' }))?._id;
    
    const leave = await LeaveRequest.create({
      studentId: student._id, department: student.department, departmentId,
      leaveType: leaveRule.leaveName, startDate: new Date(startDate), endDate: new Date(endDate),
      totalDays, reason, documentUrl, isHalfDay: !!isHalfDay,
      status: supervisorId ? 'PENDING_SUPERVISOR' : 'PENDING_HOD',
      currentAssigneeId: supervisorId,
      auditLog: [{ action: 'SUBMITTED', actorId: student._id, actorName: student.name, remarks: 'Applied' }]
    });
    
    if (supervisorId) {
      await createNotification({
        recipient: supervisorId,
        title: '📋 New Leave Application',
        message: `${student.name} has applied for ${leaveRule.leaveName} from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()} (${totalDays} day(s)).`,
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
    const isPhD = req.user.profile?.isPhD || false;
    const { semesterId } = req.query;

    if (isPhD) {
      const records = await AttendanceRecord.find({
        studentId: req.user._id,
        status: 'ABSENT',
        courseCode: 'DAILY'
      }).sort({ date: -1 });

      const corrections = await AttendanceCorrection.find({
        studentId: req.user._id
      });

      const recordCorrectionMap = {};
      corrections.forEach(c => {
        const rid = c.recordId?.toString() || '';
        if (!recordCorrectionMap[rid]) {
          recordCorrectionMap[rid] = { attempts: 0, latestStatus: null };
        }
        recordCorrectionMap[rid].attempts = Math.max(
          recordCorrectionMap[rid].attempts,
          c.correctionAttempt || 1
        );
        if (['APPROVED', 'REJECTED', 'PENDING_FACULTY', 'PENDING_HOD'].includes(c.status)) {
          recordCorrectionMap[rid].latestStatus = c.status;
        }
      });

      const result = [];
      records.forEach(record => {
        const rid = record._id.toString();
        const info = recordCorrectionMap[rid];

        let eligible = true;
        let locked = false;
        let attempts = 0;
        let latestStatus = null;

        if (info) {
          attempts = info.attempts;
          latestStatus = info.latestStatus;
          if (latestStatus === 'APPROVED') {
            return;
          }
          if (attempts >= 2) {
            eligible = false;
            locked = true;
          }
        }

        result.push({
          date: record.date,
          recordId: record._id,
          absentSubjects: [],
          eligible,
          locked,
          correctionAttempts: attempts,
          latestStatus,
          isPhD: true
        });
      });

      return res.status(200).json(result);
    }

    // Standard student flow
    const query = {
      studentId: req.user._id,
      classes: { $elemMatch: { selected: { $ne: true } } }
    };
    if (semesterId) {
      query.semesterId = semesterId;
    }

    const records = await AttendanceRecord.find(query)
      .populate('classes.timetableSlotId')
      .sort({ date: -1 });

    // Get all existing corrections by this student
    const corrections = await AttendanceCorrection.find({
      studentId: req.user._id
    });

    // Build a map: recordId + timetableSlotId → correction info
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
        if (['APPROVED', 'REJECTED', 'PENDING_FACULTY', 'PENDING_HOD'].includes(c.status)) {
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

      const absentClasses = (record.classes || []).filter(c => {
        return c.selected !== true;
      }).map(c => ({
        timetableSlotId: c.timetableSlotId?._id || c.timetableSlotId,
        subjectName: c.subjectName || c.timetableSlotId?.subjectName || 'Unknown',
        subjectCode: c.timetableSlotId?.subjectCode || ''
      }));

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
          sub.eligible = true;
          sub.correctionAttempts = 0;
          sub.latestStatus = null;
          return true;
        }
        
        sub.correctionAttempts = info.attempts;
        sub.latestStatus = info.latestStatus;

        if (info.latestStatus === 'APPROVED') {
          sub.eligible = false;
          return false;
        }
        
        if (info.attempts >= 2) {
          sub.eligible = false;
          sub.locked = true;
          return true;
        }
        
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
    const isPhD = req.user.profile?.isPhD || false;
    
    if (!recordId) {
      return res.status(400).json({ message: 'Record reference is required.' });
    }
    if (!isPhD) {
      if (!timetableSlotIds || timetableSlotIds.length === 0) {
        return res.status(400).json({ message: 'Please select at least one subject to correct.' });
      }
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

    const targetDate = new Date(record.date);
    const holiday = await HolidayCalendar.findOne({
      isActive: true,
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
      $or: [{ departmentId: req.user.departmentId }, { departmentId: null }]
    });
    if (holiday) {
      return res.status(400).json({ message: `Cannot request correction for a date that falls on a holiday: ${holiday.title}.` });
    }

    // Check existing corrections
    let thisAttempt = 1;
    let isLastChance = false;

    if (isPhD) {
      const existingCorrections = await AttendanceCorrection.find({
        studentId: req.user._id,
        recordId
      }).sort({ createdAt: -1 });

      const approvedCorrection = existingCorrections.find(c => c.status === 'APPROVED');
      if (approvedCorrection) {
        return res.status(400).json({ message: 'You already have an approved correction request for this date.' });
      }

      const totalAttempts = existingCorrections.length;
      if (totalAttempts >= 2) {
        return res.status(400).json({ message: 'Maximum correction attempts (2) reached for this date.' });
      }

      thisAttempt = totalAttempts + 1;
      isLastChance = thisAttempt >= 2;
    } else {
      // Check existing corrections for these subjects
      const existingCorrections = await AttendanceCorrection.find({
        studentId: req.user._id,
        recordId,
        timetableSlotIds: { $in: timetableSlotIds }
      }).sort({ createdAt: -1 });

      // Group existing corrections by timetableSlotId to check per-subject limits
      const maxAttemptsReached = [];
      
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
      });

      if (maxAttemptsReached.length > 0) {
        return res.status(400).json({
          message: 'One or more selected subjects have already reached the maximum correction attempts (2). These subjects cannot be corrected again.',
          blockedSubjects: maxAttemptsReached
        });
      }

      const maxAttempt = existingCorrections.reduce((max, c) => Math.max(max, c.correctionAttempt || 0), 0);
      thisAttempt = maxAttempt + 1;
      isLastChance = thisAttempt >= 2;
    }

    let assignedFacultyId = record.facultyId;
    if (isPhD) {
      if (req.user.profile?.preferredGuideId) {
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(req.user.profile.preferredGuideId)) {
          assignedFacultyId = req.user.profile.preferredGuideId;
        }
      }
    }

    const correction = await AttendanceCorrection.create({
      studentId: req.user._id,
      recordId,
      timetableSlotIds: isPhD ? [] : timetableSlotIds,
      correctionType,
      leaveType: correctionType === 'ON_LEAVE' ? leaveType : '',
      reason,
      documentUrl: documentUrl || '',
      status: 'PENDING_FACULTY',
      facultyId: assignedFacultyId,
      correctionAttempt: thisAttempt,
      auditLog: [{
        action: 'SUBMITTED',
        actorId: req.user._id,
        actorName: req.user.name,
        remarks: isPhD 
          ? `Correction request submitted for daily check-in. Attempt #${thisAttempt}`
          : `Correction request submitted for ${timetableSlotIds.length} subject(s). Attempt #${thisAttempt}`
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
        if (record.courseCode === 'DAILY') {
          // PhD check-in record
          record.status = correction.correctionType;
          if (correction.correctionType === 'ON_LEAVE') {
            record.leaveType = correction.leaveType;
            record.isLeaveOverride = true;
          } else {
            record.leaveType = '';
            record.isLeaveOverride = false;
          }
        } else {
          // Standard student slot-wise record
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

exports.seedHolidays = async (req, res) => {
  try {
    await HolidayCalendar.deleteMany({});
    const hpHolidays = [
      { title: "Statehood Day", startDate: new Date("2026-01-25T00:00:00.000Z"), endDate: new Date("2026-01-25T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Republic Day", startDate: new Date("2026-01-26T00:00:00.000Z"), endDate: new Date("2026-01-26T00:00:00.000Z"), holidayType: "NATIONAL" },
      { title: "Guru Ravidas's Birthday", startDate: new Date("2026-02-01T00:00:00.000Z"), endDate: new Date("2026-02-01T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Maha Shivratri", startDate: new Date("2026-02-15T00:00:00.000Z"), endDate: new Date("2026-02-15T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Holi", startDate: new Date("2026-03-04T00:00:00.000Z"), endDate: new Date("2026-03-04T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Id-ul-Fitr", startDate: new Date("2026-03-21T00:00:00.000Z"), endDate: new Date("2026-03-21T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Ram Navami", startDate: new Date("2026-03-26T00:00:00.000Z"), endDate: new Date("2026-03-26T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Good Friday", startDate: new Date("2026-04-03T00:00:00.000Z"), endDate: new Date("2026-04-03T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Dr. B. R. Ambedkar's Birthday", startDate: new Date("2026-04-14T00:00:00.000Z"), endDate: new Date("2026-04-14T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Himachal Day", startDate: new Date("2026-04-15T00:00:00.000Z"), endDate: new Date("2026-04-15T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Bhagwan Shree Parshuram Jayanti", startDate: new Date("2026-04-19T00:00:00.000Z"), endDate: new Date("2026-04-19T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Buddha Purnima", startDate: new Date("2026-05-01T00:00:00.000Z"), endDate: new Date("2026-05-01T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Id-ul-Zuha (Bakrid)", startDate: new Date("2026-05-27T00:00:00.000Z"), endDate: new Date("2026-05-27T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Maharana Pratap Jayanti", startDate: new Date("2026-06-17T00:00:00.000Z"), endDate: new Date("2026-06-17T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Muharram", startDate: new Date("2026-06-26T00:00:00.000Z"), endDate: new Date("2026-06-26T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Sant Guru Kabir Jayanti (Prakat Diwas)", startDate: new Date("2026-06-29T00:00:00.000Z"), endDate: new Date("2026-06-29T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Independence Day", startDate: new Date("2026-08-15T00:00:00.000Z"), endDate: new Date("2026-08-15T00:00:00.000Z"), holidayType: "NATIONAL" },
      { title: "Janmashtami", startDate: new Date("2026-09-04T00:00:00.000Z"), endDate: new Date("2026-09-04T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Mahatma Gandhi's Birthday", startDate: new Date("2026-10-02T00:00:00.000Z"), endDate: new Date("2026-10-02T00:00:00.000Z"), holidayType: "NATIONAL" },
      { title: "Dussehra", startDate: new Date("2026-10-20T00:00:00.000Z"), endDate: new Date("2026-10-20T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Maharishi Valmiki's Birthday", startDate: new Date("2026-10-26T00:00:00.000Z"), endDate: new Date("2026-10-26T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Diwali (Deepavali)", startDate: new Date("2026-11-08T00:00:00.000Z"), endDate: new Date("2026-11-08T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Guru Nanak's Birthday", startDate: new Date("2026-11-24T00:00:00.000Z"), endDate: new Date("2026-11-24T00:00:00.000Z"), holidayType: "STATE" },
      { title: "Christmas Day", startDate: new Date("2026-12-25T00:00:00.000Z"), endDate: new Date("2026-12-25T00:00:00.000Z"), holidayType: "NATIONAL" }
    ];
    const data = await HolidayCalendar.insertMany(hpHolidays);
    res.status(201).json({ message: `Successfully seeded ${data.length} official Himachal Pradesh Govt holidays for 2026.`, count: data.length });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.seedAllMasters = async (req, res) => {
  try {
    // 1. Seed Degree Types
    const degreeTypesToSeed = [
      { name: 'Undergraduate', code: 'UG' },
      { name: 'Postgraduate', code: 'PG' },
      { name: 'PhD', code: 'PHD' },
      { name: 'Certificate', code: 'CERT' },
      { name: 'Diploma', code: 'DIP' },
      { name: 'Advanced Diploma', code: 'ADVDIP' }
    ];

    let dtAdded = 0;
    const degreeTypesMap = {};
    for (const dt of degreeTypesToSeed) {
      let doc = await DegreeTypeMaster.findOne({ code: dt.code });
      if (!doc) {
        doc = await DegreeTypeMaster.create(dt);
        dtAdded++;
      }
      degreeTypesMap[dt.code] = doc._id;
    }

    // 2. Seed Departments
    const departmentsToSeed = [
      { name: 'Department of Commerce', code: 'COMMERCE', faculty: 'Faculty of Commerce & Management' },
      { name: 'HPU Business School', code: 'HPUBS', faculty: 'Faculty of Commerce & Management' },
      { name: 'Institute of Vocational Studies', code: 'IVS', faculty: 'Faculty of Commerce & Management' },
      { name: 'Department of Bio Sciences', code: 'BIOSCI', faculty: 'Faculty of Life Sciences' },
      { name: 'Department of Bio Technology', code: 'BIOTECH', faculty: 'Faculty of Life Sciences' },
      { name: 'Department of Environmental Science', code: 'ENVSCI', faculty: 'Faculty of Life Sciences' },
      { name: 'Department of Forensic Science', code: 'FORENSIC', faculty: 'Faculty of Life Sciences' },
      { name: 'Department of Microbiology', code: 'MICROBIO', faculty: 'Faculty of Life Sciences' },
      { name: 'Department of Law', code: 'LAW', faculty: 'Faculty of LAW' },
      { name: 'Department of Education', code: 'EDU', faculty: 'Faculty of Education' },
      { name: 'Department of Physical Education', code: 'PHYEDU', faculty: 'Faculty of Education' },
      { name: 'Department of Computer Science', code: 'COMSCI', faculty: 'Faculty of Physical Sciences' },
      { name: 'Department of Physics', code: 'PHYSICS', faculty: 'Faculty of Physical Sciences' },
      { name: 'Department of Chemistry', code: 'CHEMISTRY', faculty: 'Faculty of Physical Sciences' },
      { name: 'Department of Mathematics', code: 'MATHS', faculty: 'Faculty of Physical Sciences' },
      { name: 'Department of Data Science and Artificial Intelligence', code: 'DSAI', faculty: 'Faculty of Physical Sciences' },
      { name: 'Department of Geography', code: 'GEOGRAPHY', faculty: 'Faculty of Social Sciences' },
      { name: 'Department of Economics', code: 'ECONOMICS', faculty: 'Faculty of Social Sciences' },
      { name: 'Department of History', code: 'HISTORY', faculty: 'Faculty of Social Sciences' },
      { name: 'Department of Journalism and Mass Communications', code: 'JMC', faculty: 'Faculty of Social Sciences' },
      { name: 'Department of Political Science', code: 'POLSCI', faculty: 'Faculty of Social Sciences' },
      { name: 'Department of Psychology', code: 'PSYCHOLOGY', faculty: 'Faculty of Social Sciences' },
      { name: 'Department of Population Studies', code: 'POPSTUD', faculty: 'Faculty of Social Sciences' },
      { name: 'Department of Public Administration', code: 'PUBADMIN', faculty: 'Faculty of Social Sciences' },
      { name: 'Department of Sociology and Social Work', code: 'SOCIO', faculty: 'Faculty of Social Sciences' },
      { name: 'Department of Yoga Studies', code: 'YOGA', faculty: 'Faculty of Social Sciences' },
      { name: 'Department of Library and Information Science', code: 'LIBSCI', faculty: 'Faculty of Social Sciences' },
      { name: 'Department of Archaeology', code: 'ARCHAEOLOGY', faculty: 'Faculty of Social Sciences' },
      { name: 'Department of Performing Arts', code: 'PERFART', faculty: 'Faculty of Performing & Visual Arts' },
      { name: 'Department of Visual Arts', code: 'VISART', faculty: 'Faculty of Performing & Visual Arts' },
      { name: 'Centre for Buddhist Studies', code: 'CBS', faculty: 'Faculty of Languages' },
      { name: 'Department of Modern European and Foreign Languages', code: 'MEFL', faculty: 'Faculty of Languages' },
      { name: 'Department of Sanskrit', code: 'SANSKRIT', faculty: 'Faculty of Languages' },
      { name: 'Department of English', code: 'ENGLISH', faculty: 'Faculty of Languages' },
      { name: 'Department of Hindi', code: 'HINDI', faculty: 'Faculty of Languages' },
      { name: 'Department of Computer Science Engineering', code: 'CSE', faculty: 'Faculty of Engineering and Technology (UIT)' },
      { name: 'Department of Information Technology', code: 'IT', faculty: 'Faculty of Engineering and Technology (UIT)' },
      { name: 'Department of Civil Engineering', code: 'CE', faculty: 'Faculty of Engineering and Technology (UIT)' },
      { name: 'Department of Electronics and Communication', code: 'ECE', faculty: 'Faculty of Engineering and Technology (UIT)' },
      { name: 'Department of Electrical Engineering', code: 'EE', faculty: 'Faculty of Engineering and Technology (UIT)' },
      { name: 'Department of Interdisciplinary Studies', code: 'DIS', faculty: 'Faculty of Envr, Sustainability and Dev. Studies' }
    ];

    let deptsAdded = 0;
    const deptsMap = {};
    for (const d of departmentsToSeed) {
      let doc = await Department.findOne({ code: d.code });
      if (!doc) {
        doc = await Department.create(d);
        deptsAdded++;
      } else {
        doc.faculty = d.faculty;
        await doc.save();
      }
      deptsMap[d.code] = doc._id;
    }

    // 3. Seed Degree Names
    const degreeNamesToSeed = [
      { deptCode: 'COMMERCE', typeCode: 'UG', name: 'B.Com.', code: 'BCOM' },
      { deptCode: 'COMMERCE', typeCode: 'PG', name: 'M.Com.', code: 'MCOM' },
      { deptCode: 'COMMERCE', typeCode: 'PHD', name: 'Ph.D. Commerce', code: 'PHD-COMM' },
      { deptCode: 'HPUBS', typeCode: 'UG', name: 'BBA', code: 'BBA' },
      { deptCode: 'HPUBS', typeCode: 'PG', name: 'MBA', code: 'MBA' },
      { deptCode: 'HPUBS', typeCode: 'PG', name: 'MBA (Rural Development)', code: 'MBA-RD' },
      { deptCode: 'HPUBS', typeCode: 'PHD', name: 'Ph.D. Management', code: 'PHD-MGMT' },
      { deptCode: 'IVS', typeCode: 'UG', name: 'BHM', code: 'BHM' },
      { deptCode: 'IVS', typeCode: 'UG', name: 'FYICTTM', code: 'FYICTTM' },
      { deptCode: 'IVS', typeCode: 'PG', name: 'MTTM', code: 'MTTM' },
      { deptCode: 'IVS', typeCode: 'PHD', name: 'Ph.D. Tourism', code: 'PHD-TOUR' },
      { deptCode: 'BIOSCI', typeCode: 'UG', name: 'B.Sc. Botany', code: 'BSC-BOT' },
      { deptCode: 'BIOSCI', typeCode: 'UG', name: 'B.Sc. Zoology', code: 'BSC-ZOO' },
      { deptCode: 'BIOSCI', typeCode: 'PG', name: 'M.Sc. Botany', code: 'MSC-BOT' },
      { deptCode: 'BIOSCI', typeCode: 'PG', name: 'M.Sc. Zoology', code: 'MSC-ZOO' },
      { deptCode: 'BIOSCI', typeCode: 'PHD', name: 'Ph.D. Botany', code: 'PHD-BOT' },
      { deptCode: 'BIOSCI', typeCode: 'PHD', name: 'Ph.D. Zoology', code: 'PHD-ZOO' },
      { deptCode: 'BIOSCI', typeCode: 'CERT', name: 'Certificate in Beekeeping', code: 'CERT-BEEP' },
      { deptCode: 'BIOSCI', typeCode: 'CERT', name: 'Certificate in Mushroom Farming', code: 'CERT-MUSH' },
      { deptCode: 'BIOTECH', typeCode: 'UG', name: 'B.Sc. Bio-Technology', code: 'BSC-BIOTECH' },
      { deptCode: 'BIOTECH', typeCode: 'PG', name: 'M.Sc. Biotechnology', code: 'MSC-BIOTECH' },
      { deptCode: 'BIOTECH', typeCode: 'PHD', name: 'Ph.D. Bio-Technology', code: 'PHD-BIOTECH' },
      { deptCode: 'BIOTECH', typeCode: 'DIP', name: 'Diploma in Biotechnology', code: 'DIP-BIOTECH' },
      { deptCode: 'ENVSCI', typeCode: 'PG', name: 'M.Sc. Environmental Science', code: 'MSC-ENVSCI' },
      { deptCode: 'ENVSCI', typeCode: 'PHD', name: 'Ph.D. Environmental Science', code: 'PHD-ENVSCI' },
      { deptCode: 'ENVSCI', typeCode: 'CERT', name: 'Certificate in Environmental Science', code: 'CERT-ENVSCI' },
      { deptCode: 'FORENSIC', typeCode: 'PG', name: 'M.Sc. Forensic Science', code: 'MSC-FORENSIC' },
      { deptCode: 'FORENSIC', typeCode: 'PHD', name: 'Ph.D. Forensic Science', code: 'PHD-FORENSIC' },
      { deptCode: 'FORENSIC', typeCode: 'CERT', name: 'Certificate in Forensic Science', code: 'CERT-FORENSIC' },
      { deptCode: 'MICROBIO', typeCode: 'UG', name: 'B.Sc. Microbiology', code: 'BSC-MICRO' },
      { deptCode: 'MICROBIO', typeCode: 'PG', name: 'M.Sc. Microbiology', code: 'MSC-MICRO' },
      { deptCode: 'MICROBIO', typeCode: 'PHD', name: 'Ph.D. Microbiology', code: 'PHD-MICRO' },
      { deptCode: 'MICROBIO', typeCode: 'CERT', name: 'Certificate in Microbiology', code: 'CERT-MICRO' },
      { deptCode: 'LAW', typeCode: 'UG', name: 'LLB', code: 'LLB' },
      { deptCode: 'LAW', typeCode: 'PG', name: 'LLM', code: 'LLM' },
      { deptCode: 'LAW', typeCode: 'PHD', name: 'Ph.D. Law', code: 'PHD-LAW' },
      { deptCode: 'EDU', typeCode: 'UG', name: 'B.Ed.', code: 'BED' },
      { deptCode: 'EDU', typeCode: 'PG', name: 'M.Ed.', code: 'MED' },
      { deptCode: 'EDU', typeCode: 'PG', name: 'M.A. Education', code: 'MA-EDU' },
      { deptCode: 'EDU', typeCode: 'PHD', name: 'Ph.D. Education', code: 'PHD-EDU' },
      { deptCode: 'PHYEDU', typeCode: 'PG', name: 'M.P.Ed.', code: 'MPED' },
      { deptCode: 'PHYEDU', typeCode: 'PG', name: 'M.A. Physical Education', code: 'MA-PHYEDU' },
      { deptCode: 'PHYEDU', typeCode: 'PHD', name: 'Ph.D. Physical Education', code: 'PHD-PHYEDU' },
      { deptCode: 'COMSCI', typeCode: 'UG', name: 'BCA', code: 'BCA' },
      { deptCode: 'COMSCI', typeCode: 'PG', name: 'MCA', code: 'MCA' },
      { deptCode: 'COMSCI', typeCode: 'PG', name: 'M.Tech. Computer Science', code: 'MTECH-CS' },
      { deptCode: 'COMSCI', typeCode: 'PHD', name: 'Ph.D. Computer Science', code: 'PHD-CS' },
      { deptCode: 'COMSCI', typeCode: 'DIP', name: 'PGDCA', code: 'PGDCA' },
      { deptCode: 'PHYSICS', typeCode: 'UG', name: 'B.Sc. Physics', code: 'BSC-PHYSICS' },
      { deptCode: 'PHYSICS', typeCode: 'PG', name: 'M.Sc. Physics', code: 'MSC-PHYSICS' },
      { deptCode: 'PHYSICS', typeCode: 'PHD', name: 'Ph.D. Physics', code: 'PHD-PHYSICS' },
      { deptCode: 'CHEMISTRY', typeCode: 'UG', name: 'B.Sc. Chemistry', code: 'BSC-CHEMISTRY' },
      { deptCode: 'CHEMISTRY', typeCode: 'PG', name: 'M.Sc. Chemistry', code: 'MSC-CHEMISTRY' },
      { deptCode: 'CHEMISTRY', typeCode: 'PHD', name: 'Ph.D. Chemistry', code: 'PHD-CHEMISTRY' },
      { deptCode: 'MATHS', typeCode: 'UG', name: 'B.Sc. Mathematics', code: 'BSC-MATHS' },
      { deptCode: 'MATHS', typeCode: 'PG', name: 'M.Sc. Mathematics', code: 'MSC-MATHS' },
      { deptCode: 'MATHS', typeCode: 'PHD', name: 'Ph.D. Mathematics', code: 'PHD-MATHS' },
      { deptCode: 'MATHS', typeCode: 'DIP', name: 'PG Diploma in Ancient Indian Mathematics', code: 'DIP-AIM' },
      { deptCode: 'DSAI', typeCode: 'UG', name: 'B.Sc. Data Science', code: 'BSC-DS' },
      { deptCode: 'DSAI', typeCode: 'UG', name: 'B.Sc. Artificial Intelligence', code: 'BSC-AI' },
      { deptCode: 'DSAI', typeCode: 'PG', name: 'M.Sc. Data Science', code: 'MSC-DS' },
      { deptCode: 'DSAI', typeCode: 'PG', name: 'M.Sc. Artificial Intelligence', code: 'MSC-AI' },
      { deptCode: 'GEOGRAPHY', typeCode: 'UG', name: 'B.A. Geography', code: 'BA-GEOG' },
      { deptCode: 'GEOGRAPHY', typeCode: 'PG', name: 'M.A. Geography', code: 'MA-GEOG' },
      { deptCode: 'GEOGRAPHY', typeCode: 'PG', name: 'M.Sc. Geography', code: 'MSC-GEOG' },
      { deptCode: 'GEOGRAPHY', typeCode: 'PHD', name: 'Ph.D. Geography', code: 'PHD-GEOG' },
      { deptCode: 'ECONOMICS', typeCode: 'UG', name: 'B.A. Economics', code: 'BA-ECON' },
      { deptCode: 'ECONOMICS', typeCode: 'PG', name: 'M.A. Economics', code: 'MA-ECON' },
      { deptCode: 'ECONOMICS', typeCode: 'PHD', name: 'Ph.D. Economics', code: 'PHD-ECON' },
      { deptCode: 'ECONOMICS', typeCode: 'CERT', name: 'Certificate in Environmental Economics', code: 'CERT-ENVECON' },
      { deptCode: 'HISTORY', typeCode: 'UG', name: 'B.A. History', code: 'BA-HIST' },
      { deptCode: 'HISTORY', typeCode: 'PG', name: 'M.A. History', code: 'MA-HIST' },
      { deptCode: 'HISTORY', typeCode: 'PHD', name: 'Ph.D. History', code: 'PHD-HIST' },
      { deptCode: 'JMC', typeCode: 'PG', name: 'M.A. Journalism and Mass Communication (MAJMC)', code: 'MAJMC' },
      { deptCode: 'JMC', typeCode: 'PHD', name: 'Ph.D. Journalism & Mass Communication', code: 'PHD-JMC' },
      { deptCode: 'POLSCI', typeCode: 'UG', name: 'B.A. Political Science', code: 'BA-POLSCI' },
      { deptCode: 'POLSCI', typeCode: 'PG', name: 'M.A. Political Science', code: 'MA-POLSCI' },
      { deptCode: 'POLSCI', typeCode: 'PHD', name: 'Ph.D. Political Science', code: 'PHD-POLSCI' },
      { deptCode: 'POLSCI', typeCode: 'CERT', name: 'Certificate in Public Policy & Governance', code: 'CERT-PPG' },
      { deptCode: 'PSYCHOLOGY', typeCode: 'UG', name: 'B.A. Psychology', code: 'BA-PSYCH' },
      { deptCode: 'PSYCHOLOGY', typeCode: 'PG', name: 'M.A. Psychology', code: 'MA-PSYCH' },
      { deptCode: 'PSYCHOLOGY', typeCode: 'PHD', name: 'Ph.D. Psychology', code: 'PHD-PSYCH' },
      { deptCode: 'POPSTUD', typeCode: 'DIP', name: 'PG Diploma in Population Studies', code: 'DIP-POP' },
      { deptCode: 'PUBADMIN', typeCode: 'UG', name: 'B.A. Public Administration', code: 'BA-PUBAD' },
      { deptCode: 'PUBADMIN', typeCode: 'PG', name: 'M.A. Public Administration', code: 'MA-PUBAD' },
      { deptCode: 'PUBADMIN', typeCode: 'PHD', name: 'Ph.D. Public Administration', code: 'PHD-PUBAD' },
      { deptCode: 'SOCIO', typeCode: 'UG', name: 'B.A. Sociology', code: 'BA-SOC' },
      { deptCode: 'SOCIO', typeCode: 'PG', name: 'M.A. Sociology', code: 'MA-SOC' },
      { deptCode: 'SOCIO', typeCode: 'PG', name: 'M.A. Social Work', code: 'MA-SW' },
      { deptCode: 'SOCIO', typeCode: 'PHD', name: 'Ph.D. Sociology', code: 'PHD-SOC' },
      { deptCode: 'SOCIO', typeCode: 'PHD', name: 'Ph.D. Social Work', code: 'PHD-SW' },
      { deptCode: 'SOCIO', typeCode: 'CERT', name: 'Certificate in Social Work', code: 'CERT-SW' },
      { deptCode: 'YOGA', typeCode: 'PG', name: 'M.A. Yoga Studies', code: 'MA-YOGA' },
      { deptCode: 'YOGA', typeCode: 'PHD', name: 'Ph.D. Yoga Studies', code: 'PHD-YOGA' },
      { deptCode: 'YOGA', typeCode: 'DIP', name: 'Diploma in Yoga', code: 'DIP-YOGA' },
      { deptCode: 'LIBSCI', typeCode: 'UG', name: 'B.Lib.I.Sc.', code: 'BLIB' },
      { deptCode: 'LIBSCI', typeCode: 'PG', name: 'M.Lib.I.Sc.', code: 'MLIB' },
      { deptCode: 'ARCHAEOLOGY', typeCode: 'PG', name: 'M.A. Archaeology and Ancient History', code: 'MA-ARCH' },
      { deptCode: 'PERFART', typeCode: 'UG', name: 'B.A. Performing Arts', code: 'BA-PERF' },
      { deptCode: 'PERFART', typeCode: 'PG', name: 'M.A. Performing Arts', code: 'MA-PERF' },
      { deptCode: 'PERFART', typeCode: 'PG', name: 'M.A. Music', code: 'MA-MUS' },
      { deptCode: 'PERFART', typeCode: 'PHD', name: 'Ph.D. Performing Arts', code: 'PHD-PERF' },
      { deptCode: 'PERFART', typeCode: 'PHD', name: 'Ph.D. Music', code: 'PHD-MUS' },
      { deptCode: 'PERFART', typeCode: 'DIP', name: 'PG Diploma in Tabla', code: 'DIP-TABLA' },
      { deptCode: 'VISART', typeCode: 'UG', name: 'BFA', code: 'BFA' },
      { deptCode: 'VISART', typeCode: 'PG', name: 'M.A. Visual Arts (Painting)', code: 'MA-PAINT' },
      { deptCode: 'VISART', typeCode: 'PG', name: 'MFA (Pahari Miniature Painting)', code: 'MFA-PMP' },
      { deptCode: 'VISART', typeCode: 'PHD', name: 'Ph.D. Visual Arts', code: 'PHD-VIS' },
      { deptCode: 'CBS', typeCode: 'CERT', name: 'Certificate in Bhoti Language', code: 'CERT-BHOTI' },
      { deptCode: 'CBS', typeCode: 'DIP', name: 'Diploma in Bhoti Language', code: 'DIP-BHOTI' },
      { deptCode: 'CBS', typeCode: 'ADVDIP', name: 'Advanced Diploma in Bhoti Language', code: 'ADVDIP-BHOTI' },
      { deptCode: 'MEFL', typeCode: 'CERT', name: 'Certificate in German', code: 'CERT-GER' },
      { deptCode: 'MEFL', typeCode: 'CERT', name: 'Certificate in Russian', code: 'CERT-RUS' },
      { deptCode: 'MEFL', typeCode: 'DIP', name: 'Diploma in German', code: 'DIP-GER' },
      { deptCode: 'MEFL', typeCode: 'DIP', name: 'Diploma in Russian', code: 'DIP-RUS' },
      { deptCode: 'MEFL', typeCode: 'ADVDIP', name: 'Advanced Diploma in German', code: 'ADVDIP-GER' },
      { deptCode: 'MEFL', typeCode: 'ADVDIP', name: 'Advanced Diploma in Russian', code: 'ADVDIP-RUS' },
      { deptCode: 'SANSKRIT', typeCode: 'UG', name: 'B.A. Sanskrit', code: 'BA-SANSKRIT' },
      { deptCode: 'SANSKRIT', typeCode: 'PG', name: 'M.A. Sanskrit', code: 'MA-SANSKRIT' },
      { deptCode: 'SANSKRIT', typeCode: 'PHD', name: 'Ph.D. Sanskrit', code: 'PHD-SANSKRIT' },
      { deptCode: 'SANSKRIT', typeCode: 'CERT', name: 'Certificate in Indian Knowledge System', code: 'CERT-IKS' },
      { deptCode: 'ENGLISH', typeCode: 'UG', name: 'B.A. English', code: 'BA-ENG' },
      { deptCode: 'ENGLISH', typeCode: 'PG', name: 'M.A. English', code: 'MA-ENG' },
      { deptCode: 'ENGLISH', typeCode: 'PHD', name: 'Ph.D. English', code: 'PHD-ENG' },
      { deptCode: 'HINDI', typeCode: 'UG', name: 'B.A. Hindi', code: 'BA-HINDI' },
      { deptCode: 'HINDI', typeCode: 'PG', name: 'M.A. Hindi', code: 'MA-HINDI' },
      { deptCode: 'HINDI', typeCode: 'PHD', name: 'Ph.D. Hindi', code: 'PHD-HINDI' },
      { deptCode: 'HINDI', typeCode: 'DIP', name: 'Diploma in Folk Literature', code: 'DIP-FOLK' },
      { deptCode: 'CSE', typeCode: 'UG', name: 'B.Tech. Computer Science Engineering (CSE)', code: 'BTECH-CSE' },
      { deptCode: 'CSE', typeCode: 'PG', name: 'M.Tech. Computer Science Engineering', code: 'MTECH-CSE' },
      { deptCode: 'CSE', typeCode: 'PHD', name: 'Ph.D. Computer Science Engineering', code: 'PHD-CSE' },
      { deptCode: 'IT', typeCode: 'UG', name: 'B.Tech. Information Technology (IT)', code: 'BTECH-IT' },
      { deptCode: 'IT', typeCode: 'PG', name: 'M.Tech. Information Technology', code: 'MTECH-IT' },
      { deptCode: 'IT', typeCode: 'PHD', name: 'Ph.D. Information Technology', code: 'PHD-IT' },
      { deptCode: 'CE', typeCode: 'UG', name: 'B.Tech. Civil Engineering (CE)', code: 'BTECH-CE' },
      { deptCode: 'CE', typeCode: 'PG', name: 'M.Tech. Civil Engineering (Geotechnical Engineering)', code: 'MTECH-CE' },
      { deptCode: 'CE', typeCode: 'PHD', name: 'Ph.D. Civil Engineering', code: 'PHD-CE' },
      { deptCode: 'ECE', typeCode: 'UG', name: 'B.Tech. Electronics and Communication (ECE)', code: 'BTECH-ECE' },
      { deptCode: 'ECE', typeCode: 'PG', name: 'M.Tech. Electronics and Communication', code: 'MTECH-ECE' },
      { deptCode: 'ECE', typeCode: 'PHD', name: 'Ph.D. Electronics and Communication Engineering', code: 'PHD-ECE' },
      { deptCode: 'EE', typeCode: 'UG', name: 'B.Tech. Electrical Engineering (EE)', code: 'BTECH-EE' },
      { deptCode: 'EE', typeCode: 'PG', name: 'M.Tech. Electrical Engineering (Power & Energy Systems)', code: 'MTECH-EE' },
      { deptCode: 'EE', typeCode: 'PHD', name: 'Ph.D. Electrical Engineering', code: 'PHD-EE' },
      { deptCode: 'DIS', typeCode: 'PG', name: 'M.Tech. Energy Science and Engineering', code: 'MTECH-ENERGY' },
      { deptCode: 'DIS', typeCode: 'PHD', name: 'Ph.D. Energy Science & Technology', code: 'PHD-ENERGY' },
      { deptCode: 'DIS', typeCode: 'CERT', name: 'Certificate in Energy Science and Engineering', code: 'CERT-ENERGY' },
      { deptCode: 'DIS', typeCode: 'CERT', name: 'Certificate in Rethinking Development: Issues and Challenges', code: 'CERT-DEV' },
      { deptCode: 'DIS', typeCode: 'DIP', name: 'PG Diploma in Disaster & Disaster Management', code: 'DIP-DISASTER' },
      { deptCode: 'DIS', typeCode: 'DIP', name: 'PG Diploma in Tribal Studies', code: 'DIP-TRIBAL' }
    ];

    let namesAdded = 0;
    for (const n of degreeNamesToSeed) {
      const typeId = degreeTypesMap[n.typeCode];
      const deptId = deptsMap[n.deptCode];
      if (typeId && deptId) {
        let doc = await DegreeNameMaster.findOne({ code: n.code });
        if (!doc) {
          await DegreeNameMaster.create({
            degreeTypeId: typeId,
            departmentId: deptId,
            name: n.name,
            code: n.code
          });
          namesAdded++;
        }
      }
    }

    // 4. Seed default policies for newly created/active degree types
    let policiesAdded = 0;
    for (const dtCode of Object.keys(degreeTypesMap)) {
      const exists = await AttendancePolicyMaster.findOne({ departmentId: null, programType: dtCode });
      if (!exists) {
        await AttendancePolicyMaster.create({
          departmentId: null,
          programType: dtCode,
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
        });
        policiesAdded++;
      }
    }

    // 5. Seed UGC Leave Types (Global)
    const leaveTypesToSeed = [
      {
        leaveName: 'Casual Leave',
        leaveCode: 'CL',
        maxDaysPerYear: 8,
        maxDaysLimitType: 'year',
        documentUploadRule: 'optional',
        requiresDocument: false,
        includeHolidays: false,
        countsAsPresent: false,
        minDaysPerRequest: 1,
        advanceNoticeDays: 1,
        allowHalfDay: true,
        applicableGender: 'All',
        isActive: true,
        departmentId: null
      },
      {
        leaveName: 'Medical Leave',
        leaveCode: 'ML',
        maxDaysPerYear: 15,
        maxDaysLimitType: 'year',
        documentUploadRule: 'mandatory',
        requiresDocument: true,
        includeHolidays: false,
        countsAsPresent: false,
        minDaysPerRequest: 1,
        advanceNoticeDays: 0,
        allowHalfDay: false,
        applicableGender: 'All',
        isActive: true,
        departmentId: null
      },
      {
        leaveName: 'Duty Leave',
        leaveCode: 'DL',
        maxDaysPerYear: null,
        maxDaysLimitType: 'year',
        documentUploadRule: 'mandatory',
        requiresDocument: true,
        includeHolidays: false,
        countsAsPresent: true,
        minDaysPerRequest: 1,
        advanceNoticeDays: 2,
        allowHalfDay: true,
        applicableGender: 'All',
        isActive: true,
        departmentId: null
      },
      {
        leaveName: 'Maternity Leave',
        leaveCode: 'MAT',
        maxDaysPerYear: 240,
        maxDaysLimitType: 'year',
        documentUploadRule: 'mandatory',
        requiresDocument: true,
        includeHolidays: true,
        countsAsPresent: false,
        minDaysPerRequest: 5,
        advanceNoticeDays: 15,
        allowHalfDay: false,
        applicableGender: 'Female',
        isActive: true,
        departmentId: null
      },
      {
        leaveName: 'Paternity Leave',
        leaveCode: 'PAT',
        maxDaysPerYear: 15,
        maxDaysLimitType: 'year',
        documentUploadRule: 'mandatory',
        requiresDocument: true,
        includeHolidays: true,
        countsAsPresent: false,
        minDaysPerRequest: 3,
        advanceNoticeDays: 7,
        allowHalfDay: false,
        applicableGender: 'Male',
        isActive: true,
        departmentId: null
      }
    ];

    let leaveTypesAdded = 0;
    for (const lt of leaveTypesToSeed) {
      const exists = await LeaveTypeMaster.findOne({ leaveCode: lt.leaveCode, departmentId: null });
      if (!exists) {
        await LeaveTypeMaster.create(lt);
        leaveTypesAdded++;
      }
    }

    res.status(201).json({
      message: `Master seeding complete successfully!`,
      details: {
        degreeTypesSeeded: dtAdded,
        departmentsSeeded: deptsAdded,
        degreeNamesSeeded: namesAdded,
        policiesSeeded: policiesAdded,
        leaveTypesSeeded: leaveTypesAdded
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      let dupMessage = 'A duplicate entry already exists in the database.';
      if (error.keyValue) {
        const fields = Object.keys(error.keyValue);
        dupMessage = `Duplicate entry detected: ${fields.join(', ')} '${error.keyValue[fields[0]]}' already exists.`;
      }
      return res.status(409).json({ message: dupMessage });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.seedSemesterDegreeMappings = async (req, res) => {
  try {
    // 1. Ensure semesters 1 to 10 exist
    const semestersMap = {};
    for (let i = 1; i <= 10; i++) {
      const sem = await SemesterMaster.findOneAndUpdate(
        { number: i },
        { $setOnInsert: { name: `Semester ${i}`, number: i, isActive: true } },
        { upsert: true, new: true }
      );
      semestersMap[i] = sem._id;
    }

    // 2. Fetch all degree names and populate their degree types
    const degreeNames = await DegreeNameMaster.find({}).populate('degreeTypeId');
    let mappingsAdded = 0;

    for (const dn of degreeNames) {
      const typeCode = dn.degreeTypeId?.code || ''; // e.g. UG, PG, PHD, CERT, DIP, ADVDIP
      const code = dn.code || '';

      let semCount = 0;

      if (typeCode === 'PHD') {
        semCount = 0;
      } else if (['CERT', 'DIP', 'ADVDIP'].includes(typeCode)) {
        semCount = 2;
      } else if (typeCode === 'PG') {
        if (code === 'MLIB') {
          semCount = 2; // M.Lib.I.Sc. is 1 year (2 semesters)
        } else {
          semCount = 4; // standard PG / M.Sc. is 2 years (4 semesters)
        }
      } else if (typeCode === 'UG') {
        if (code === 'BLIB') {
          semCount = 2; // B.Lib.I.Sc. is 1 year (2 semesters)
        } else if (['BTECH-CSE', 'BTECH-IT', 'BTECH-CE', 'BTECH-ECE', 'BTECH-EE', 'BFA', 'BHM'].includes(code)) {
          semCount = 8; // B.Tech, BFA, BHM are 4 years (8 semesters)
        } else if (code === 'FYICTTM') {
          semCount = 10; // Five Year Integrated course is 5 years (10 semesters)
        } else {
          semCount = 6; // Standard UG (B.Com, BBA, BCA, B.Sc, B.A, B.Ed) is 3 years (6 semesters)
        }
      }

      for (let s = 1; s <= semCount; s++) {
        const semId = semestersMap[s];
        if (semId) {
          const mapping = await SemesterDegreeMapping.findOne({ degreeNameId: dn._id, semesterId: semId });
          if (!mapping) {
            await SemesterDegreeMapping.create({
              degreeNameId: dn._id,
              semesterId: semId,
              isActive: true
            });
            mappingsAdded++;
          }
        }
      }

      // Cleanup extra mappings that exceed the correct semCount
      const mappedSemesters = await SemesterDegreeMapping.find({ degreeNameId: dn._id }).populate('semesterId');
      for (const m of mappedSemesters) {
        if (!m.semesterId || m.semesterId.number > semCount) {
          await SemesterDegreeMapping.deleteOne({ _id: m._id });
        }
      }
    }

    res.status(201).json({
      message: `Successfully seeded semester degree mappings!`,
      mappingsAdded
    });
  } catch (error) {
    if (error.code === 11000) {
      let dupMessage = 'A duplicate entry already exists in the database.';
      if (error.keyValue) {
        const fields = Object.keys(error.keyValue);
        dupMessage = `Duplicate entry detected: ${fields.join(', ')} '${error.keyValue[fields[0]]}' already exists.`;
      }
      return res.status(409).json({ message: dupMessage });
    }
    res.status(500).json({ message: error.message });
  }
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
    const student = req.user;
    const records = await AttendanceRecord.find({ studentId: student._id, date: { $gte: session.startDate, $lte: session.endDate } });
    const holidays = await HolidayCalendar.find({ isActive: true });
    const isValidDtId = student.profile?.degreeTypeId && /^[0-9a-fA-F]{24}$/.test(student.profile.degreeTypeId.toString());
    const dt = isValidDtId ? await DegreeTypeMaster.findById(student.profile.degreeTypeId) : null;
    let timetables = [];
    let populatedTimetables = [];
    if (dt && dt.code !== 'PHD') {
      const studentMapping = await StudentSemesterMapping.findOne({
        studentId: student._id,
        sessionId: session._id,
        semesterId: student.profile?.semesterId
      });
      if (studentMapping && studentMapping.mappedSubjects?.length > 0) {
        const slotIds = studentMapping.mappedSubjects.map(ms => ms.timetableSlotId).filter(Boolean);
        timetables = await TimetableMaster.find({ _id: { $in: slotIds }, isActive: true });
        populatedTimetables = await TimetableMaster.find({ _id: { $in: slotIds }, isActive: true }).populate('facultyId', 'name');
      } else {
        const queryParams = {
          sessionId: session._id,
          degreeTypeId: student.profile?.degreeTypeId,
          degreeNameId: student.profile?.degreeNameId,
          semesterId: student.profile?.semesterId,
          isActive: true
        };
        timetables = await TimetableMaster.find(queryParams);
        populatedTimetables = await TimetableMaster.find(queryParams).populate('facultyId', 'name');
      }
    }
    const stats = await calculateStudentStats(student, session, records, holidays, timetables);

    // 1. Fetch last 5 leave requests
    const leaveRequests = await LeaveRequest.find({ studentId: student._id })
      .select('leaveType startDate endDate totalDays status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // 3. Compute week-over-week trends for subjects
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const subjectsWithTrend = (stats.subjectWiseAttendance || []).map(sub => {
      const slot = populatedTimetables.find(t => t._id.toString() === sub.timetableSlotId.toString());
      const facultyName = slot?.facultyId?.name || 'Unknown Faculty';
      
      const recentRecords = records.filter(r => new Date(r.date) >= oneWeekAgo && new Date(r.date) <= now);
      const pastRecords = records.filter(r => new Date(r.date) >= twoWeeksAgo && new Date(r.date) < oneWeekAgo);
      
      const getSlotPercentage = (recs) => {
        let total = 0, attended = 0;
        recs.forEach(r => {
          if (r.status === 'ON_LEAVE' && r.isLeaveOverride) {
            total++;
            attended++;
          } else {
            const c = r.classes.find(cl => cl.timetableSlotId?.toString() === sub.timetableSlotId.toString());
            if (c) {
              total++;
              if (c.selected) attended++;
            }
          }
        });
        return total > 0 ? (attended / total) * 100 : null;
      };
      
      const recentPct = getSlotPercentage(recentRecords);
      const pastPct = getSlotPercentage(pastRecords);
      
      let direction = 'stable';
      if (recentPct !== null && pastPct !== null) {
        if (recentPct > pastPct) direction = 'up';
        else if (recentPct < pastPct) direction = 'down';
      }
      
      return {
        ...sub,
        facultyName,
        trend: {
          thisWeek: recentPct !== null ? Math.round(recentPct) : sub.percentage,
          lastWeek: pastPct !== null ? Math.round(pastPct) : sub.percentage,
          direction
        }
      };
    });

    // 4. Calculate total projected remaining classes & target widget status
    let totalRemainingClasses = 0;
    subjectsWithTrend.forEach(sub => {
      const remaining = Math.max(0, (sub.totalClassesInSemester || 90) - sub.total);
      totalRemainingClasses += remaining;
    });

    const currentPercentage = stats.percentage;
    const requiredPercentage = stats.minRequiredPercentage;
    const safeAbsencesRemaining = stats.safeAbsencesRemaining;
    const classesToRecover = stats.consecutiveClassesToAttend;

    const isRecoverable = (currentPercentage >= requiredPercentage) || 
      (stats.presentDays + totalRemainingClasses >= Math.ceil(requiredPercentage * (stats.totalExpectedClasses + totalRemainingClasses) / 100));

    const formula = currentPercentage >= requiredPercentage 
      ? `You can miss up to ${safeAbsencesRemaining} more class(es) while maintaining at least ${requiredPercentage}% attendance.`
      : isRecoverable 
        ? `You must attend the next ${classesToRecover} consecutive class(es) to restore your attendance to ${requiredPercentage}%.`
        : `Warning: It is mathematically impossible to reach ${requiredPercentage}% attendance this semester.`;

    const targetWidget = {
      currentPercentage,
      requiredPercentage,
      safeAbsencesRemaining,
      classesToRecover,
      totalRemainingClasses,
      isRecoverable,
      formula
    };

    // 5. Populate calendar data grouped by months
    const monthMap = {};
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const sortedLogs = [...stats.logs].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedLogs.forEach(log => {
      const d = new Date(log.date);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthKey = `${year}-${month}`;
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          year,
          month,
          monthName: monthNames[month],
          days: []
        };
      }
      
      let finalStatus = log.status;
      if (log.status === 'FUTURE' || log.status === 'NOT_MARKED') {
        if (d.getDay() === 0) {
          finalStatus = 'WEEKEND';
        }
      }
      
      const isHoli = holidays.find(h => {
        const dStr = d.toISOString().split('T')[0];
        const hStart = new Date(h.startDate).toISOString().split('T')[0];
        const hEnd = new Date(h.endDate).toISOString().split('T')[0];
        return dStr >= hStart && dStr <= hEnd;
      });
      
      if (isHoli) {
        finalStatus = 'HOLIDAY';
      }
      
      monthMap[monthKey].days.push({
        date: log.date,
        dayOfMonth: d.getDate(),
        dayOfWeek: d.getDay(),
        status: finalStatus,
        remarks: log.remarks,
        classes: log.classes,
        holidayTitle: isHoli ? isHoli.title : null
      });
    });

    const calendarMonths = Object.values(monthMap);

    // 6. Compute weekly trends
    const weeklyTrend = [];
    const logsForTrend = [...stats.logs].sort((a,b) => new Date(a.date) - new Date(b.date));
    const chunkSize = 7;
    for (let i = 0; i < logsForTrend.length; i += chunkSize) {
      const chunk = logsForTrend.slice(i, i + chunkSize);
      if (chunk.length === 0) continue;
      
      let totalClassesInWeek = 0;
      let presentInWeek = 0;
      chunk.forEach(log => {
        if (log.status === 'PRESENT') {
          if (dt && dt.code === 'PHD') {
            totalClassesInWeek++;
            presentInWeek++;
          } else {
            (log.classes || []).forEach(c => {
              totalClassesInWeek++;
              if (c.selected) presentInWeek++;
            });
          }
        } else if (log.status === 'ABSENT') {
          if (dt && dt.code === 'PHD') {
            totalClassesInWeek++;
          } else {
            (log.classes || []).forEach(c => {
              totalClassesInWeek++;
              if (c.selected) presentInWeek++;
            });
          }
        }
      });
      
      const weekNum = Math.floor(i / chunkSize) + 1;
      const weekPerc = totalClassesInWeek > 0 ? Math.round((presentInWeek / totalClassesInWeek) * 100) : 100;
      weeklyTrend.push({
        weekLabel: `W${weekNum}`,
        percentage: weekPerc
      });
    }

    // 7. Upcoming classes (next 7 days)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const upcomingClasses = [];
    if (dt && dt.code !== 'PHD') {
      const today = new Date();
      for (let i = 1; i <= 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dayName = dayNames[d.getDay()];
        if (dayName === 'Sunday') continue;
        
        const dayHoli = holidays.find(h => {
          const dStr = d.toISOString().split('T')[0];
          const hStart = new Date(h.startDate).toISOString().split('T')[0];
          const hEnd = new Date(h.endDate).toISOString().split('T')[0];
          return dStr >= hStart && dStr <= hEnd;
        });
        if (dayHoli) continue;
        
        const daySlots = populatedTimetables.filter(t => t.dayOfWeek === dayName);
        daySlots.forEach(slot => {
          upcomingClasses.push({
            date: d.toISOString().split('T')[0],
            dayOfWeek: dayName,
            subjectName: slot.subjectName,
            subjectCode: slot.subjectCode,
            startTime: slot.startTime,
            endTime: slot.endTime,
            facultyName: slot.facultyId?.name || 'Unknown Faculty'
          });
        });
      }
    }

    res.status(200).json({
      ...stats,
      subjectWiseAttendance: subjectsWithTrend,
      leaveRequests,
      targetWidget,
      calendarMonths,
      weeklyTrend: weeklyTrend.slice(-8),
      upcomingClasses
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getFacultyDashboardStats = async (req, res) => {
  try {
    const session = await AcademicSessionMaster.findOne({ isCurrent: true });
    if (!session) return res.status(200).json({ error: 'No active session' });
    const facultyId = req.user._id;
    const deptId = req.user.department;

    // 1. All timetable courses for this faculty
    const courses = await TimetableMaster.find({ facultyId, isActive: true })
      .populate('degreeNameId', 'name')
      .populate('semesterId', 'name');

    // Get today's marked attendance for this faculty
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = dayNames[today.getDay()];
    const todayStr = toLocalDateString(today);
    const markedToday = await AttendanceRecord.find({
      facultyId,
      date: todayStr,
    }).select('timetableSlotId');

    // Compute student mappings and stats
    const allMappings = await StudentSemesterMapping.find({ sessionId: session._id });
    const courseStudentsMap = {};
    allMappings.forEach(mapping => {
      (mapping.mappedSubjects || []).forEach(sub => {
        const cid = sub.timetableSlotId?.toString();
        if (cid) {
          if (!courseStudentsMap[cid]) courseStudentsMap[cid] = [];
          courseStudentsMap[cid].push(mapping.studentId.toString());
        }
      });
    });

    const facultyCoursesIds = courses.map(c => c._id.toString());
    const targetStudentIdsSet = new Set();
    facultyCoursesIds.forEach(cid => {
      if (courseStudentsMap[cid]) {
        courseStudentsMap[cid].forEach(sid => targetStudentIdsSet.add(sid));
      }
    });
    const targetStudentIds = Array.from(targetStudentIdsSet);

    const allRecords = await AttendanceRecord.find({
      studentId: { $in: targetStudentIds },
      date: { $gte: session.startDate, $lte: session.endDate }
    });

    const recordsByStudent = {};
    allRecords.forEach(rec => {
      const sid = rec.studentId.toString();
      if (!recordsByStudent[sid]) recordsByStudent[sid] = [];
      recordsByStudent[sid].push(rec);
    });

    const holidays = await HolidayCalendar.find({ isActive: true });
    const studentsInfo = await User.find({ _id: { $in: targetStudentIds } }).select('profile department');
    const studentMap = {};
    studentsInfo.forEach(s => { studentMap[s._id.toString()] = s; });

    const degreeTypes = await DegreeTypeMaster.find().select('code');
    const degreeTypeMap = {};
    degreeTypes.forEach(dt => { degreeTypeMap[dt._id.toString()] = dt.code; });

    const activePolicies = await AttendancePolicyMaster.find({ isActive: true });
    const policyMap = {};
    activePolicies.forEach(p => { policyMap[p.programType] = p; });

    const preResolvedLectureDatesCache = {};
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
      preResolvedLectureDatesCache[day] = getTimetableLectures(session.startDate, session.endDate, day, holidays);
    });

    const courseStats = [];
    const totalDefaultersSet = new Set();
    const byCourseDefaulters = [];

    for (const course of courses) {
      const cid = course._id.toString();
      const sids = courseStudentsMap[cid] || [];
      
      let totalPercentageSum = 0;
      let courseDefaulterCount = 0;
      let activeStudentsCount = 0;
      const weeklyLogs = {};

      for (const sid of sids) {
        const student = studentMap[sid];
        if (!student) continue;
        
        const studentRecs = recordsByStudent[sid] || [];
        const degreeTypeIdStr = student.profile?.degreeTypeId?.toString();
        const degreeCode = degreeTypeIdStr ? degreeTypeMap[degreeTypeIdStr] : 'PG';
        const preResolvedPolicy = policyMap[degreeCode] || policyMap['PG'];
        const stats = await calculateStudentStats(student, session, studentRecs, holidays, [course], degreeCode, preResolvedPolicy, preResolvedLectureDatesCache);
        
        totalPercentageSum += stats.percentage;
        activeStudentsCount++;
        
        if (stats.isDefaulter) {
          courseDefaulterCount++;
          totalDefaultersSet.add(sid);
        }

        (stats.logs || []).forEach((log, idx) => {
          const weekNum = Math.floor(idx / 7) + 1;
          const weekLabel = `W${weekNum}`;
          if (!weeklyLogs[weekLabel]) {
            weeklyLogs[weekLabel] = { sum: 0, count: 0 };
          }
          if (log.status === 'PRESENT') {
            weeklyLogs[weekLabel].sum += 100;
            weeklyLogs[weekLabel].count++;
          } else if (log.status === 'ABSENT') {
            weeklyLogs[weekLabel].count++;
          }
        });
      }
      
      const avgPercentage = activeStudentsCount > 0 ? parseFloat((totalPercentageSum / activeStudentsCount).toFixed(2)) : 100;
      
      const trendArray = Object.entries(weeklyLogs).map(([label, data]) => ({
        weekLabel: label,
        percentage: data.count > 0 ? Math.round(data.sum / data.count) : 100
      })).slice(-8);

      const hasMarkedToday = markedToday.some(m => m.timetableSlotId?.toString() === cid);
      
      courseStats.push({
        timetableSlotId: course._id,
        subjectCode: course.subjectCode,
        subjectName: course.subjectName,
        degreeName: course.degreeNameId?.name || 'N/A',
        semesterName: course.semesterId?.name || 'N/A',
        totalStudents: activeStudentsCount,
        classesHeld: activeStudentsCount > 0 ? (recordsByStudent[sids[0]] || []).length : 0,
        avgAttendancePercentage: avgPercentage,
        defaulterCount: courseDefaulterCount,
        markingStatus: hasMarkedToday ? 'FULLY_MARKED' : 'NOT_MARKED',
        weeklyTrend: trendArray
      });
      
      if (courseDefaulterCount > 0) {
        byCourseDefaulters.push({
          subjectName: course.subjectName,
          count: courseDefaulterCount
        });
      }
    }

    // 2. Next week's classes — compute dates for next 7 days
    const nextWeekClasses = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = dayNames[d.getDay()];
      if (dayName === 'Sunday') continue;
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
    nextWeekClasses.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    const pendingLeavesCount = await LeaveRequest.countDocuments({ currentAssigneeId: facultyId, status: { $in: ['PENDING_FACULTY', 'PENDING'] } });
    const pendingCorrectionsCount = await AttendanceCorrection.countDocuments({ facultyId, status: 'PENDING_FACULTY' });
    const lowAttendanceCount = totalDefaultersSet.size;

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
      courseStats,
      defaulterSummary: {
        totalDefaulters: totalDefaultersSet.size,
        byCourse: byCourseDefaulters
      }
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
    const degreeTypeIds = [...new Set(
      students
        .map(s => s.profile?.degreeTypeId?.toString())
        .filter(id => id && /^[0-9a-fA-F]{24}$/.test(id))
    )];
    const degreeTypes = degreeTypeIds.length > 0
      ? await DegreeTypeMaster.find({ _id: { $in: degreeTypeIds } }).select('code')
      : [];
    const degreeTypeMap = {};
    for (const dt of degreeTypes) degreeTypeMap[dt._id.toString()] = dt.code;

    // Batch fetch: all active timetables
    const allTimetables = await TimetableMaster.find({ isActive: true })
      .select('sessionId semesterId dayOfWeek');

    const activePolicies = await AttendancePolicyMaster.find({ isActive: true });
    const policyMap = {};
    activePolicies.forEach(p => { policyMap[p.programType] = p; });

    // Batch fetch: holidays
    const holidays = await HolidayCalendar.find({ isActive: true });

    const studentSemesterMap = {};
    for (const s of students) {
      studentSemesterMap[s._id.toString()] = s.profile?.semesterId?.toString() || null;
    }

    const preResolvedLectureDatesCache = {};
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
      preResolvedLectureDatesCache[day] = getTimetableLectures(session.startDate, session.endDate, day, holidays);
    });

    const studentStatsList = [];

    for (const student of students) {
      const sid = student._id.toString();
      const records = recordsByStudent[sid] || [];
      const degreeCode = student.profile?.degreeTypeId ? degreeTypeMap[student.profile.degreeTypeId.toString()] : null;
      const isPhD = degreeCode === 'PHD';
      const preResolvedPolicy = policyMap[degreeCode] || policyMap['PG'];

      // Get timetables for this student's semester
      const timetables = !isPhD ? allTimetables.filter(t =>
        t.sessionId?.toString() === session._id.toString() &&
        (!t.semesterId || t.semesterId.toString() === studentSemesterMap[sid])
      ) : [];

      const stats = await calculateStudentStats(student, session, records, holidays, timetables, degreeCode, preResolvedPolicy, preResolvedLectureDatesCache);

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
        auditLogs: [],
        facultyStats: [],
        courseStats: [],
        weeklyTrend: []
      });
    }

    const deptName = req.user.department;
    const deptId = req.user.departmentId;

    const students = await User.find({ department: deptName, role: 'STUDENT', isActive: true })
      .select('name profile email username department');
    const studentIds = students.map(s => s._id);

    const holidays = await HolidayCalendar.find({ isActive: true });
    const allTimetables = await TimetableMaster.find({ sessionId: session._id, isActive: true })
      .populate('facultyId', 'name')
      .populate('degreeNameId', 'name')
      .populate('semesterId', 'name');

    const allMappings = await StudentSemesterMapping.find({ sessionId: session._id });
    const studentSlotsMap = {};
    allMappings.forEach(m => {
      studentSlotsMap[m.studentId.toString()] = m.mappedSubjects || [];
    });

    const allRecords = await AttendanceRecord.find({
      studentId: { $in: studentIds },
      date: { $gte: session.startDate, $lte: session.endDate }
    });

    const recordsByStudent = {};
    allRecords.forEach(rec => {
      const sid = rec.studentId.toString();
      if (!recordsByStudent[sid]) recordsByStudent[sid] = [];
      recordsByStudent[sid].push(rec);
    });

    const degreeTypes = await DegreeTypeMaster.find().select('code');
    const degreeTypeMap = {};
    degreeTypes.forEach(dt => { degreeTypeMap[dt._id.toString()] = dt.code; });

    const activePolicies = await AttendancePolicyMaster.find({ isActive: true });
    const policyMap = {};
    activePolicies.forEach(p => { policyMap[p.programType] = p; });

    const preResolvedLectureDatesCache = {};
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
      preResolvedLectureDatesCache[day] = getTimetableLectures(session.startDate, session.endDate, day, holidays);
    });

    const scholarStatsList = [];
    const defaulters = [];
    const warnings = [];
    const weeklyLogs = {};
    const facultyDataMap = {};
    const courseDataMap = {};

    for (const student of students) {
      const sid = student._id.toString();
      const records = recordsByStudent[sid] || [];
      const degreeTypeIdStr = student.profile?.degreeTypeId?.toString();
      const degreeCode = degreeTypeIdStr ? degreeTypeMap[degreeTypeIdStr] : 'PG';
      const isPhD = degreeCode === 'PHD';
      const preResolvedPolicy = policyMap[degreeCode] || policyMap['PG'];

      let studentTimetables = [];
      if (!isPhD && studentSlotsMap[sid]) {
        const slotIds = studentSlotsMap[sid].map(s => s.timetableSlotId?.toString());
        studentTimetables = allTimetables.filter(t => slotIds.includes(t._id.toString()));
      }

      const stats = await calculateStudentStats(student, session, records, holidays, studentTimetables, degreeCode, preResolvedPolicy, preResolvedLectureDatesCache);
      
      const sData = {
        studentId: student._id,
        name: student.name,
        enrollmentNumber: student.profile?.enrollmentNumber || 'N/A',
        email: student.profile?.email || student.username,
        percentage: stats.percentage,
        isDefaulter: stats.isDefaulter,
        isWarning: stats.isWarning
      };

      scholarStatsList.push(sData);
      if (stats.isDefaulter) defaulters.push(sData);
      if (stats.isWarning) warnings.push(sData);

      // Group weekly logs for HOD trend
      (stats.logs || []).forEach((log, idx) => {
        const weekLabel = `W${Math.floor(idx / 7) + 1}`;
        if (!weeklyLogs[weekLabel]) {
          weeklyLogs[weekLabel] = { sum: 0, count: 0 };
        }
        if (log.status === 'PRESENT') {
          weeklyLogs[weekLabel].sum += 100;
          weeklyLogs[weekLabel].count++;
        } else if (log.status === 'ABSENT') {
          weeklyLogs[weekLabel].count++;
        }
      });

      // Group subject-wise statistics for comparisons
      if (!isPhD) {
        (stats.subjectWiseAttendance || []).forEach(sub => {
          const slotId = sub.timetableSlotId?.toString();
          const slot = allTimetables.find(t => t._id.toString() === slotId);
          if (!slot) return;

          const fid = slot.facultyId?._id?.toString() || slot.facultyId?.toString();
          const fname = slot.facultyId?.name || 'Unknown Faculty';

          if (fid) {
            if (!facultyDataMap[fid]) {
              facultyDataMap[fid] = {
                facultyId: fid,
                facultyName: fname,
                coursesSet: new Set(),
                studentsCount: 0,
                presentSum: 0,
                totalSum: 0,
                defaulterCount: 0
              };
            }
            facultyDataMap[fid].coursesSet.add(slotId);
            facultyDataMap[fid].studentsCount++;
            facultyDataMap[fid].presentSum += sub.attended;
            facultyDataMap[fid].totalSum += sub.total;
            if (sub.percentage < 75) {
              facultyDataMap[fid].defaulterCount++;
            }
          }

          if (slotId) {
            if (!courseDataMap[slotId]) {
              courseDataMap[slotId] = {
                timetableSlotId: slotId,
                subjectCode: slot.subjectCode,
                subjectName: slot.subjectName,
                facultyName: fname,
                degreeName: slot.degreeNameId?.name || 'N/A',
                semesterName: slot.semesterId?.name || 'N/A',
                enrolledStudents: 0,
                presentSum: 0,
                totalSum: 0,
                defaulterCount: 0
              };
            }
            courseDataMap[slotId].enrolledStudents++;
            courseDataMap[slotId].presentSum += sub.attended;
            courseDataMap[slotId].totalSum += sub.total;
            if (sub.percentage < 75) {
              courseDataMap[slotId].defaulterCount++;
            }
          }
        });
      }
    }

    const avg = scholarStatsList.length > 0 
      ? parseFloat((scholarStatsList.reduce((acc, curr) => acc + curr.percentage, 0) / scholarStatsList.length).toFixed(2)) 
      : 100;

    const auditLogs = await AttendanceRecord.find({ departmentId: deptId })
      .populate('studentId', 'name')
      .populate('markedBy', 'name')
      .sort({ updatedAt: -1 })
      .limit(20);

    const facultyStats = Object.values(facultyDataMap).map(f => ({
      facultyId: f.facultyId,
      facultyName: f.facultyName,
      coursesCount: f.coursesSet.size,
      totalStudents: f.studentsCount,
      avgPercentage: f.totalSum > 0 ? Math.round((f.presentSum / f.totalSum) * 100) : 100,
      defaulterCount: f.defaulterCount
    }));

    const courseStats = Object.values(courseDataMap).map(c => ({
      timetableSlotId: c.timetableSlotId,
      subjectCode: c.subjectCode,
      subjectName: c.subjectName,
      facultyName: c.facultyName,
      degreeName: c.degreeName,
      semesterName: c.semesterName,
      enrolledStudents: c.enrolledStudents,
      avgPercentage: c.totalSum > 0 ? Math.round((c.presentSum / c.totalSum) * 100) : 100,
      defaulterCount: c.defaulterCount
    }));

    const weeklyTrend = Object.entries(weeklyLogs).map(([label, data]) => ({
      weekLabel: label,
      percentage: data.count > 0 ? Math.round(data.sum / data.count) : 100
    })).slice(-8);

    const pendingLeaveCount = await LeaveRequest.countDocuments({ departmentId: deptId, status: 'PENDING_HOD' });
    const pendingCorrectionCount = await AttendanceCorrection.countDocuments({ status: 'PENDING_HOD' });

    res.status(200).json({
      sessionName: session?.sessionName,
      totalStudentsCount: students.length,
      averageDeptPercentage: avg,
      defaulterCount: defaulters.length,
      warningCount: warnings.length,
      defaulters,
      warnings,
      rosterStats: scholarStatsList,
      auditLogs,
      facultyStats,
      courseStats,
      weeklyTrend,
      pendingLeaveCount,
      pendingCorrectionCount
    });
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

exports.getFacultyCourseDefaulters = async (req, res) => {
  try {
    const session = await AcademicSessionMaster.findOne({ isCurrent: true });
    if (!session) return res.status(200).json([]);
    const courseId = req.params.courseId;

    const course = await TimetableMaster.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const mappings = await StudentSemesterMapping.find({
      sessionId: session._id,
      'mappedSubjects.timetableSlotId': courseId
    });
    const studentIds = mappings.map(m => m.studentId);

    const students = await User.find({ _id: { $in: studentIds } }).select('name profile email username');
    const records = await AttendanceRecord.find({
      studentId: { $in: studentIds },
      date: { $gte: session.startDate, $lte: session.endDate }
    });

    const recordsByStudent = {};
    records.forEach(rec => {
      const sid = rec.studentId.toString();
      if (!recordsByStudent[sid]) recordsByStudent[sid] = [];
      recordsByStudent[sid].push(rec);
    });

    const degreeTypes = await DegreeTypeMaster.find().select('code');
    const degreeTypeMap = {};
    degreeTypes.forEach(dt => { degreeTypeMap[dt._id.toString()] = dt.code; });

    const activePolicies = await AttendancePolicyMaster.find({ isActive: true });
    const policyMap = {};
    activePolicies.forEach(p => { policyMap[p.programType] = p; });

    const holidays = await HolidayCalendar.find({ isActive: true });
    const list = [];

    for (const student of students) {
      const studentRecs = recordsByStudent[student._id.toString()] || [];
      const degreeCode = student.profile?.degreeTypeId ? degreeTypeMap[student.profile.degreeTypeId.toString()] : null;
      const preResolvedPolicy = policyMap[degreeCode] || policyMap['PG'];
      const stats = await calculateStudentStats(student, session, studentRecs, holidays, [course], degreeCode, preResolvedPolicy);
      
      if (stats.isDefaulter) {
        const presentLogs = (stats.logs || []).filter(l => l.status === 'PRESENT');
        const lastAttendedDate = presentLogs.length > 0 ? presentLogs[0].date : null;

        list.push({
          studentId: student._id,
          studentName: student.name,
          enrollmentNumber: student.profile?.enrollmentNumber || 'N/A',
          email: student.profile?.email || student.username,
          attendedClasses: stats.presentDays,
          totalClasses: stats.totalExpectedClasses,
          percentage: stats.percentage,
          lastAttendedDate
        });
      }
    }

    res.status(200).json(list);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getHodDrillDown = async (req, res) => {
  try {
    const session = await AcademicSessionMaster.findOne({ isCurrent: true });
    if (!session) return res.status(200).json([]);
    const { view, id } = req.query;

    const degreeTypes = await DegreeTypeMaster.find().select('code');
    const degreeTypeMap = {};
    degreeTypes.forEach(dt => { degreeTypeMap[dt._id.toString()] = dt.code; });

    const activePolicies = await AttendancePolicyMaster.find({ isActive: true });
    const policyMap = {};
    activePolicies.forEach(p => { policyMap[p.programType] = p; });

    if (view === 'faculty') {
      const courses = await TimetableMaster.find({ facultyId: id, sessionId: session._id, isActive: true });
      const courseIds = courses.map(c => c._id.toString());

      const mappings = await StudentSemesterMapping.find({
        sessionId: session._id,
        'mappedSubjects.timetableSlotId': { $in: courseIds }
      });
      const studentIds = mappings.map(m => m.studentId);

      const students = await User.find({ _id: { $in: studentIds } }).select('name profile email username');
      const records = await AttendanceRecord.find({
        studentId: { $in: studentIds },
        date: { $gte: session.startDate, $lte: session.endDate }
      });

      const recordsByStudent = {};
      records.forEach(rec => {
        const sid = rec.studentId.toString();
        if (!recordsByStudent[sid]) recordsByStudent[sid] = [];
        recordsByStudent[sid].push(rec);
      });

      const holidays = await HolidayCalendar.find({ isActive: true });
      const list = [];

      for (const student of students) {
        const studentRecs = recordsByStudent[student._id.toString()] || [];
        const degreeCode = student.profile?.degreeTypeId ? degreeTypeMap[student.profile.degreeTypeId.toString()] : null;
        const preResolvedPolicy = policyMap[degreeCode] || policyMap['PG'];
        const stats = await calculateStudentStats(student, session, studentRecs, holidays, courses, degreeCode, preResolvedPolicy);

        list.push({
          studentId: student._id,
          studentName: student.name,
          enrollmentNumber: student.profile?.enrollmentNumber || 'N/A',
          email: student.profile?.email || student.username,
          percentage: stats.percentage,
          isDefaulter: stats.isDefaulter
        });
      }
      return res.status(200).json(list);
    }

    if (view === 'course') {
      const course = await TimetableMaster.findById(id);
      if (!course) return res.status(404).json({ message: 'Course not found' });

      const mappings = await StudentSemesterMapping.find({
        sessionId: session._id,
        'mappedSubjects.timetableSlotId': id
      });
      const studentIds = mappings.map(m => m.studentId);

      const students = await User.find({ _id: { $in: studentIds } }).select('name profile email username');
      const records = await AttendanceRecord.find({
        studentId: { $in: studentIds },
        date: { $gte: session.startDate, $lte: session.endDate }
      });

      const recordsByStudent = {};
      records.forEach(rec => {
        const sid = rec.studentId.toString();
        if (!recordsByStudent[sid]) recordsByStudent[sid] = [];
        recordsByStudent[sid].push(rec);
      });

      const holidays = await HolidayCalendar.find({ isActive: true });
      const list = [];

      for (const student of students) {
        const studentRecs = recordsByStudent[student._id.toString()] || [];
        const degreeCode = student.profile?.degreeTypeId ? degreeTypeMap[student.profile.degreeTypeId.toString()] : null;
        const preResolvedPolicy = policyMap[degreeCode] || policyMap['PG'];
        const stats = await calculateStudentStats(student, session, studentRecs, holidays, [course], degreeCode, preResolvedPolicy);

        list.push({
          studentId: student._id,
          studentName: student.name,
          enrollmentNumber: student.profile?.enrollmentNumber || 'N/A',
          email: student.profile?.email || student.username,
          percentage: stats.percentage,
          isDefaulter: stats.isDefaulter
        });
      }
      return res.status(200).json(list);
    }

    res.status(400).json({ message: 'Invalid view parameter' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
