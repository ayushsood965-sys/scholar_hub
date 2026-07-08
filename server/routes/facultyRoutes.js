const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty
} = require('../controllers/facultyController');

router.get('/', getAllFaculties);
router.post('/', protect, authorize('SUPER_ADMIN'), createFaculty);
router.put('/:id', protect, authorize('SUPER_ADMIN'), updateFaculty);
router.delete('/:id', protect, authorize('SUPER_ADMIN'), deleteFaculty);

module.exports = router;
