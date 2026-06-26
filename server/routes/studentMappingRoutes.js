const express = require('express');
const router = express.Router();
const studentMappingController = require('../controllers/studentMappingController');
const { protect, authorize } = require('../middleware/authMiddleware');
const requireDepartment = require('../middleware/requireDepartment');

// ==========================================
// Student-Semester-Subject Mapping Routes
// ==========================================

// Filter data (sessions, degree types, degree names, semesters)
router.get('/filters', protect, studentMappingController.getFilterData);

// Preview: get faculty's subjects + eligible students for mapping
router.get('/preview', protect, authorize('FACULTY', 'HOD'), requireDepartment, studentMappingController.getPreview);

// Save mapping
router.post('/save', protect, authorize('FACULTY', 'HOD'), requireDepartment, studentMappingController.saveMapping);

// Get mapped records (for details tab)
router.get('/mapped', protect, authorize('FACULTY', 'HOD'), requireDepartment, studentMappingController.getMappedRecords);

// Delete a mapped record (entire or specific subject)
router.delete('/:id', protect, authorize('FACULTY', 'HOD'), requireDepartment, studentMappingController.deleteMappedRecord);

module.exports = router;
