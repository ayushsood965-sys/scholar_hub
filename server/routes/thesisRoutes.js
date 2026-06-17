const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createThesis, getMyThesis, getAllTheses, getThesisById,
  verifyEnrollment, assignSupervisor, clearCoursework, awardDegree, updateAuditLog,
  getAssignedTheses, getDeptTheses, drcApprove, scheduleSeminar, seminarClear, finalApprove,
  dispatchThesis, scheduleViva, recordViva, transferThesis, forcePreSubmission,
  searchGlobalTheses,
  submitCourseworkDetails, approveCourseworkFaculty, rejectCourseworkFaculty,
  approveCourseworkHOD, rejectCourseworkHOD
} = require('../controllers/thesisController');

// Scholar
router.post('/', protect, authorize('STUDENT'), createThesis);
router.get('/me', protect, authorize('STUDENT'), getMyThesis);
router.put('/me/coursework/submit', protect, authorize('STUDENT'), submitCourseworkDetails);

// Admin & HOD Department Admins
router.get('/all', protect, authorize('ADMIN', 'HOD'), getAllTheses);
router.put('/:id/verify', protect, authorize('ADMIN', 'HOD'), verifyEnrollment);
router.put('/:id/assign', protect, authorize('ADMIN', 'HOD'), assignSupervisor);
router.put('/:id/coursework', protect, authorize('ADMIN', 'HOD', 'FACULTY'), clearCoursework);
router.put('/:id/coursework/approve-faculty', protect, authorize('FACULTY'), approveCourseworkFaculty);
router.put('/:id/coursework/reject-faculty', protect, authorize('FACULTY'), rejectCourseworkFaculty);
router.put('/:id/coursework/approve-hod', protect, authorize('HOD'), approveCourseworkHOD);
router.put('/:id/coursework/reject-hod', protect, authorize('HOD'), rejectCourseworkHOD);
router.put('/:id/award', protect, authorize('ADMIN', 'HOD'), awardDegree);
router.put('/:id/audit', protect, authorize('ADMIN', 'HOD'), updateAuditLog);
router.put('/:id/dispatch', protect, authorize('ADMIN', 'HOD'), dispatchThesis);
router.put('/:id/schedule-viva', protect, authorize('ADMIN', 'HOD'), scheduleViva);
router.put('/:id/record-viva', protect, authorize('ADMIN', 'HOD'), recordViva);
router.put('/:id/transfer', protect, authorize('ADMIN', 'HOD', 'FACULTY'), transferThesis);
router.put('/:id/force-pre-submission', protect, authorize('HOD', 'FACULTY'), forcePreSubmission);

// Faculty
router.get('/assigned', protect, authorize('FACULTY'), getAssignedTheses);
router.get('/dept', protect, authorize('FACULTY'), getDeptTheses);
router.put('/:id/drc', protect, authorize('FACULTY'), drcApprove);
router.put('/:id/schedule-seminar', protect, authorize('FACULTY'), scheduleSeminar);
router.put('/:id/seminar', protect, authorize('FACULTY'), seminarClear);
router.put('/:id/final-approve', protect, authorize('FACULTY'), finalApprove);

// Global search cross-department
router.get('/search/global', protect, authorize('ADMIN', 'HOD', 'FACULTY'), searchGlobalTheses);

// Shared (admin + faculty can view single thesis)
router.get('/:id', protect, getThesisById);

module.exports = router;
