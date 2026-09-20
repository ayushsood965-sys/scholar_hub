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
  addFundingDisbursement,
  updateFundingDisbursement,
  deleteFundingDisbursement,
  batchDisburseMonth,
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

// Funding Schemes (Central University Master Schemes governed by Super Admin / Central Admin)
router.post('/funding', authorize('SUPER_ADMIN', 'ADMIN'), createFunding);
router.put('/funding/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateFunding);
router.delete('/funding/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteFunding);

// Funding Awards (HODs, Central Admins, and Super Admins can assign awards to scholars)
router.post('/funding-awards', authorize('SUPER_ADMIN', 'ADMIN', 'HOD'), createFundingAward);
router.get('/funding-awards', getFundingAwards);
router.put('/funding-awards/:id', authorize('SUPER_ADMIN', 'ADMIN', 'HOD'), updateFundingAward);
router.delete('/funding-awards/:id', authorize('SUPER_ADMIN', 'ADMIN', 'HOD'), deleteFundingAward);
router.post('/funding-awards/:id/disbursements', authorize('SUPER_ADMIN', 'ADMIN', 'HOD'), addFundingDisbursement);
router.put('/funding-awards/:id/disbursements/:disbursementId', authorize('SUPER_ADMIN', 'ADMIN', 'HOD'), updateFundingDisbursement);
router.delete('/funding-awards/:id/disbursements/:disbursementId', authorize('SUPER_ADMIN', 'ADMIN', 'HOD'), deleteFundingDisbursement);
router.post('/funding-awards/batch-disburse', authorize('SUPER_ADMIN', 'ADMIN', 'HOD'), batchDisburseMonth);

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
