const HolidayCalendar = require('../models/attendance/HolidayCalendar');
const AttendancePolicyMaster = require('../models/attendance/AttendancePolicyMaster');
const LeaveTypeMaster = require('../models/attendance/LeaveTypeMaster');
const DegreeTypeMaster = require('../models/attendance/DegreeTypeMaster');

const isWeekend = (date, includeSaturday = false) => {
  const day = date.getDay();
  if (day === 0) return true;
  if (includeSaturday && day === 6) return true;
  return false;
};

const isHoliday = (date, holidays) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  return holidays.some(holiday => {
    const start = new Date(holiday.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(holiday.endDate);
    end.setHours(23, 59, 59, 999);

    if (holiday.isRecurring) {
      const currentMonth = d.getMonth();
      const currentDate = d.getDate();
      const startMonth = start.getMonth();
      const startDateVal = start.getDate();
      const endMonth = end.getMonth();
      const endDateVal = end.getDate();

      if (startMonth === endMonth) {
        return currentMonth === startMonth && currentDate >= startDateVal && currentDate <= endDateVal;
      }
    }
    return d >= start && d <= end;
  });
};

const getWorkingDays = (startDate, endDate, holidays, includeSaturday = false) => {
  const workingDays = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const today = new Date();
  const cap = end > today ? today : end;

  for (let d = new Date(start); d <= cap; d.setDate(d.getDate() + 1)) {
    if (!isWeekend(d, includeSaturday) && !isHoliday(d, holidays)) {
      workingDays.push(new Date(d));
    }
  }
  return workingDays;
};

const getTimetableLectures = (startDate, endDate, dayOfWeek, holidays) => {
  const lectureDates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const today = new Date();
  const cap = end > today ? today : end;

  const dayMap = {
    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
    'Thursday': 4, 'Friday': 5, 'Saturday': 6
  };
  const targetDay = dayMap[dayOfWeek];

  for (let d = new Date(start); d <= cap; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === targetDay && !isHoliday(d, holidays)) {
      lectureDates.push(new Date(d));
    }
  }
  return lectureDates;
};

const isDateWithinTimetableLimit = (session, slot, date, holidays) => {
  const dayMap = {
    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
    'Thursday': 4, 'Friday': 5, 'Saturday': 6
  };
  const targetDay = dayMap[slot.dayOfWeek];
  const start = new Date(session.startDate);
  const end = new Date(session.endDate);

  const allLectures = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === targetDay && !isHoliday(d, holidays)) {
      allLectures.push(new Date(d));
    }
  }

  const limit = slot.totalClassesInSemester !== undefined ? slot.totalClassesInSemester : 90;
  const allowedLectures = allLectures.slice(0, limit);

  const targetTime = new Date(date).setHours(0, 0, 0, 0);
  return allowedLectures.some(ld => ld.setHours(0, 0, 0, 0) === targetTime);
};

const calculateStudentStats = async (student, session, records, rawHolidays, rawTimetables, preResolvedDegreeCode = null, preResolvedPolicy = null, preResolvedLectureDatesCache = null) => {
  let deptId = student.departmentId || null;
  if (!deptId && student.department) {
    const Department = mongoose.model('Department');
    const dept = await Department.findOne({ name: student.department });
    if (dept) deptId = dept._id.toString();
  }
  
  // Resolve programType from degreeTypeId
  let isPhD = student.profile?.isPhD || preResolvedDegreeCode === 'PHD';
  let programType = preResolvedDegreeCode || (isPhD ? 'PHD' : 'PG');
  if (!preResolvedDegreeCode && student.profile?.degreeTypeId) {
    const dtId = student.profile.degreeTypeId.toString();
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(dtId);
    const dt = isValidObjectId ? await DegreeTypeMaster.findById(dtId) : null;
    if (dt) {
      programType = dt.code;
      if (dt.code === 'PHD') isPhD = true;
    }
  }

  // 1. Fetch policy
  let policy = preResolvedPolicy;
  const degreeNameId = student.profile?.degreeNameId || null;
  if (!policy && degreeNameId) {
    policy = await AttendancePolicyMaster.findOne({
      degreeNameId,
      isActive: true,
      $or: [
        ...(deptId ? [{ departmentId: deptId }] : []),
        { departmentId: null }
      ]
    }).sort({ departmentId: -1 });
  }

  if (!policy && degreeNameId) {
    policy = await AttendancePolicyMaster.findOne({ degreeNameId, isActive: true });
  }

  if (!policy) {
    policy = await AttendancePolicyMaster.findOne({ departmentId: null, isActive: true });
  }

  if (!policy) {
    policy = {
      minRequiredPercentage: 75,
      warningThreshold: 80,
      maxCondonationPercentage: 10,
      editLockHours: 72,
      isActive: true
    };
  }

  // Filter holidays applicable to this department or global
  const holidays = rawHolidays.filter(h => !h.departmentId || (deptId && h.departmentId.toString() === deptId.toString()));

  const recordMap = {};
  records.forEach(rec => {
    const dStr = new Date(rec.date).toDateString();
    recordMap[dStr] = rec;
  });

  let totalWorkingDays = 0;
  let expectedDates = [];
  let totalExpectedClasses = 0;

  if (isPhD) {
    expectedDates = getWorkingDays(session.startDate, session.endDate, holidays, false); // PhD has Sat working
    totalWorkingDays = expectedDates.length;
    totalExpectedClasses = totalWorkingDays;
  } else {
    const studentSlots = rawTimetables || [];
    const datesSet = new Set();
    studentSlots.forEach(slot => {
      let dates = preResolvedLectureDatesCache && preResolvedLectureDatesCache[slot.dayOfWeek]
        ? preResolvedLectureDatesCache[slot.dayOfWeek]
        : getTimetableLectures(session.startDate, session.endDate, slot.dayOfWeek, holidays);
      const limit = slot.totalClassesInSemester !== undefined ? slot.totalClassesInSemester : 90;
      if (dates.length > limit) {
        dates = dates.slice(0, limit);
      }
      dates.forEach(dt => {
        const dStr = dt.toDateString();
        const existingRecord = recordMap[dStr];
        const classItem = existingRecord && existingRecord.classes && existingRecord.classes.find(c => c.timetableSlotId?.toString() === slot._id.toString());
        const isConducted = classItem && !classItem.isCancelled;
        const isCancelled = classItem && classItem.isCancelled;
        if (isConducted) {
          datesSet.add(dStr);
          totalExpectedClasses++;
        } else if (isCancelled) {
          datesSet.add(dStr);
        }
      });
    });
    expectedDates = Array.from(datesSet).map(ds => new Date(ds)).sort((a,b) => a-b);
    totalWorkingDays = expectedDates.length;
  }

  let presentCount = 0;
  let absentCount = 0;
  let excusedLeavesCount = 0;

  const processedLogs = expectedDates.map(date => {
    const dateStr = date.toDateString();
    const existingRecord = recordMap[dateStr];
    
    let status = 'NOT_MARKED';
    let remarks = '';
    let isLocked = false;
    let recordId = null;
    let classes = [];

    if (existingRecord) {
      if (existingRecord.approvalStatus === 'PENDING_HOD') {
        status = 'PENDING_HOD';
        remarks = existingRecord.remarks || '';
        isLocked = existingRecord.isLocked;
        recordId = existingRecord._id;
        classes = existingRecord.classes || [];
        // Do not update present/absent stats for pending HOD verification
      } else {
        status = existingRecord.status;
        remarks = existingRecord.remarks || '';
        isLocked = existingRecord.isLocked;
        recordId = existingRecord._id;
        classes = existingRecord.classes || [];

        if (isPhD) {
          if (status === 'PRESENT') presentCount++;
          else if (status === 'ON_LEAVE' && existingRecord.isLeaveOverride) presentCount++; // Auto-credited
          else if (status === 'ABSENT' || status === 'NOT_MARKED') absentCount++;
        } else {
          if (status === 'ON_LEAVE' && existingRecord.isLeaveOverride) {
            // Leave override acts as present for all scheduled classes that day that are not cancelled
            const scheduledClassesToday = rawTimetables.filter(t => {
              if (t.dayOfWeek !== ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]) return false;
              const isSlotCancelled = existingRecord && existingRecord.classes && existingRecord.classes.some(c => c.timetableSlotId?.toString() === t._id.toString() && c.isCancelled);
              return !isSlotCancelled;
            }).length;
            presentCount += scheduledClassesToday;
          } else {
            // Count class level checkboxes (excluding cancelled classes)
            const allowedSlotIds = rawTimetables.map(t => t._id.toString());
            classes.forEach(c => {
              if (!allowedSlotIds.includes(c.timetableSlotId?.toString())) {
                return;
              }
              if (c.isCancelled) {
                // Ignore
              } else if (c.selected) {
                presentCount++;
              } else {
                absentCount++;
              }
            });
          }
        }
      }
    } else {
      const today = new Date();
      today.setHours(0,0,0,0);
      if (date < today) {
        if (isPhD) absentCount++;
        else {
          const scheduledClassesToday = rawTimetables.filter(t => t.dayOfWeek === ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]).length;
          absentCount += scheduledClassesToday;
        }
      } else {
        status = 'FUTURE';
      }
    }

    return {
      date: date.toISOString(),
      status,
      remarks,
      isLocked,
      recordId,
      classes
    };
  });

  const percentage = totalExpectedClasses > 0 
    ? parseFloat(((presentCount / totalExpectedClasses) * 100).toFixed(2))
    : 100;

  const minRequired = policy.minRequiredPercentage;
  const warningLevel = policy.warningThreshold;

  const isDefaulter = percentage < minRequired;
  const isWarning = percentage < warningLevel && percentage >= minRequired;

  let safeAbsences = 0;
  let classesToAttend = 0;

  if (percentage >= minRequired) {
    if (minRequired > 0) {
      safeAbsences = Math.floor((presentCount * 100 / minRequired) - totalExpectedClasses);
      if (safeAbsences < 0) safeAbsences = 0;
    }
  } else {
    if (minRequired < 100) {
      classesToAttend = Math.ceil((minRequired * totalExpectedClasses - 100 * presentCount) / (100 - minRequired));
      if (classesToAttend < 0) classesToAttend = 0;
    } else {
      classesToAttend = totalExpectedClasses - presentCount;
    }
  }

  const subjectWiseAttendance = [];
  if (!isPhD) {
    const studentSlots = rawTimetables || [];
    studentSlots.forEach(slot => {
      let dates = preResolvedLectureDatesCache && preResolvedLectureDatesCache[slot.dayOfWeek]
        ? preResolvedLectureDatesCache[slot.dayOfWeek]
        : getTimetableLectures(session.startDate, session.endDate, slot.dayOfWeek, holidays);
      const limit = slot.totalClassesInSemester !== undefined ? slot.totalClassesInSemester : 90;
      if (dates.length > limit) {
        dates = dates.slice(0, limit);
      }
      let subjectPresent = 0;
      let subjectAbsent = 0;
      
      dates.forEach(date => {
        const dStr = date.toDateString();
        const existingRecord = recordMap[dStr];

        const classItem = existingRecord && existingRecord.classes && existingRecord.classes.find(c => c.timetableSlotId?.toString() === slot._id.toString());
        const isConducted = classItem && !classItem.isCancelled;
        if (!isConducted) {
          return;
        }

        if (existingRecord.status === 'ON_LEAVE' && existingRecord.isLeaveOverride) {
          subjectPresent++;
        } else {
          if (classItem.selected) {
            subjectPresent++;
          } else {
            subjectAbsent++;
          }
        }
      });
      
      const totalForSubject = subjectPresent + subjectAbsent;
      const percentageForSubject = totalForSubject > 0 ? parseFloat(((subjectPresent / totalForSubject) * 100).toFixed(2)) : 100;
      
      let subjectSafeAbsences = 0;
      let subjectRecoverClasses = 0;
      
      if (totalForSubject > 0) {
        if (percentageForSubject >= minRequired) {
          if (minRequired > 0) {
            subjectSafeAbsences = Math.floor((subjectPresent * 100 / minRequired) - totalForSubject);
            if (subjectSafeAbsences < 0) subjectSafeAbsences = 0;
          }
        } else {
          if (minRequired < 100) {
            subjectRecoverClasses = Math.ceil((minRequired * totalForSubject - 100 * subjectPresent) / (100 - minRequired));
            if (subjectRecoverClasses < 0) subjectRecoverClasses = 0;
          } else {
            subjectRecoverClasses = totalForSubject - subjectPresent;
          }
        }
      }
      
      subjectWiseAttendance.push({
        timetableSlotId: slot._id,
        subjectCode: slot.subjectCode,
        subjectName: slot.subjectName,
        facultyId: slot.facultyId,
        total: totalForSubject,
        attended: subjectPresent,
        percentage: percentageForSubject,
        totalClassesInSemester: slot.totalClassesInSemester || 90,
        dayOfWeek: slot.dayOfWeek,
        safeAbsences: subjectSafeAbsences,
        classesToRecover: subjectRecoverClasses
      });
    });
  }

  return {
    percentage,
    totalWorkingDays,
    totalExpectedClasses,
    presentDays: presentCount,
    absentDays: absentCount,
    isDefaulter,
    isWarning,
    minRequiredPercentage: minRequired,
    warningThreshold: warningLevel,
    safeAbsencesRemaining: safeAbsences,
    consecutiveClassesToAttend: classesToAttend,
    logs: processedLogs.reverse(),
    subjectWiseAttendance,
    isPhD
  };
};

module.exports = {
  isWeekend,
  isHoliday,
  getWorkingDays,
  getTimetableLectures,
  isDateWithinTimetableLimit,
  calculateStudentStats
};
