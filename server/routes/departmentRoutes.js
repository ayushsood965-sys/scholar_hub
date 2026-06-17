const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');

// Anyone can query the list of departments (including public signup)
router.get('/', getAllDepartments);

// Only Super Admin is authorized to mutate departmental configurations
router.post('/', protect, authorize('SUPER_ADMIN'), createDepartment);
router.put('/:id', protect, authorize('SUPER_ADMIN'), updateDepartment);
router.delete('/:id', protect, authorize('SUPER_ADMIN'), deleteDepartment);

module.exports = router;
