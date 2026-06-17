const express = require('express');
const router = express.Router();
const {
  getLabs,
  getPublications,
  getFunding,
  getEvents,
  getStats,
  submitInquiry,
  getDoctoralProjects,
  getCollaborationCalls
} = require('../controllers/publicController');

router.get('/labs', getLabs);
router.get('/publications', getPublications);
router.get('/funding', getFunding);
router.get('/events', getEvents);
router.get('/stats', getStats);
router.get('/projects', getDoctoralProjects);
router.get('/collab-calls', getCollaborationCalls);
router.post('/collaborate/inquiry', submitInquiry);

module.exports = router;
