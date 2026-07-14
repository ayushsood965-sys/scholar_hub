const express = require('express');
const router = express.Router();
const { createLog, getLogs } = require('../controllers/installLogController');
const { protect, authorize } = require('../middleware/authMiddleware');

// POST /api/install-logs — anyone can log install action
router.post('/', createLog);

// GET /api/install-logs — only SUPER_ADMIN can view logs
router.get('/', protect, authorize('SUPER_ADMIN'), getLogs);

module.exports = router;
