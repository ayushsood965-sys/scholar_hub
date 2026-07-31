const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMilestones, submitDocument, reviewMilestone, createMilestone, getDefaulters, updateFeeDetails } = require('../controllers/milestoneController');

const { createUpload } = require('../utils/uploadConfig');
const upload = createUpload(50);

router.get('/defaulters', protect, getDefaulters);
router.get('/:thesisId', protect, getMilestones);
router.post('/create', protect, createMilestone);
router.post('/:id/submit', protect, upload.fields([{ name: 'document', maxCount: 1 }, { name: 'plagiarism', maxCount: 1 }]), submitDocument);
router.post('/:id/fee-details', protect, upload.single('feeReceipt'), updateFeeDetails);
router.put('/:id/review', protect, reviewMilestone);

module.exports = router;
