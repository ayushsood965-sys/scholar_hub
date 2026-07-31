const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  submitPublication,
  getPublicationsByThesis,
  getDeptPublications,
  verifyPublication,
  updatePublication,
  deletePublication,
  submitDrafts
} = require('../controllers/publicationController');

const { createUpload } = require('../utils/uploadConfig');
const upload = createUpload(50);

router.post('/', protect, upload.single('document'), submitPublication);
router.get('/thesis/:thesisId', protect, getPublicationsByThesis);
router.get('/department/:department', protect, getDeptPublications);
router.put('/:id/verify', protect, verifyPublication);
router.put('/:id', protect, upload.single('document'), updatePublication);
router.delete('/:id', protect, deletePublication);
router.put('/thesis/:thesisId/submit-drafts', protect, submitDrafts);

module.exports = router;
