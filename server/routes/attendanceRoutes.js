const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const requireDepartment = require('../middleware/requireDepartment');
const multer = require('multer');
const path = require('path');
const { clearCalculatorCache } = require('../utils/attendanceCalculator');

// Invalidate in-memory calculations cache on any write operation
router.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    clearCalculatorCache();
  }
  next();
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });


// ==========================================
// 1. MASTER ROUTES (SUPER ADMIN)
// ==========================================
router.get('/masters/degree-types', protect, requireDepartment, attendanceController.getDegreeTypes);
router.post('/masters/degree-types', protect, authorize('SUPER_ADMIN'), attendanceController.createDegreeType);
router.post('/masters/seed-all', protect, authorize('SUPER_ADMIN'), attendanceController.seedAllMasters);
router.put('/masters/degree-types/:id', protect, authorize('SUPER_ADMIN'), attendanceController.updateDegreeType);
router.delete('/masters/degree-types/:id', protect, authorize('SUPER_ADMIN'), attendanceController.deleteDegreeType);

router.get('/masters/degree-names', protect, requireDepartment, attendanceController.getDegreeNames);
router.post('/masters/degree-names', protect, authorize('SUPER_ADMIN'), attendanceController.createDegreeName);
router.put('/masters/degree-names/:id', protect, authorize('SUPER_ADMIN'), attendanceController.updateDegreeName);
router.delete('/masters/degree-names/:id', protect, authorize('SUPER_ADMIN'), attendanceController.deleteDegreeName);

router.get('/masters/semesters', protect, requireDepartment, attendanceController.getSemesters);
router.post('/masters/semesters', protect, authorize('SUPER_ADMIN'), attendanceController.createSemester);
router.put('/masters/semesters/:id', protect, authorize('SUPER_ADMIN'), attendanceController.updateSemester);
router.delete('/masters/semesters/:id', protect, authorize('SUPER_ADMIN'), attendanceController.deleteSemester);

// Sessions (Super Admin)
router.get('/sessions', protect, attendanceController.getSessions);
router.post('/sessions', protect, authorize('SUPER_ADMIN'), attendanceController.createSession);
router.put('/sessions/:id', protect, authorize('SUPER_ADMIN'), attendanceController.updateSession);
router.delete('/sessions/:id', protect, authorize('SUPER_ADMIN'), attendanceController.deleteSession);
router.put('/sessions/:id/current', protect, authorize('SUPER_ADMIN'), attendanceController.setCurrentSession);

router.get('/masters/semester-degree-mappings', protect, requireDepartment, attendanceController.getSemesterDegreeMappings);
router.post('/masters/semester-degree-mappings', protect, authorize('SUPER_ADMIN'), attendanceController.createSemesterDegreeMapping);
router.post('/masters/seed-mappings', protect, authorize('SUPER_ADMIN'), attendanceController.seedSemesterDegreeMappings);
router.put('/masters/semester-degree-mappings/:id', protect, authorize('SUPER_ADMIN'), attendanceController.updateSemesterDegreeMapping);
router.delete('/masters/semester-degree-mappings/:id', protect, authorize('SUPER_ADMIN'), attendanceController.deleteSemesterDegreeMapping);

// Category & Gender Master (Super Admin)
router.get('/masters/category-gender', protect, attendanceController.getCategoryGenderMasters);
router.post('/masters/category-gender', protect, authorize('SUPER_ADMIN'), attendanceController.createCategoryGenderMaster);
router.put('/masters/category-gender/:id', protect, authorize('SUPER_ADMIN'), attendanceController.updateCategoryGenderMaster);
router.delete('/masters/category-gender/:id', protect, authorize('SUPER_ADMIN'), attendanceController.deleteCategoryGenderMaster);

// Public route for signup/profile dropdowns
router.get('/public/masters/category-gender', attendanceController.getCategoryGenderMasters);

// ==========================================
// 0. PUBLIC ROUTES (for signup page - no auth required)
// ==========================================
router.get('/public/sessions', attendanceController.getSessions);
router.get('/public/masters/degree-types', attendanceController.getDegreeTypes);
router.get('/public/masters/degree-names', attendanceController.getDegreeNames);

// ==========================================
// 2. POLICY CONFIGURATIONS
// ==========================================
router.get('/policies', protect, requireDepartment, attendanceController.getPolicies);
router.post('/policies', protect, authorize('HOD', 'SUPER_ADMIN'), requireDepartment, attendanceController.createOrUpdatePolicy);
router.post('/policies/seed', protect, authorize('SUPER_ADMIN'), attendanceController.seedPoliciesOnly);
router.delete('/policies/:id', protect, authorize('HOD', 'SUPER_ADMIN'), attendanceController.deletePolicy);

// ==========================================
// 4. LEAVE TYPES MASTER
// ==========================================
router.get('/leave-types', protect, requireDepartment, attendanceController.getLeaveTypes);
router.post('/leave-types', protect, authorize('HOD', 'SUPER_ADMIN'), requireDepartment, attendanceController.createLeaveType);
router.delete('/leave-types/:id', protect, authorize('HOD', 'SUPER_ADMIN'), attendanceController.deleteLeaveType);
router.put('/leave-types/:id', protect, authorize('HOD', 'SUPER_ADMIN'), attendanceController.updateLeaveType);

// ==========================================
// 5. TIMETABLE
// ==========================================
router.get('/timetables', protect, requireDepartment, attendanceController.getTimetables);
router.get('/timetables/faculty', protect, authorize('FACULTY', 'HOD'), requireDepartment, attendanceController.getFacultyTimetables);
router.post('/timetables', protect, authorize('HOD', 'SUPER_ADMIN'), requireDepartment, attendanceController.createTimetableSlot);
router.put('/timetables/:id', protect, authorize('HOD', 'SUPER_ADMIN'), requireDepartment, attendanceController.updateTimetableSlot);
router.delete('/timetables/:id', protect, authorize('HOD', 'SUPER_ADMIN'), attendanceController.deleteTimetableSlot);
router.post('/timetables/clone', protect, authorize('HOD', 'SUPER_ADMIN'), requireDepartment, attendanceController.cloneTimetable);

// ==========================================
// 6. HOLIDAY CALENDAR
// ==========================================
router.get('/holidays', protect, requireDepartment, attendanceController.getHolidays);
router.post('/holidays', protect, authorize('HOD', 'SUPER_ADMIN'), requireDepartment, attendanceController.createHoliday);
router.post('/holidays/seed', protect, authorize('SUPER_ADMIN'), attendanceController.seedHolidays);
router.put('/holidays/:id', protect, authorize('HOD', 'SUPER_ADMIN'), attendanceController.updateHoliday);
router.delete('/holidays/:id', protect, authorize('HOD', 'SUPER_ADMIN'), attendanceController.deleteHoliday);

// ==========================================
// 7. CORRECTION WORKFLOWS
// ==========================================
router.post('/corrections', protect, authorize('STUDENT'), attendanceController.applyCorrection);
router.get('/corrections/me', protect, authorize('STUDENT'), attendanceController.getMyCorrections);
router.get('/corrections/pending', protect, authorize('FACULTY', 'HOD'), attendanceController.getPendingCorrections);
router.get('/corrections/logs', protect, authorize('FACULTY', 'HOD'), attendanceController.getCorrectionLogs);
router.put('/corrections/:id/action', protect, authorize('FACULTY', 'HOD'), attendanceController.actionCorrection);

// ==========================================
// 8. FACULTY MATRIX
// ==========================================
router.get('/faculty/matrix', protect, authorize('FACULTY', 'HOD'), requireDepartment, attendanceController.getAttendanceMatrix);
router.post('/faculty/mark-bulk', protect, authorize('FACULTY', 'HOD'), requireDepartment, attendanceController.markAttendanceBulk);
router.get('/faculty/marked', protect, authorize('FACULTY', 'HOD'), requireDepartment, attendanceController.getMarkedAttendance);
router.delete('/faculty/entry', protect, authorize('FACULTY', 'HOD'), requireDepartment, attendanceController.deleteAttendanceEntry);
router.post('/faculty/cancel-class', protect, authorize('FACULTY', 'HOD'), requireDepartment, attendanceController.cancelClass);

// ==========================================
// 9. LEAVE REQUEST WORKFLOWS
// ==========================================
router.post('/leave/apply', protect, authorize('STUDENT'), attendanceController.applyLeave);
router.get('/leave/me', protect, authorize('STUDENT'), attendanceController.getMyLeaves);
router.get('/leave/pending', protect, authorize('FACULTY', 'HOD', 'ADMIN', 'SUPER_ADMIN'), attendanceController.getPendingLeaves);
router.get('/leave/logs', protect, authorize('FACULTY', 'HOD'), attendanceController.getLeaveLogs);
router.put('/leave/:id/action', protect, authorize('FACULTY', 'HOD', 'ADMIN', 'SUPER_ADMIN'), attendanceController.actionLeave);

// ==========================================
// 10. DASHBOARDS & TELEMETRY
// ==========================================
router.get('/dashboard/student', protect, authorize('STUDENT'), requireDepartment, attendanceController.getStudentDashboardStats);
router.get('/student/marked-records', protect, authorize('STUDENT'), attendanceController.getStudentAttendanceRecords);
router.get('/student/subjects', protect, authorize('STUDENT'), attendanceController.getStudentMappedSubjects);
router.get('/dashboard/faculty', protect, authorize('FACULTY'), requireDepartment, attendanceController.getFacultyDashboardStats);
router.get('/dashboard/faculty/low-attendance-students', protect, authorize('FACULTY'), requireDepartment, attendanceController.getFacultyLowAttendanceStudents);
router.get('/dashboard/faculty/course/:courseId/defaulters', protect, authorize('FACULTY'), requireDepartment, attendanceController.getFacultyCourseDefaulters);
router.get('/dashboard/hod', protect, authorize('HOD'), requireDepartment, attendanceController.getHodDashboardStats);
router.get('/dashboard/hod/drill-down', protect, authorize('HOD'), requireDepartment, attendanceController.getHodDrillDown);
router.get('/hod/forwarded', protect, authorize('HOD'), requireDepartment, attendanceController.getHodForwardedAttendance);
router.post('/hod/approve', protect, authorize('HOD'), requireDepartment, attendanceController.approveHodAttendance);
router.get('/leave/hod/history', protect, authorize('HOD'), attendanceController.getHodLeaveHistory);
router.get('/corrections/hod/history', protect, authorize('HOD'), attendanceController.getHodCorrectionHistory);
router.get('/dashboard/super', protect, authorize('SUPER_ADMIN'), attendanceController.getSuperAdminDashboardStats);

// Student absences for corrections selection
router.get('/my-absences', protect, authorize('STUDENT'), attendanceController.getMyAbsences);

// File Upload endpoint
router.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({ fileUrl });
});

module.exports = router;
