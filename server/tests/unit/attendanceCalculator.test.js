const test = require('node:test');
const assert = require('node:assert');
const {
  isWeekend,
  isHoliday,
  getWorkingDays,
  getTimetableLectures,
  isDateWithinTimetableLimit
} = require('../../utils/attendanceCalculator');

test('attendanceCalculator unit tests', async (t) => {

  await t.test('isWeekend utility tests', () => {
    // Sundays
    const sunday = new Date('2026-07-12'); // Sunday
    assert.strictEqual(isWeekend(sunday), true);
    assert.strictEqual(isWeekend(sunday, true), true);

    // Mondays
    const monday = new Date('2026-07-13'); // Monday
    assert.strictEqual(isWeekend(monday), false);
    assert.strictEqual(isWeekend(monday, true), false);

    // Saturdays
    const saturday = new Date('2026-07-11'); // Saturday
    assert.strictEqual(isWeekend(saturday, false), false);
    assert.strictEqual(isWeekend(saturday, true), true);
  });

  await t.test('isHoliday utility tests', () => {
    const holidays = [
      {
        startDate: '2026-08-15',
        endDate: '2026-08-15',
        isRecurring: true,
        name: 'Independence Day'
      },
      {
        startDate: '2026-10-20',
        endDate: '2026-10-22',
        isRecurring: false,
        name: 'Autumn Break'
      }
    ];

    // Non-holiday
    assert.strictEqual(isHoliday(new Date('2026-08-14'), holidays), false);

    // Recurring holiday matching date and month
    assert.strictEqual(isHoliday(new Date('2026-08-15'), holidays), true);
    // In a different year, recurring should still match month/day
    assert.strictEqual(isHoliday(new Date('2027-08-15'), holidays), true);

    // Non-recurring holiday matching range
    assert.strictEqual(isHoliday(new Date('2026-10-21'), holidays), true);
    // Non-recurring outside range
    assert.strictEqual(isHoliday(new Date('2026-10-23'), holidays), false);
  });

  await t.test('getWorkingDays utility tests', () => {
    const holidays = [
      {
        startDate: '2026-07-08',
        endDate: '2026-07-08',
        isRecurring: false
      }
    ];

    // July 6 (Mon) to July 10 (Fri) 2026. July 8 is holiday.
    // Working days should be July 6, 7, 9, 10 (4 days)
    const start = new Date('2026-07-06');
    const end = new Date('2026-07-10');

    const workingDays = getWorkingDays(start, end, holidays, false);
    assert.strictEqual(workingDays.length, 4);
    assert.strictEqual(workingDays[0].getDate(), 6);
    assert.strictEqual(workingDays[1].getDate(), 7);
    assert.strictEqual(workingDays[2].getDate(), 9);
    assert.strictEqual(workingDays[3].getDate(), 10);
  });

  await t.test('getTimetableLectures utility tests', () => {
    // Mon July 6 to Sun July 12, 2026
    // Monday is July 6. Wednesday is July 8.
    const start = new Date('2026-07-06');
    const end = new Date('2026-07-12');
    
    // July 8 is holiday
    const holidays = [
      {
        startDate: '2026-07-08',
        endDate: '2026-07-08',
        isRecurring: false
      }
    ];

    // Find Wednesday lectures (should be empty since July 8 is holiday)
    const wedLectures = getTimetableLectures(start, end, 'Wednesday', holidays);
    assert.strictEqual(wedLectures.length, 0);

    // Find Monday lectures (should find July 6)
    const monLectures = getTimetableLectures(start, end, 'Monday', holidays);
    assert.strictEqual(monLectures.length, 1);
    assert.strictEqual(monLectures[0].getDate(), 6);
  });

  await t.test('isDateWithinTimetableLimit utility tests', () => {
    const session = {
      startDate: '2026-07-01',
      endDate: '2026-07-31'
    };
    
    const slot = {
      dayOfWeek: 'Monday',
      totalClassesInSemester: 2 // Only the first 2 Mondays are allowed
    };

    const holidays = [];

    // Mondays in July 2026: 6th, 13th, 20th, 27th
    // Since totalClassesInSemester is 2, only 6th and 13th are allowed.
    assert.strictEqual(isDateWithinTimetableLimit(session, slot, new Date('2026-07-06'), holidays), true);
    assert.strictEqual(isDateWithinTimetableLimit(session, slot, new Date('2026-07-13'), holidays), true);
    assert.strictEqual(isDateWithinTimetableLimit(session, slot, new Date('2026-07-20'), holidays), false);
    assert.strictEqual(isDateWithinTimetableLimit(session, slot, new Date('2026-07-27'), holidays), false);
  });
});
