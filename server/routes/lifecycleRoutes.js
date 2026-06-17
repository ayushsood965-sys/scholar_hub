const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  scheduleRAC,
  uploadRACReport,
  submitRACResult,
  getRACs,
  submitChangeRequest,
  reviewChangeRequest,
  getChangeRequests,
  getDeptChangeRequests,
  submitPublication,
  verifyPublication,
  getPublications,
  getDeptPublications,
  generateCertificate,
  scheduleDRC,
  submitDRCResult,
  getDRCMeetings,
  recordOfflineDRC,
  rescheduleDRC
} = require('../controllers/lifecycleController');

const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// ── RAC reviews ──
router.post('/rac/schedule', protect, scheduleRAC);
router.put('/rac/:id/report', protect, upload.single('document'), uploadRACReport);
router.put('/rac/:id/result', protect, submitRACResult);
router.get('/rac/thesis/:thesisId', protect, getRACs);

// ── Change Requests ──
router.post('/change-requests', protect, submitChangeRequest);
router.put('/change-requests/:id/review', protect, reviewChangeRequest);
router.get('/change-requests/thesis/:thesisId', protect, getChangeRequests);
router.get('/change-requests/department/:department', protect, getDeptChangeRequests);

// ── Publications ──
router.post('/publications', protect, submitPublication);
router.put('/publications/:id/verify', protect, verifyPublication);
router.get('/publications/thesis/:thesisId', protect, getPublications);
router.get('/publications/department/:department', protect, getDeptPublications);

// ── DRC Meetings ──
router.post('/drc/schedule', protect, scheduleDRC);
router.post('/drc/offline', protect, recordOfflineDRC);
router.put('/drc/:id/result', protect, submitDRCResult);
router.put('/drc/:id/reschedule', protect, rescheduleDRC);
router.get('/drc/thesis/:thesisId', protect, getDRCMeetings);

// ── Printable dynamic certificates ──
router.get('/certificates/:thesisId/:type', generateCertificate);

module.exports = router;
