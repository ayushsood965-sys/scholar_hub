const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMilestones, submitDocument, reviewMilestone, createMilestone, getDefaulters, updateFeeDetails } = require('../controllers/milestoneController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/defaulters', protect, getDefaulters);
router.get('/:thesisId', protect, getMilestones);
router.post('/create', protect, createMilestone);
router.post('/:id/submit', protect, upload.fields([{ name: 'document', maxCount: 1 }, { name: 'plagiarism', maxCount: 1 }]), submitDocument);
router.post('/:id/fee-details', protect, upload.single('feeReceipt'), updateFeeDetails);
router.put('/:id/review', protect, reviewMilestone);

module.exports = router;
