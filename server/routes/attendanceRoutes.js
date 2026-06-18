const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const requireDepartment = require('../middleware/requireDepartment');

// ==========================================
// 1. POLICY CONFIGURATIONS
// ==========================================
router.get('/policies', protect, requireDepartment, attendanceController.getPolicies);
router.post('/policies', protect, authorize('HOD', 'SUPER_ADMIN'), requireDepartment, attendanceController.createOrUpdatePolicy);
router.delete('/policies/:id', protect, authorize('HOD', 'SUPER_ADMIN'), attendanceController.deletePolicy);

// ==========================================
// 2. LEAVE TYPES MASTER
// ==========================================
router.get('/leave-types', protect, requireDepartment, attendanceController.getLeaveTypes);
router.post('/leave-types', protect, authorize('HOD', 'SUPER_ADMIN'), requireDepartment, attendanceController.createLeaveType);
router.delete('/leave-types/:id', protect, authorize('HOD', 'SUPER_ADMIN'), attendanceController.deleteLeaveType);

// ==========================================
// 3. ACADEMIC SESSIONS
// ==========================================
router.get('/sessions', protect, requireDepartment, attendanceController.getSessions);
router.post('/sessions', protect, authorize('HOD', 'SUPER_ADMIN'), requireDepartment, attendanceController.createSession);
router.put('/sessions/:id/current', protect, authorize('HOD', 'SUPER_ADMIN'), requireDepartment, attendanceController.setCurrentSession);

// ==========================================
// 4. TIMETABLE
// ==========================================
router.get('/timetables', protect, requireDepartment, attendanceController.getTimetables);
router.post('/timetables', protect, authorize('HOD', 'SUPER_ADMIN', 'FACULTY'), requireDepartment, attendanceController.createTimetableSlot);
router.delete('/timetables/:id', protect, authorize('HOD', 'SUPER_ADMIN', 'FACULTY'), attendanceController.deleteTimetableSlot);

// ==========================================
// 5. HOLIDAY CALENDAR
// ==========================================
router.get('/holidays', protect, requireDepartment, attendanceController.getHolidays);
router.post('/holidays', protect, authorize('HOD', 'SUPER_ADMIN'), requireDepartment, attendanceController.createHoliday);
router.delete('/holidays/:id', protect, authorize('HOD', 'SUPER_ADMIN'), attendanceController.deleteHoliday);

// ==========================================
// 6. CORRECTION WORKFLOWS
// ==========================================
router.post('/corrections', protect, authorize('STUDENT'), attendanceController.applyCorrection);
router.get('/corrections/me', protect, authorize('STUDENT'), attendanceController.getMyCorrections);
router.get('/corrections/pending', protect, authorize('FACULTY', 'HOD'), attendanceController.getPendingCorrections);
router.put('/corrections/:id/action', protect, authorize('FACULTY', 'HOD'), attendanceController.actionCorrection);

// ==========================================
// 7. TRANSACTIONAL MARKING
// ==========================================
router.post('/faculty/mark-bulk', protect, authorize('FACULTY', 'HOD'), requireDepartment, attendanceController.markAttendanceBulk);
// Backward compatible path mapping for simple marking
router.post('/mark', protect, authorize('FACULTY', 'HOD'), requireDepartment, attendanceController.markAttendanceBulk);

// ==========================================
// 8. LEAVE REQUEST WORKFLOWS (Backward Compatible)
// ==========================================
router.post('/leave/apply', protect, authorize('STUDENT'), attendanceController.applyLeave);
router.get('/leave/me', protect, authorize('STUDENT'), attendanceController.getMyLeaves);
router.get('/leave/pending', protect, authorize('FACULTY', 'HOD', 'ADMIN', 'SUPER_ADMIN'), attendanceController.getPendingLeaves);
router.put('/leave/:id/action', protect, authorize('FACULTY', 'HOD', 'ADMIN', 'SUPER_ADMIN'), attendanceController.actionLeave);

// ==========================================
// 9. DASHBOARDS & TELEMETRY
// ==========================================

router.get('/dashboard/student', protect, authorize('STUDENT'), requireDepartment, attendanceController.getStudentDashboardStats);
router.get('/dashboard/faculty', protect, authorize('FACULTY'), requireDepartment, attendanceController.getFacultyDashboardStats);
router.get('/dashboard/hod', protect, authorize('HOD'), requireDepartment, attendanceController.getHodDashboardStats);
router.get('/dashboard/super', protect, authorize('SUPER_ADMIN'), attendanceController.getSuperAdminDashboardStats);

// Backward compatible path mapping for dashboard/me requests
router.get('/student/me', protect, requireDepartment, attendanceController.getStudentDashboardStats);
router.get('/student/:studentId', protect, authorize('FACULTY', 'HOD', 'SUPER_ADMIN'), requireDepartment, attendanceController.getStudentDashboardStats);
router.get('/department/stats', protect, authorize('HOD'), requireDepartment, attendanceController.getHodDashboardStats);

module.exports = router;
