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
  getFacultyAssignedInquiries
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

// Authenticated user-specific dashboard routes
router.get('/dashboard/scholar/funding', protect, getScholarFunding);
router.get('/dashboard/faculty/funding', protect, getFacultyScholarsFunding);
router.get('/dashboard/faculty/inquiries', protect, getFacultyAssignedInquiries);

module.exports = router;
