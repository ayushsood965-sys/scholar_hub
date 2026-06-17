const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { login, register, getFacultyList, updateProfile, toggleUserActive, getDeptUsers, getAllUsers, adminCreateUser, deleteUser, uploadAvatar, uploadDocument, verifyUser, getMe } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const prefix = file.fieldname === 'avatar' ? 'avatar-' : 'doc-';
    cb(null, prefix + unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // limit extended to 10MB for documents

router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);
router.get('/faculty', protect, authorize('ADMIN', 'HOD', 'SUPER_ADMIN', 'STUDENT', 'FACULTY'), getFacultyList);
router.put('/profile', protect, updateProfile);
router.put('/profile/avatar', protect, upload.single('avatar'), uploadAvatar);
router.put('/profile/document', protect, upload.single('file'), uploadDocument);
router.put('/users/:id/active', protect, toggleUserActive);
router.put('/users/:id/verify', protect, verifyUser);
router.get('/dept-users', protect, getDeptUsers);
router.get('/all-users', protect, authorize('SUPER_ADMIN'), getAllUsers);
router.post('/create-user', protect, authorize('SUPER_ADMIN'), adminCreateUser);
router.delete('/users/:id', protect, authorize('SUPER_ADMIN'), deleteUser);

module.exports = router;
