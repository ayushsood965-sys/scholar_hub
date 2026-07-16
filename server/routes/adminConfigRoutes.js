const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createLab,
  updateLab,
  deleteLab,
  getInquiries,
  updateInquiry,
  createFunding,
  updateFunding,
  deleteFunding,
  createEvent,
  updateEvent,
  deleteEvent,
  createDoctoralProject,
  updateDoctoralProject,
  deleteDoctoralProject,
  createCollaborationCall,
  updateCollaborationCall,
  deleteCollaborationCall,
  createFundingAward,
  getFundingAwards,
  updateFundingAward,
  deleteFundingAward,
  createPartnership,
  updatePartnership,
  deletePartnership,
  assignInquiry,
  addInquiryNote
} = require('../controllers/adminConfigController');

// All config routes require authentication and HOD/Admin/Super Admin/Faculty privileges
router.use(protect);
router.use(authorize('ADMIN', 'HOD', 'SUPER_ADMIN', 'FACULTY'));

// Research Labs
router.post('/labs', createLab);
router.put('/labs/:id', updateLab);
router.delete('/labs/:id', deleteLab);

// Inquiries
router.get('/inquiries', getInquiries);
router.put('/inquiries/:id', updateInquiry);
router.put('/inquiries/:id/assign', assignInquiry);
router.put('/inquiries/:id/notes', addInquiryNote);

// Funding
router.post('/funding', createFunding);
router.put('/funding/:id', updateFunding);
router.delete('/funding/:id', deleteFunding);

// Funding Awards
router.post('/funding-awards', createFundingAward);
router.get('/funding-awards', getFundingAwards);
router.put('/funding-awards/:id', updateFundingAward);
router.delete('/funding-awards/:id', deleteFundingAward);

// Partnerships
router.post('/partnerships', createPartnership);
router.put('/partnerships/:id', updatePartnership);
router.delete('/partnerships/:id', deletePartnership);

// Events
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);

// Doctoral Projects
router.post('/projects', createDoctoralProject);
router.put('/projects/:id', updateDoctoralProject);
router.delete('/projects/:id', deleteDoctoralProject);

// Collaboration Calls
router.post('/collab-calls', createCollaborationCall);
router.put('/collab-calls/:id', updateCollaborationCall);
router.delete('/collab-calls/:id', deleteCollaborationCall);

module.exports = router;
