const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Attendance Routes
router.post('/mark', protect, authorize('FACULTY', 'HOD', 'SUPER_ADMIN', 'ADMIN'), attendanceController.markAttendance);
router.get('/student/me', protect, attendanceController.getStudentAttendance);
router.get('/student/:studentId', protect, authorize('FACULTY', 'HOD', 'ADMIN', 'SUPER_ADMIN'), attendanceController.getStudentAttendance);
router.get('/department/stats', protect, authorize('HOD', 'ADMIN', 'SUPER_ADMIN'), attendanceController.getDepartmentStats);

// Leave Routes
router.post('/leave/apply', protect, authorize('STUDENT'), attendanceController.applyLeave);
router.get('/leave/me', protect, authorize('STUDENT'), attendanceController.getMyLeaves);
router.get('/leave/pending', protect, authorize('FACULTY', 'HOD', 'ADMIN', 'SUPER_ADMIN'), attendanceController.getPendingLeaves);
router.put('/leave/:id/action', protect, authorize('FACULTY', 'HOD', 'ADMIN', 'SUPER_ADMIN'), attendanceController.actionLeave);

module.exports = router;
