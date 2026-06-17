const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  requestMeeting,
  getMyMeetings,
  getDeptMeetings,
  getFacultyMeetings,
  respondMeeting
} = require('../controllers/meetingController');

router.post('/', protect, authorize('STUDENT'), requestMeeting);
router.get('/me', protect, authorize('STUDENT'), getMyMeetings);
router.get('/dept', protect, authorize('HOD', 'ADMIN'), getDeptMeetings);
router.get('/faculty', protect, authorize('FACULTY'), getFacultyMeetings);
router.put('/:id/respond', protect, authorize('FACULTY', 'HOD', 'ADMIN'), respondMeeting);

module.exports = router;
