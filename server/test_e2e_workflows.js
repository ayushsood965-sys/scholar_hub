const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING E2E QA TESTS ---');
  let superAdminToken, hodToken, facultyToken, studentToken;
  let hodUser, facultyUser, studentUser;
  
  const headers = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

  // 1. Authenticate Roles
  try {
    console.log('Authenticating HOD...');
    const hLogin = await axios.post(`${BASE_URL}/auth/login`, { username: 'mahinderkumar@gmail.com', password: 'password' });
    hodToken = hLogin.data.token;
    hodUser = hLogin.data;

    // Get a faculty and student from HOD's department
    const deptUsers = await axios.get(`${BASE_URL}/auth/dept-users`, headers(hodToken));
    facultyUser = deptUsers.data.find(u => u.role === 'FACULTY');
    studentUser = deptUsers.data.find(u => u.role === 'STUDENT');

    if (!facultyUser || !studentUser) {
      console.log('Missing faculty or student in department for testing.');
      return;
    }

    console.log(`Found Faculty: ${facultyUser.username}`);
    console.log(`Found Student: ${studentUser.username}`);

    const fLogin = await axios.post(`${BASE_URL}/auth/login`, { username: facultyUser.username, password: 'password' });
    facultyToken = fLogin.data.token;

    const sLogin = await axios.post(`${BASE_URL}/auth/login`, { username: studentUser.username, password: 'password' });
    studentToken = sLogin.data.token;

    console.log('All roles authenticated successfully.');
  } catch (e) {
    console.error('Authentication Failed:', e.response?.data || e.message);
    return;
  }

  // 2. Test Policy Config (HOD)
  try {
    console.log('\nTesting Policy Configuration...');
    const pRes = await axios.post(`${BASE_URL}/attendance/policies`, {
      programType: 'PG',
      minRequiredPercentage: 75,
      warningThreshold: 80,
      maxCondonationPercentage: 10,
      editLockHours: 48,
      allowHalfDay: true,
      allowMedicalLeave: true,
      allowDutyLeave: true,
      allowCorrection: true,
      correctionWindowDays: 3
    }, headers(hodToken));
    console.log('Policy configured successfully.');
  } catch (e) {
    console.error('Policy Configuration Failed:', e.response?.data || e.message);
  }

  // 3. Timetable Creation (HOD)
  let testSlotId = null;
  let sessionId = null;
  let degreeTypeId = null;
  let degreeNameId = null;
  let semesterId = null;
  try {
    console.log('\nTesting Timetable Creation...');
    const sessions = await axios.get(`${BASE_URL}/attendance/sessions`, headers(hodToken));
    sessionId = sessions.data.find(s => s.isCurrent)?._id || sessions.data[0]._id;

    const degreeTypes = await axios.get(`${BASE_URL}/attendance/masters/degree-types`, headers(hodToken));
    degreeTypeId = degreeTypes.data[0]._id;

    const degreeNames = await axios.get(`${BASE_URL}/attendance/masters/degree-names?degreeTypeId=${degreeTypeId}`, headers(hodToken));
    degreeNameId = degreeNames.data[0]._id;

    const semesters = await axios.get(`${BASE_URL}/attendance/masters/semesters`, headers(hodToken));
    semesterId = semesters.data[0]._id;

    const tRes = await axios.post(`${BASE_URL}/attendance/timetables`, {
      sessionId, degreeTypeId, degreeNameId, semesterId,
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      subjectCode: 'TEST101',
      subjectName: 'Test Automation',
      facultyId: facultyUser._id
    }, headers(hodToken));
    
    testSlotId = tRes.data._id;
    console.log('Timetable slot created successfully:', testSlotId);
  } catch (e) {
    console.error('Timetable Creation Failed:', e.response?.data || e.message);
  }

  // 4. Mark Attendance (Faculty)
  let testDate = new Date();
  // find next Monday to match the slot
  while (testDate.getDay() !== 1) {
    testDate.setDate(testDate.getDate() + 1);
  }
  const dateStr = testDate.toISOString().split('T')[0];

  try {
    console.log('\nTesting Attendance Marking...');
    const mRes = await axios.post(`${BASE_URL}/attendance/faculty/mark-bulk`, {
      sessionId, degreeTypeId, degreeNameId, semesterId,
      date: dateStr,
      records: [
        { studentId: studentUser._id, status: 'PRESENT' }
      ]
    }, headers(facultyToken));
    console.log('Attendance marked successfully.');
  } catch (e) {
    console.error('Attendance Marking Failed:', e.response?.data || e.message);
  }

  // 5. Leave Workflow
  let leaveId = null;
  try {
    console.log('\nTesting Leave Application...');
    // Add leave type
    const ltRes = await axios.post(`${BASE_URL}/attendance/leave-types`, {
      leaveName: 'Test Leave',
      leaveCode: 'TL',
      description: 'QA Leave',
      maxDaysPerYear: 10,
      requiresDocument: false
    }, headers(hodToken));
    const leaveTypeId = ltRes.data._id;

    const lReq = await axios.post(`${BASE_URL}/attendance/leave/apply`, {
      leaveType: leaveTypeId,
      startDate: dateStr,
      endDate: dateStr,
      totalDays: 1,
      reason: 'E2E Test Leave'
    }, headers(studentToken));
    leaveId = lReq.data._id;
    console.log('Leave applied successfully.');

    await axios.put(`${BASE_URL}/attendance/leave/${leaveId}/action`, {
      action: 'APPROVE',
      remarks: 'Looks good'
    }, headers(hodToken));
    console.log('Leave approved successfully.');
  } catch (e) {
    console.error('Leave Workflow Failed:', e.response?.data || e.message);
  }

  // 6. Cleanup
  console.log('\nCleaning up test data...');
  if (testSlotId) await axios.delete(`${BASE_URL}/attendance/timetables/${testSlotId}`, headers(hodToken));
  console.log('Cleanup complete.');
  console.log('--- QA TESTS FINISHED ---');
}

runTests();
