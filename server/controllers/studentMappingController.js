const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const TimetableMaster = require('../models/attendance/TimetableMaster');
const DegreeTypeMaster = require('../models/attendance/DegreeTypeMaster');
const DegreeNameMaster = require('../models/attendance/DegreeNameMaster');
const SemesterMaster = require('../models/attendance/SemesterMaster');
const AcademicSessionMaster = require('../models/attendance/AcademicSessionMaster');
const StudentSemesterMapping = require('../models/attendance/StudentSemesterMapping');
const SemesterDegreeMapping = require('../models/attendance/SemesterDegreeMapping');

// Helper: Convert "HH:MM" string to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Helper: Check if two time intervals overlap
const isTimeslotOverlapping = (s1, e1, s2, e2) => {
  const start1 = timeToMinutes(s1);
  const end1 = timeToMinutes(e1);
  const start2 = timeToMinutes(s2);
  const end2 = timeToMinutes(e2);
  return start1 < end2 && end1 > start2;
};

// ==========================================
// 1. GET FILTER DATA (sessions, degree types, names, semesters)
// ==========================================
exports.getFilterData = async (req, res) => {
  try {
    const sessions = await AcademicSessionMaster.find({ isActive: { $ne: false } }).sort({ startDate: -1 });
    
    const degreeNameQuery = { isActive: true };
    if ((req.user.role === 'FACULTY' || req.user.role === 'HOD') && req.user.departmentId) {
      degreeNameQuery.departmentId = req.user.departmentId;
    }
    const degreeNames = await DegreeNameMaster.find(degreeNameQuery).populate('degreeTypeId').populate('departmentId');
    
    // Filter degree types by department
    let degreeTypeQuery = { isActive: true };
    if ((req.user.role === 'FACULTY' || req.user.role === 'HOD') && req.user.departmentId) {
      const degreeTypeIds = degreeNames.map(dn => dn.degreeTypeId?._id || dn.degreeTypeId).filter(Boolean);
      degreeTypeQuery._id = { $in: degreeTypeIds };
    }
    const degreeTypes = await DegreeTypeMaster.find(degreeTypeQuery);

    // Filter semesters and mappings by department
    let semesterDegreeMappingQuery = { isActive: true };
    let semesterQuery = { isActive: true };
    if ((req.user.role === 'FACULTY' || req.user.role === 'HOD') && req.user.departmentId) {
      const degreeNameIds = degreeNames.map(dn => dn._id);
      semesterDegreeMappingQuery.degreeNameId = { $in: degreeNameIds };
      
      const mappings = await SemesterDegreeMapping.find({ degreeNameId: { $in: degreeNameIds }, isActive: true });
      const semesterIds = mappings.map(m => m.semesterId).filter(Boolean);
      semesterQuery._id = { $in: semesterIds };
    }
    
    const semesters = await SemesterMaster.find(semesterQuery).sort({ number: 1 });
    const semesterDegreeMappings = await SemesterDegreeMapping.find(semesterDegreeMappingQuery)
      .populate('degreeNameId')
      .populate('semesterId');

    res.status(200).json({ sessions, degreeTypes, degreeNames, semesters, semesterDegreeMappings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. PREVIEW: Get faculty subjects + eligible students
// ==========================================
exports.getPreview = async (req, res) => {
  try {
    const { sessionId, degreeTypeId, degreeNameId, semesterId } = req.query;
    const departmentId = req.user.departmentId;
    const facultyId = req.user._id;

    if (!sessionId || !degreeTypeId || !degreeNameId || !semesterId) {
      return res.status(400).json({ message: 'Please select all filter criteria.' });
    }

    // 1. Get subjects mapped in TimetableMaster (restrict by facultyId only for regular faculty)
    const subjectQuery = {
      sessionId,
      degreeTypeId,
      degreeNameId,
      semesterId,
      departmentId,
      isActive: true
    };
    if (req.user.role === 'FACULTY') {
      subjectQuery.facultyId = facultyId;
    }
    const subjects = await TimetableMaster.find(subjectQuery).populate('facultyId', 'name');

    // 1a. Validate timetable exists for these criteria
    if (!subjects || subjects.length === 0) {
      return res.status(404).json({
        message: 'No timetable entries found for the selected criteria (Session + Degree Type + Degree Name + Semester). Please ensure the HOD has created the timetable for this combination before mapping students.',
        noTimetable: true
      });
    }

    // 2. Get all students matching the criteria
    const allStudents = await User.find({
      role: 'STUDENT',
      department: req.user.department,
      isActive: true,
      isVerified: true,
      'profile.degreeTypeId': degreeTypeId,
      'profile.degreeNameId': degreeNameId,
      // Note: semesterId not on student profile yet - that's what we're mapping!
    }).select('name username profile');

    const studentIds = allStudents.map(s => s._id);

    // 3. Get existing mappings for these students in this session (across all degrees/semesters)
    const allSessionStudentMappings = await StudentSemesterMapping.find({
      studentId: { $in: studentIds },
      sessionId
    }).populate('mappedSubjects.timetableSlotId');

    // Mappings strictly matching the selected filter criteria
    const existingMappings = allSessionStudentMappings.filter(m => 
      m.degreeTypeId?.toString() === degreeTypeId &&
      m.degreeNameId?.toString() === degreeNameId &&
      m.semesterId?.toString() === semesterId &&
      (!departmentId || !m.departmentId || m.departmentId.toString() === departmentId.toString())
    );

    // 4. Build map of which subjects are already assigned to which students
    const existingSubjectsMap = {};
    const studentsWithMapping = new Set();
    
    existingMappings.forEach(mapping => {
      studentsWithMapping.add(mapping.studentId.toString());
      mapping.mappedSubjects.forEach(sub => {
        const slotId = sub.timetableSlotId?._id ? sub.timetableSlotId._id.toString() : sub.timetableSlotId?.toString();
        if (slotId) {
          if (!existingSubjectsMap[slotId]) {
            existingSubjectsMap[slotId] = new Set();
          }
          existingSubjectsMap[slotId].add(mapping.studentId.toString());
        }
      });
    });

    // Build map of all active timetable slots assigned to each student across this session
    const studentSlotsMap = {};
    allSessionStudentMappings.forEach(m => {
      const stId = m.studentId.toString();
      if (!studentSlotsMap[stId]) studentSlotsMap[stId] = [];
      (m.mappedSubjects || []).forEach(ms => {
        const slot = ms.timetableSlotId;
        if (slot && typeof slot === 'object' && slot.isActive !== false) {
          studentSlotsMap[stId].push({
            _id: slot._id.toString(),
            subjectCode: slot.subjectCode || ms.subjectCode,
            subjectName: slot.subjectName || ms.subjectName,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime
          });
        }
      });
    });

    // 5. Determine which subjects are already partially/fully mapped
    const totalStudentCount = allStudents.length;
    const subjectsWithMappingInfo = subjects.map(sub => {
      const slotId = sub._id.toString();
      const mappedStudentIds = existingSubjectsMap[slotId] || new Set();
      return {
        _id: sub._id,
        subjectCode: sub.subjectCode,
        subjectName: sub.subjectName,
        startTime: sub.startTime,
        endTime: sub.endTime,
        dayOfWeek: sub.dayOfWeek,
        facultyId: sub.facultyId,
        isPartiallyMapped: mappedStudentIds.size > 0 && mappedStudentIds.size < totalStudentCount,
        isFullyMapped: mappedStudentIds.size >= totalStudentCount,
        mappedStudentCount: mappedStudentIds.size,
        mappedStudentIds: [...mappedStudentIds]
      };
    });

    // 6. Compute timetable schedule clashes for each student against candidate subjects
    // studentClashes: { [studentId]: { [candidateSlotId]: { clashingSubjectName, clashingSubjectCode, dayOfWeek, startTime, endTime } } }
    const studentClashes = {};
    allStudents.forEach(st => {
      const stId = st._id.toString();
      const existingSlots = studentSlotsMap[stId] || [];
      subjects.forEach(candSub => {
        const candId = candSub._id.toString();
        // If student is already mapped to this exact candidate slot, not a clash
        const alreadyMapped = existingSlots.some(es => es._id === candId);
        if (alreadyMapped) return;

        // Check if student has another mapped slot on same day with overlapping time interval
        const clashingSlot = existingSlots.find(es =>
          es._id !== candId &&
          es.dayOfWeek === candSub.dayOfWeek &&
          isTimeslotOverlapping(es.startTime, es.endTime, candSub.startTime, candSub.endTime)
        );

        if (clashingSlot) {
          if (!studentClashes[stId]) studentClashes[stId] = {};
          studentClashes[stId][candId] = {
            clashingSubjectName: clashingSlot.subjectName,
            clashingSubjectCode: clashingSlot.subjectCode,
            dayOfWeek: clashingSlot.dayOfWeek,
            startTime: clashingSlot.startTime,
            endTime: clashingSlot.endTime
          };
        }
      });
    });

    res.status(200).json({
      subjects: subjectsWithMappingInfo,
      students: allStudents,
      existingMappingsCount: existingMappings.length,
      studentClashes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 3. SAVE MAPPING
// ==========================================
exports.saveMapping = async (req, res) => {
  try {
    const { sessionId, degreeTypeId, degreeNameId, semesterId, subjectIds, studentIds } = req.body;
    const facultyId = req.user._id;
    const departmentId = req.user.departmentId;

    // Validate required fields
    if (!sessionId || !degreeTypeId || !degreeNameId || !semesterId) {
      return res.status(400).json({ message: 'Missing required filter criteria.' });
    }
    if (!subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0) {
      return res.status(400).json({ message: 'Please select at least one subject to map.' });
    }
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Please select at least one student to map.' });
    }

    // Get the timetable subjects for validation
    const subjectQuery = {
      _id: { $in: subjectIds },
      sessionId, degreeTypeId, degreeNameId, semesterId,
      departmentId, isActive: true
    };
    if (req.user.role === 'FACULTY') {
      subjectQuery.facultyId = facultyId;
    }
    const subjects = await TimetableMaster.find(subjectQuery);

    if (subjects.length !== subjectIds.length) {
      return res.status(400).json({ 
        message: req.user.role === 'FACULTY'
          ? 'One or more selected subjects are invalid or not assigned to you for this criteria.'
          : 'One or more selected subjects are invalid for this criteria.'
      });
    }

    // Check internal timetable clashes among the selected subjects themselves
    for (let i = 0; i < subjects.length; i++) {
      for (let j = i + 1; j < subjects.length; j++) {
        const s1 = subjects[i];
        const s2 = subjects[j];
        if (s1.dayOfWeek === s2.dayOfWeek && isTimeslotOverlapping(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
          return res.status(400).json({
            message: `Timetable Clash Barrier: Selected subjects "${s1.subjectName}" and "${s2.subjectName}" have overlapping schedules on ${s1.dayOfWeek} (${s1.startTime}-${s1.endTime} vs ${s2.startTime}-${s2.endTime}). Students cannot be mapped to overlapping classes simultaneously.`
          });
        }
      }
    }

    // Validate that all students belong to the selected degree type and degree name and are verified
    const invalidStudents = await User.find({
      _id: { $in: studentIds },
      $or: [
        { 'profile.degreeTypeId': { $ne: degreeTypeId.toString() } },
        { 'profile.degreeNameId': { $ne: degreeNameId.toString() } },
        { isVerified: { $ne: true } }
      ]
    });

    if (invalidStudents.length > 0) {
      return res.status(400).json({
        message: `Validation failed: Some selected students are either not verified or do not belong to the selected degree type/name.`
      });
    }

    // Check existing mappings to detect conflicts
    const existingMappings = await StudentSemesterMapping.find({
      sessionId, degreeTypeId, degreeNameId, semesterId, departmentId
    });

    // Build conflict map: subjectId -> set of studentIds already mapped
    const conflictMap = {};
    existingMappings.forEach(mapping => {
      const stId = mapping.studentId.toString();
      mapping.mappedSubjects.forEach(sub => {
        const slotId = sub.timetableSlotId?.toString();
        if (!conflictMap[slotId]) conflictMap[slotId] = new Set();
        conflictMap[slotId].add(stId);
      });
    });

    // Check if any selected subjects already have existing mappings to selected students
    const subjectsWithPreExistingMappings = [];
    subjectIds.forEach(sid => {
      if (conflictMap[sid] && conflictMap[sid].size > 0) {
        subjectsWithPreExistingMappings.push(sid);
      }
    });

    if (subjectIds.length > 1 && subjectsWithPreExistingMappings.length > 0) {
      const conflictedSubjectNames = subjects
        .filter(s => subjectsWithPreExistingMappings.includes(s._id.toString()))
        .map(s => `${s.subjectName} (${s.subjectCode})`);
      
      return res.status(409).json({
        message: `Cannot map multiple subjects at once because some subjects already have students assigned. ` +
          `Please select only one subject at a time for these subjects: ${conflictedSubjectNames.join(', ')}. ` +
          `Alternatively, select a single subject to map remaining unassigned students.`,
        conflictedSubjects: subjectsWithPreExistingMappings,
        requiresSingleSelection: true
      });
    }

    // For single subject: filter out students who already have this subject mapped
    let eligibleStudentIds = [...studentIds];
    if (subjectIds.length === 1) {
      const singleSubjectId = subjectIds[0];
      if (conflictMap[singleSubjectId] && conflictMap[singleSubjectId].size > 0) {
        eligibleStudentIds = studentIds.filter(
          sid => !conflictMap[singleSubjectId].has(sid)
        );
      }
    }

    if (eligibleStudentIds.length === 0) {
      return res.status(400).json({
        message: 'All selected students already have this subject mapped. No new mappings to create.'
      });
    }

    // TIMETABLE CLASH BARRIER: Check each eligible student against all their active timetable slots in this session
    const allStudentExistingMappings = await StudentSemesterMapping.find({
      studentId: { $in: eligibleStudentIds },
      sessionId
    }).populate('mappedSubjects.timetableSlotId');

    for (const stId of eligibleStudentIds) {
      const userMappings = allStudentExistingMappings.filter(m => m.studentId.toString() === stId.toString());
      const existingSlots = [];
      userMappings.forEach(m => {
        (m.mappedSubjects || []).forEach(ms => {
          const slot = ms.timetableSlotId;
          if (slot && typeof slot === 'object' && slot.isActive !== false) {
            existingSlots.push(slot);
          }
        });
      });

      for (const newSub of subjects) {
        for (const existingSlot of existingSlots) {
          if (existingSlot._id.toString() === newSub._id.toString()) continue; // already mapped, handled above
          if (
            existingSlot.dayOfWeek === newSub.dayOfWeek &&
            isTimeslotOverlapping(existingSlot.startTime, existingSlot.endTime, newSub.startTime, newSub.endTime)
          ) {
            const studentUser = await User.findById(stId).select('name username');
            return res.status(409).json({
              message: `Timetable Clash Barrier: Student ${studentUser?.name || 'Candidate'} (${studentUser?.username || stId}) cannot be mapped to "${newSub.subjectName}". They are already enrolled in "${existingSlot.subjectName}" on ${existingSlot.dayOfWeek} (${existingSlot.startTime} - ${existingSlot.endTime}), which clashes with "${newSub.subjectName}" (${newSub.startTime} - ${newSub.endTime}).`
            });
          }
        }
      }
    }

    // Get the subject data for the selected subjects
    const selectedSubjectData = subjects.map(s => ({
      timetableSlotId: s._id,
      subjectCode: s.subjectCode,
      subjectName: s.subjectName
    }));

    // Upsert mappings for each eligible student
    const operations = eligibleStudentIds.map(studentId => ({
      updateOne: {
        filter: {
          studentId,
          sessionId, degreeTypeId, degreeNameId, semesterId
        },
        update: {
          $addToSet: {
            mappedSubjects: { $each: selectedSubjectData }
          },
          $set: {
            facultyId, departmentId, mappedBy: facultyId, mappedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    await StudentSemesterMapping.bulkWrite(operations);

    // Notify mapped students
    const { createNotification } = require('./notificationController');
    const subjectNames = selectedSubjectData.map(s => s.subjectName).join(', ');
    for (const studentId of eligibleStudentIds) {
      await createNotification({
        recipient: studentId,
        title: '📚 Subject Mapping Update',
        message: `You have been mapped to the following subject(s): ${subjectNames}.`,
        type: 'MAPPING_UPDATE',
        link: 'profile',
        source: 'SCHOLAR_TRACK'
      });
    }

    const skippedCount = studentIds.length - eligibleStudentIds.length;
    let message = `Successfully mapped ${eligibleStudentIds.length} student(s) to ${selectedSubjectData.length} subject(s).`;
    if (skippedCount > 0) {
      message += ` ${skippedCount} student(s) were skipped as they already had the mapping.`;
    }

    res.status(200).json({ message, mappedCount: eligibleStudentIds.length, skippedCount });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A mapping already exists for this combination.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 4. GET MAPPED RECORDS (for details tab)
// ==========================================
exports.getMappedRecords = async (req, res) => {
  try {
    const { sessionId, degreeTypeId, degreeNameId, semesterId } = req.query;
    const departmentId = req.user.departmentId;
    const facultyId = req.user._id;

    if (!sessionId || !degreeTypeId || !degreeNameId || !semesterId) {
      return res.status(400).json({ message: 'Please select all filter criteria.' });
    }

    // 1. Get subjects mapped in TimetableMaster (restrict by facultyId only for regular faculty)
    const timetableQuery = {
      sessionId, degreeTypeId, degreeNameId, semesterId,
      departmentId, isActive: true
    };
    if (req.user.role === 'FACULTY') {
      timetableQuery.facultyId = facultyId;
    }
    const facultySubjects = await TimetableMaster.find(timetableQuery).populate('facultyId', 'name');
    const subjectSlotIds = facultySubjects.map(s => s._id);

    // 2. Get all mappings for this criteria
    const mappingQuery = {
      sessionId, degreeTypeId, degreeNameId, semesterId,
      departmentId
    };
    if (req.user.role === 'FACULTY') {
      mappingQuery['mappedSubjects.timetableSlotId'] = { $in: subjectSlotIds };
    }
    const mappings = await StudentSemesterMapping.find(mappingQuery).populate('studentId', 'name username profile');

    // 3. Format response
    const records = mappings.map(mapping => ({
      _id: mapping._id,
      studentId: mapping.studentId,
      studentName: mapping.studentId?.name || 'Unknown',
      studentUsername: mapping.studentId?.username || '',
      shNo: mapping.studentId?.profile?.shNo || 'N/A',
      fatherName: mapping.studentId?.profile?.fatherName || '—',
      mappedSubjects: mapping.mappedSubjects,
      mappedAt: mapping.mappedAt
    }));

    res.status(200).json({
      subjects: facultySubjects,
      records
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 5. DELETE MAPPED RECORD
// ==========================================
exports.deleteMappedRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { timetableSlotId } = req.body || {}; // optional: delete specific subject mapping

    const mapping = await StudentSemesterMapping.findById(id);
    if (!mapping) {
      return res.status(404).json({ message: 'Mapping record not found.' });
    }

    // Only HOD, mapping creator, or the teacher of the deleted subject can delete
    const isHOD = req.user.role === 'HOD' || req.user.subRole === 'HOD';
    const isCreator = mapping.mappedBy?.toString() === req.user._id.toString() || mapping.facultyId?.toString() === req.user._id.toString();
    
    let isAuthorized = isHOD || isCreator;
    if (!isAuthorized && timetableSlotId) {
      const slot = await TimetableMaster.findById(timetableSlotId);
      if (slot && slot.facultyId?.toString() === req.user._id.toString()) {
        isAuthorized = true;
      }
    }
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'You are not authorized to delete this mapping.' });
    }

    if (timetableSlotId) {
      // Remove only the specific subject from this mapping
      mapping.mappedSubjects = mapping.mappedSubjects.filter(
        sub => sub.timetableSlotId.toString() !== timetableSlotId
      );

      if (mapping.mappedSubjects.length === 0) {
        // No subjects left, remove the entire mapping
        await StudentSemesterMapping.findByIdAndDelete(id);
        return res.status(200).json({ message: 'Subject removed and mapping record deleted as no subjects remain.' });
      }

      await mapping.save();
      return res.status(200).json({ message: 'Subject removed from mapping successfully.' });
    }

    // Delete entire mapping record
    await StudentSemesterMapping.findByIdAndDelete(id);
    res.status(200).json({ message: 'Mapping record deleted successfully. The student can be re-mapped to subjects now.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
