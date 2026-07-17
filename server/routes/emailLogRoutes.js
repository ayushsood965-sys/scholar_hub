const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getEmailLogs, getEmailStats, retryFailedEmail } = require('../controllers/emailLogController');

// All routes require SUPER_ADMIN
router.get('/', protect, authorize('SUPER_ADMIN'), getEmailLogs);
router.get('/stats', protect, authorize('SUPER_ADMIN'), getEmailStats);
router.post('/:id/retry', protect, authorize('SUPER_ADMIN'), retryFailedEmail);

module.exports = router;
