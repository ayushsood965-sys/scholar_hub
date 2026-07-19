const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getLabs,
  getPublications,
  getFunding,
  getEvents,
  getStats,
  submitInquiry,
  getDoctoralProjects,
  getCollaborationCalls,
  getLabById,
  getFundingStats,
  getFundingById,
  getPartnerships,
  getPartnershipById,
  getScholarFunding,
  getFacultyScholarsFunding,
  getFacultyAssignedInquiries,
  getRepositoryDepartments,
  getRepositoryDepartmentFaculties,
  getRepositoryDepartmentScholars,
  getRepositoryProfile
} = require('../controllers/publicController');

// Public routes
router.get('/labs', getLabs);
router.get('/labs/:id', getLabById);
router.get('/publications', getPublications);
router.get('/funding/stats', getFundingStats);
router.get('/funding', getFunding);
router.get('/funding/:id', getFundingById);
router.get('/events', getEvents);
router.get('/stats', getStats);
router.get('/projects', getDoctoralProjects);
router.get('/collab-calls', getCollaborationCalls);
router.post('/collaborate/inquiry', submitInquiry);
router.get('/partnerships', getPartnerships);
router.get('/partnerships/:id', getPartnershipById);

// Public Department & Scholar Repository routes
router.get('/repository/departments', getRepositoryDepartments);
router.get('/repository/departments/:code/faculties', getRepositoryDepartmentFaculties);
router.get('/repository/departments/:code/scholars', getRepositoryDepartmentScholars);
router.get('/repository/profile/:username', getRepositoryProfile);

// Authenticated user-specific dashboard routes
router.get('/dashboard/scholar/funding', protect, getScholarFunding);
router.get('/dashboard/faculty/funding', protect, getFacultyScholarsFunding);
router.get('/dashboard/faculty/inquiries', protect, getFacultyAssignedInquiries);

module.exports = router;
