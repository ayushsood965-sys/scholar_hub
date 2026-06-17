const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  submitPublication,
  getPublicationsByThesis,
  getDeptPublications,
  verifyPublication
} = require('../controllers/publicationController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/', protect, upload.single('document'), submitPublication);
router.get('/thesis/:thesisId', protect, getPublicationsByThesis);
router.get('/department/:department', protect, getDeptPublications);
router.put('/:id/verify', protect, verifyPublication);

module.exports = router;
