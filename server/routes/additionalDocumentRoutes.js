const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadDocument,
  getMyDocuments,
  getForwardedDocuments,
  getDocumentsByThesis,
  reviewDocument
} = require('../controllers/additionalDocumentController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.post('/', protect, upload.single('document'), uploadDocument);
router.get('/me', protect, getMyDocuments);
router.get('/forwarded', protect, getForwardedDocuments);
router.get('/thesis/:thesisId', protect, getDocumentsByThesis);
router.put('/:id/review', protect, reviewDocument);

module.exports = router;
