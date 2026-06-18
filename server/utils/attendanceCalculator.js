const HolidayCalendar = require('../models/attendance/HolidayCalendar');
const AttendancePolicyMaster = require('../models/attendance/AttendancePolicyMaster');
const LeaveTypeMaster = require('../models/attendance/LeaveTypeMaster');

/**
 * Checks if a date falls on a weekend.
 * By default, Sunday is a weekend. If PG/UG, Saturday is also a weekend.
 * @param {Date} date 
 * @param {Boolean} includeSaturday 
 * @returns {Boolean}
 */
const isWeekend = (date, includeSaturday = false) => {
  const day = date.getDay();
  if (day === 0) return true; // Sunday is always weekend
  if (includeSaturday && day === 6) return true; // Saturday is weekend if specified
  return false;
};

/**
 * Checks if a date falls in any active holiday in the HolidayCalendar.
 * @param {Date} date 
 * @param {Array} holidays 
 * @returns {Boolean}
 */
const isHoliday = (date, holidays) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  return holidays.some(holiday => {
    const start = new Date(holiday.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(holiday.endDate);
    end.setHours(23, 59, 59, 999);

    if (holiday.isRecurring) {
      // Compare month and date only
      const currentMonth = d.getMonth();
      const currentDate = d.getDate();
      const startMonth = start.getMonth();
      const startDateVal = start.getDate();
      const endMonth = end.getMonth();
      const endDateVal = end.getDate();

      // Simple single-day recurring holiday comparison
      if (startMonth === endMonth) {
        return currentMonth === startMonth && currentDate >= startDateVal && currentDate <= endDateVal;
      }
    }

    return d >= start && d <= end;
  });
};

/**
 * Returns all academic working days in a date range, filtering weekends and holidays.
 */
const getWorkingDays = (startDate, endDate, holidays, includeSaturday = false) => {
  const workingDays = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set end cap to today if end date is in the future
  const today = new Date();
  const cap = end > today ? today : end;

  for (let d = new Date(start); d <= cap; d.setDate(d.getDate() + 1)) {
    if (!isWeekend(d, includeSaturday) && !isHoliday(d, holidays)) {
      workingDays.push(new Date(d));
    }
  }
  return workingDays;
};

/**
 * Calculates timetable lecture expected dates.
 */
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

/**
 * Main Calculator Engine
 */
const calculateStudentStats = async (studentId, departmentId, programType, session, records, rawHolidays, rawTimetables) => {
  // 1. Fetch policy
  let policy = await AttendancePolicyMaster.findOne({ departmentId, programType, isActive: true });
  if (!policy) {
    policy = await AttendancePolicyMaster.findOne({ departmentId: null, programType, isActive: true });
  }
  if (!policy) {
    // Hardcoded fallback
    policy = {
      minRequiredPercentage: 75,
      warningThreshold: 80,
      maxCondonationPercentage: 10,
      editLockHours: 48,
      allowHalfDay: true,
      allowMedicalLeave: true,
      allowDutyLeave: true,
      isActive: true
    };
  }

  // 2. Fetch active leave types for resolving credit status
  const leaveTypes = await LeaveTypeMaster.find({
    $or: [{ departmentId }, { departmentId: null }],
    isActive: true
  });

  const countsAsPresentMap = {};
  const requiresDocumentMap = {};
  leaveTypes.forEach(lt => {
    countsAsPresentMap[lt.leaveCode] = lt.countsAsPresent;
    requiresDocumentMap[lt.leaveCode] = lt.requiresDocument;
  });

  // Filter holidays applicable to this department or global
  const holidays = rawHolidays.filter(h => !h.departmentId || h.departmentId.toString() === departmentId.toString());

  let totalWorkingDays = 0;
  let expectedDates = [];

  // PhD scholars checked-in daily. PG/UG follows class timetable schedules
  if (programType === 'PhD') {
    // PhD: Saturday is typically a working day in research labs, Sunday is not
    expectedDates = getWorkingDays(session.startDate, session.endDate, holidays, false);
    totalWorkingDays = expectedDates.length;
  } else {
    // PG / UG: Gather all scheduled timetable slot occurrences
    const studentSlots = rawTimetables || [];
    const datesSet = new Set();
    studentSlots.forEach(slot => {
      const dates = getTimetableLectures(session.startDate, session.endDate, slot.dayOfWeek, holidays);
      dates.forEach(dt => datesSet.add(dt.toDateString()));
    });
    expectedDates = Array.from(datesSet).map(ds => new Date(ds)).sort((a,b) => a-b);
    totalWorkingDays = expectedDates.length;
  }

  // Map record date strings for O(1) checks
  const recordMap = {};
  records.forEach(rec => {
    const dStr = new Date(rec.date).toDateString();
    recordMap[dStr] = rec;
  });

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let presentLeavesCount = 0;
  let excusedLeavesCount = 0;
  let halfDayPresentCount = 0;
  let halfDayAbsentCount = 0;
  let researchTripCount = 0;

  const processedLogs = expectedDates.map(date => {
    const dateStr = date.toDateString();
    const existingRecord = recordMap[dateStr];
    
    let status = 'NOT_MARKED';
    let remarks = '';
    let isLocked = false;
    let recordId = null;

    if (existingRecord) {
      status = existingRecord.status;
      remarks = existingRecord.remarks || '';
      isLocked = existingRecord.isLocked;
      recordId = existingRecord._id;

      // Increments based on status type
      if (status === 'PRESENT') presentCount++;
      else if (status === 'ABSENT' || status === 'NOT_MARKED') absentCount++;
      else if (status === 'LATE') {
        presentCount++;
        lateCount++;
      } else if (status === 'LATE_EXCUSED') {
        presentCount++;
        lateCount++;
      } else if (status === 'HALF_DAY_PRESENT') {
        halfDayPresentCount++;
        presentCount += 0.5;
      } else if (status === 'HALF_DAY_ABSENT') {
        halfDayAbsentCount++;
        absentCount += 0.5;
      } else if (status === 'ON_RESEARCH' || status === 'FIELD_VISIT') {
        researchTripCount++;
        presentCount++; // counts as full day present
      } else if (status === 'HOLIDAY') {
        // holidays don't penalize, skip
      } else if (status === 'CANCELLED') {
        // cancelled lectures skip
      } else {
        // It is a leave status (e.g. CASUAL_LEAVE, MEDICAL_LEAVE, DUTY_LEAVE)
        const isCPresent = countsAsPresentMap[status] ?? false;
        if (isCPresent) {
          presentLeavesCount++;
        } else {
          // Excused: reduces the working days denominator
          excusedLeavesCount++;
        }
      }
    } else {
      // Future dates are not marked, but don't count as absent until the day is past
      const today = new Date();
      today.setHours(0,0,0,0);
      if (date < today) {
        absentCount++;
      } else {
        status = 'FUTURE';
      }
    }

    return {
      date: date.toISOString(),
      status,
      remarks,
      isLocked,
      recordId
    };
  });

  const effectivePresent = presentCount + presentLeavesCount;
  const effectiveWorkingDays = totalWorkingDays - excusedLeavesCount;

  const percentage = effectiveWorkingDays > 0 
    ? parseFloat(((effectivePresent / effectiveWorkingDays) * 100).toFixed(2))
    : 100;

  const minRequired = policy.minRequiredPercentage;
  const warningLevel = policy.warningThreshold;

  const isDefaulter = percentage < minRequired;
  const isWarning = percentage < warningLevel && percentage >= minRequired;

  // 4. ERP Prediction Math
  let safeAbsences = 0;
  let classesToAttend = 0;

  if (percentage >= minRequired) {
    // Solve: (P / (W - E + A)) >= minRequired / 100 -> A <= (P * 100 / minRequired) - (W - E)
    if (minRequired > 0) {
      safeAbsences = Math.floor((effectivePresent * 100 / minRequired) - effectiveWorkingDays);
      if (safeAbsences < 0) safeAbsences = 0;
    }
  } else {
    // Solve: ((P + F) / (W - E + F)) >= minRequired / 100 -> F >= (minRequired * (W - E) - 100 * P) / (100 - minRequired)
    if (minRequired < 100) {
      classesToAttend = Math.ceil((minRequired * effectiveWorkingDays - 100 * effectivePresent) / (100 - minRequired));
      if (classesToAttend < 0) classesToAttend = 0;
    } else {
      classesToAttend = effectiveWorkingDays - effectivePresent;
    }
  }

  return {
    percentage,
    totalWorkingDays,
    effectiveWorkingDays,
    presentDays: presentCount,
    absentDays: absentCount,
    excusedLeaveDays: excusedLeavesCount,
    creditedLeaveDays: presentLeavesCount,
    lateDays: lateCount,
    halfDays: halfDayPresentCount + halfDayAbsentCount,
    researchTripDays: researchTripCount,
    isDefaulter,
    isWarning,
    minRequiredPercentage: minRequired,
    warningThreshold: warningLevel,
    safeAbsencesRemaining: safeAbsences,
    consecutiveClassesToAttend: classesToAttend,
    logs: processedLogs.reverse() // show latest first
  };
};

module.exports = {
  isWeekend,
  isHoliday,
  getWorkingDays,
  getTimetableLectures,
  calculateStudentStats
};
