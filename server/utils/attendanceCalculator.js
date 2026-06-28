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

const calculateStudentStats = async (student, session, records, rawHolidays, rawTimetables, preResolvedDegreeCode = null, preResolvedPolicy = null) => {
  const departmentId = student.department; // String name or ID, but policy uses ID. Wait, policy uses ObjectId
  const deptQuery = student.departmentId || null; // Might need to resolve actual dept ID from user if needed, but fallback to global
  
  // Resolve programType from degreeTypeId
  let programType = preResolvedDegreeCode || 'PG';
  let isPhD = programType === 'PHD';
  if (!preResolvedDegreeCode && student.profile?.degreeTypeId) {
    const dt = await DegreeTypeMaster.findById(student.profile.degreeTypeId);
    if (dt) {
      programType = dt.code;
      if (dt.code === 'PHD') isPhD = true;
    }
  }

  // 1. Fetch policy
  let policy = preResolvedPolicy;
  if (!policy) {
    policy = await AttendancePolicyMaster.findOne({ programType, isActive: true }).sort({ departmentId: -1 });
  }
  if (!policy) {
    policy = {
      minRequiredPercentage: 75,
      warningThreshold: 80,
      maxCondonationPercentage: 10,
      editLockHours: 48,
      isActive: true
    };
  }

  // Filter holidays applicable to this department or global
  // Assuming student.departmentId is populated or we rely on string matching if rawHolidays has department ref
  const holidays = rawHolidays.filter(h => !h.departmentId || (student.departmentId && h.departmentId.toString() === student.departmentId.toString()));

  let totalWorkingDays = 0;
  let expectedDates = [];
  let totalExpectedClasses = 0;

  if (isPhD) {
    expectedDates = getWorkingDays(session.startDate, session.endDate, holidays, true); // PhD has Sat working
    totalWorkingDays = expectedDates.length;
    totalExpectedClasses = totalWorkingDays;
  } else {
    const studentSlots = rawTimetables || [];
    const datesSet = new Set();
    studentSlots.forEach(slot => {
      const dates = getTimetableLectures(session.startDate, session.endDate, slot.dayOfWeek, holidays);
      dates.forEach(dt => {
        datesSet.add(dt.toDateString());
        totalExpectedClasses++;
      });
    });
    expectedDates = Array.from(datesSet).map(ds => new Date(ds)).sort((a,b) => a-b);
    totalWorkingDays = expectedDates.length;
  }

  const recordMap = {};
  records.forEach(rec => {
    const dStr = new Date(rec.date).toDateString();
    recordMap[dStr] = rec;
  });

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
          // Leave override acts as present for all scheduled classes that day
          const scheduledClassesToday = rawTimetables.filter(t => t.dayOfWeek === ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()]).length;
          presentCount += scheduledClassesToday;
        } else {
          // Count class level checkboxes
          classes.forEach(c => {
            if (c.selected) presentCount++;
            else absentCount++;
          });
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
      const dates = getTimetableLectures(session.startDate, session.endDate, slot.dayOfWeek, holidays);
      let subjectPresent = 0;
      let subjectAbsent = 0;
      
      dates.forEach(date => {
        const dStr = date.toDateString();
        const existingRecord = recordMap[dStr];
        if (existingRecord) {
          if (existingRecord.status === 'ON_LEAVE' && existingRecord.isLeaveOverride) {
            subjectPresent++;
          } else {
            const classItem = existingRecord.classes.find(c => c.timetableSlotId?.toString() === slot._id.toString());
            if (classItem) {
              if (classItem.selected) {
                subjectPresent++;
              } else {
                subjectAbsent++;
              }
            } else {
              const today = new Date();
              today.setHours(0,0,0,0);
              if (date < today) {
                subjectAbsent++;
              }
            }
          }
        } else {
          const today = new Date();
          today.setHours(0,0,0,0);
          if (date < today) {
            subjectAbsent++;
          }
        }
      });
      
      const totalForSubject = subjectPresent + subjectAbsent;
      const percentageForSubject = totalForSubject > 0 ? parseFloat(((subjectPresent / totalForSubject) * 100).toFixed(2)) : 100;
      
      subjectWiseAttendance.push({
        timetableSlotId: slot._id,
        subjectCode: slot.subjectCode,
        subjectName: slot.subjectName,
        facultyId: slot.facultyId,
        total: totalForSubject,
        attended: subjectPresent,
        percentage: percentageForSubject,
        totalClassesInSemester: slot.totalClassesInSemester || 90
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
  calculateStudentStats
};
