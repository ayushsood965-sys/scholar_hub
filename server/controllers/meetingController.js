const Meeting = require('../models/Meeting');
const Thesis = require('../models/Thesis');
const User = require('../models/User');
const paginate = require('../utils/paginate');
const { createNotification } = require('./notificationController');

// POST /api/meetings — Student requests a meeting
const requestMeeting = async (req, res) => {
  try {
    const { date, time, reason, attendees } = req.body;
    if (!date || !time || !reason) {
      return res.status(400).json({ message: 'Meeting date, time, and reason are required' });
    }

    // Find student's thesis
    const thesis = await Thesis.findOne({ scholarId: req.user._id });
    if (!thesis) return res.status(404).json({ message: 'Thesis context not found for this scholar.' });

    const newMeeting = await Meeting.create({
      scholarId: req.user._id,
      thesisId: thesis._id,
      date: new Date(date),
      time,
      reason,
      invitedAttendees: attendees || [],
      attendees: [],
      rejectedAttendees: [],
      department: thesis.department,
      status: 'PENDING'
    });

    // Notify invited faculty members (check members)
    if (attendees && attendees.length > 0) {
      await Promise.all(attendees.map(async (facultyId) => {
        await createNotification({
          recipient: facultyId,
          title: '⏳ New Guidance Consultation Request',
          message: `Scholar "${req.user.name}" has requested a meeting on ${new Date(date).toLocaleDateString()} at ${time}. Agenda: "${reason}".`,
          type: 'PENDING_ACTION',
          link: 'meetings'
        });
      }));
    }

    res.status(201).json(newMeeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/meetings/me — Student fetches their own requested meetings
const getMyMeetings = async (req, res) => {
  try {
    let mongoQuery = Meeting.find({ scholarId: req.user._id })
      .populate('invitedAttendees', 'name email username role subRole')
      .populate('attendees', 'name email username role subRole')
      .populate('rejectedAttendees', 'name email username role subRole')
      .populate('responseLogs.user', 'name role subRole')
      .sort({ createdAt: -1 });

    const meetings = await paginate(mongoQuery, req.query);

    // Legacy data fallback
    const formatted = meetings.map(m => {
      const mObj = m.toObject ? m.toObject() : m;
      if ((!mObj.invitedAttendees || mObj.invitedAttendees.length === 0) && mObj.attendees && mObj.attendees.length > 0) {
        mObj.invitedAttendees = mObj.attendees;
        if (mObj.status !== 'APPROVED') {
          mObj.attendees = [];
        }
      }
      return mObj;
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/meetings/dept — HOD fetches department meeting requests
const getDeptMeetings = async (req, res) => {
  try {
    let mongoQuery = Meeting.find({ department: req.user.department })
      .populate('scholarId', 'name email username profile')
      .populate('invitedAttendees', 'name email username role subRole')
      .populate('attendees', 'name email username role subRole')
      .populate('rejectedAttendees', 'name email username role subRole')
      .populate('responseLogs.user', 'name role subRole')
      .sort({ createdAt: -1 });

    const meetings = await paginate(mongoQuery, req.query);

    // Legacy data fallback
    const formatted = meetings.map(m => {
      const mObj = m.toObject ? m.toObject() : m;
      if ((!mObj.invitedAttendees || mObj.invitedAttendees.length === 0) && mObj.attendees && mObj.attendees.length > 0) {
        mObj.invitedAttendees = mObj.attendees;
        if (mObj.status !== 'APPROVED') {
          mObj.attendees = [];
        }
      }
      return mObj;
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/meetings/faculty — Faculty fetches meetings where they are in invite list
const getFacultyMeetings = async (req, res) => {
  try {
    let mongoQuery = Meeting.find({ 
      invitedAttendees: req.user._id
    })
      .populate('scholarId', 'name email username profile')
      .populate('invitedAttendees', 'name email username role subRole')
      .populate('attendees', 'name email username role subRole')
      .populate('rejectedAttendees', 'name email username role subRole')
      .populate('responseLogs.user', 'name role subRole')
      .sort({ createdAt: -1 });

    const meetings = await paginate(mongoQuery, req.query);

    // Legacy data fallback
    const formatted = meetings.map(m => {
      const mObj = m.toObject ? m.toObject() : m;
      if ((!mObj.invitedAttendees || mObj.invitedAttendees.length === 0) && mObj.attendees && mObj.attendees.length > 0) {
        mObj.invitedAttendees = mObj.attendees;
        if (mObj.status !== 'APPROVED') {
          mObj.attendees = [];
        }
      }
      return mObj;
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper to get user ID string robustly (works if populated or not)
const getUserIdStr = (userObj) => {
  if (!userObj) return '';
  return userObj._id ? userObj._id.toString() : userObj.toString();
};

// PUT /api/meetings/:id/respond — Faculty/HOD responds to meeting request
const respondMeeting = async (req, res) => {
  try {
    const { response } = req.body; // 'ACCEPT' or 'REJECT'
    if (!response || !['ACCEPT', 'REJECT'].includes(response)) {
      return res.status(400).json({ message: 'Valid response (ACCEPT/REJECT) is required' });
    }

    const meeting = await Meeting.findById(req.params.id)
      .populate('scholarId', 'name')
      .populate('invitedAttendees', 'name')
      .populate('attendees', 'name')
      .populate('rejectedAttendees', 'name');

    if (!meeting) return res.status(404).json({ message: 'Meeting request not found.' });

    // Legacy fix if invitedAttendees is empty
    if (!meeting.invitedAttendees || meeting.invitedAttendees.length === 0) {
      meeting.invitedAttendees = meeting.attendees || [];
    }

    // Check if user is in invitedAttendees
    const isInvited = meeting.invitedAttendees.some(id => getUserIdStr(id) === req.user._id.toString());
    if (!isInvited) {
      return res.status(403).json({ message: 'Not authorized. You are not invited to this meeting.' });
    }

    if (response === 'ACCEPT') {
      // Add user to attendees (if not already there)
      if (!meeting.attendees.some(id => getUserIdStr(id) === req.user._id.toString())) {
        meeting.attendees.push(req.user._id);
      }
      // Remove from rejectedAttendees if they had rejected before
      meeting.rejectedAttendees = meeting.rejectedAttendees.filter(id => getUserIdStr(id) !== req.user._id.toString());

      // Set overall status to APPROVED
      meeting.status = 'APPROVED';

      // Notify Student
      await createNotification({
        recipient: meeting.scholarId._id,
        title: '✅ Meeting Request Accepted!',
        message: `Faculty member "${req.user.name}" has accepted your meeting request for ${new Date(meeting.date).toLocaleDateString()} at ${meeting.time}.`,
        type: 'SUCCESSFUL_ACTION',
        link: 'meetings'
      });
    } else if (response === 'REJECT') {
      // Add user to rejectedAttendees (if not already there)
      if (!meeting.rejectedAttendees.some(id => getUserIdStr(id) === req.user._id.toString())) {
        meeting.rejectedAttendees.push(req.user._id);
      }
      // Remove from attendees if they had accepted before
      meeting.attendees = meeting.attendees.filter(id => getUserIdStr(id) !== req.user._id.toString());

      // If all invited attendees have rejected and no one has accepted, set status to REJECTED
      const hasAcceptedAny = meeting.attendees.length > 0;
      if (!hasAcceptedAny && meeting.rejectedAttendees.length === meeting.invitedAttendees.length) {
        meeting.status = 'REJECTED';
      }

      // Notify Student
      await createNotification({
        recipient: meeting.scholarId._id,
        title: '❌ Meeting Request Rejected',
        message: `Faculty member "${req.user.name}" has rejected your meeting request for ${new Date(meeting.date).toLocaleDateString()} at ${meeting.time}.`,
        type: 'PENDING_ACTION',
        link: 'meetings'
      });
    }

    if (!meeting.responseLogs) {
      meeting.responseLogs = [];
    }
    meeting.responseLogs.push({
      user: req.user._id,
      action: response,
      timestamp: new Date()
    });

    await meeting.save();
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  requestMeeting,
  getMyMeetings,
  getDeptMeetings,
  getFacultyMeetings,
  respondMeeting
};
