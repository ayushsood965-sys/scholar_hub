const Milestone = require('../models/Milestone');
const Thesis = require('../models/Thesis');
const User = require('../models/User');
const RACReview = require('../models/RACReview');
const { createNotification } = require('./notificationController');

const getPeriodMeta = (startDate, seq) => {
  const start = new Date(startDate);
  start.setMonth(start.getMonth() + (seq - 1) * 6);
  
  const end = new Date(startDate);
  end.setMonth(end.getMonth() + seq * 6);
  
  const options = { year: 'numeric', month: 'short' };
  const durationStr = `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  
  return {
    title: `6-Month Progress Report - Semester ${seq} (${durationStr})`,
    dueDate: end
  };
};

// Helper to generate milestones dynamically based on timeline & prerequisites
const generateMilestonesIfNeeded = async (thesisId) => {
  const thesis = await Thesis.findById(thesisId);
  if (thesis && ['ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED', 'AWARDED'].includes(thesis.status) && thesis.startDate) {
    // Use admissionDate from scholar profile if available, else fall back to thesis.startDate
    const scholar = await User.findById(thesis.scholarId);
    const admissionDate = scholar?.profile?.admissionDate ? new Date(scholar.profile.admissionDate) : null;
    const referenceDate = admissionDate && !isNaN(admissionDate.getTime()) ? admissionDate : new Date(thesis.startDate);

    // Calculate how many 6-month periods have elapsed/started
    const diffMs = new Date() - referenceDate;
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.4375); // average days per month
    const activePeriods = Math.max(1, Math.ceil(diffMonths / 6));

    for (let i = 1; i <= activePeriods; i++) {
      // Check if this milestone already exists
      const exists = await Milestone.findOne({ thesisId: thesis._id, type: '6_MONTH_REPORT', sequence: i });
      if (!exists) {
        const meta = getPeriodMeta(referenceDate, i);
        await Milestone.create({
          thesisId: thesis._id,
          type: '6_MONTH_REPORT',
          sequence: i,
          title: meta.title,
          dueDate: meta.dueDate,
          status: 'PENDING'
        });
      }
    }

    // Check Phase 5 Pre-Submission prerequisites:
    // 1. Minimum 3 years (36 months) passed since admission/start (or 18 months if M.Phil is completed and verified)
    const hasMphil = scholar?.profile?.qualifications?.mphil?.done === true && scholar?.isVerified === true;
    const requiredMonths = hasMphil ? 18 : 36;
    const hasThreeYearsPassed = diffMonths >= requiredMonths;

    // 2. All 6-month progress reports are approved (at least 3 for M.Phil holders, 6 for others)
    const reports = await Milestone.find({ thesisId: thesis._id, type: '6_MONTH_REPORT' });
    const requiredReportsCount = hasMphil ? 3 : 6;
    const approvedReportsCount = reports.filter(r => r.status === 'APPROVED').length;
    const allReportsApproved = approvedReportsCount >= requiredReportsCount;

    // 3. Required publications are approved (at least 2 verified journals and 2 verified conferences)
    const Publication = require('../models/Publication');
    const verifiedJournals = await Publication.countDocuments({ thesisId: thesis._id, type: 'JOURNAL', status: 'VERIFIED' });
    const verifiedConferences = await Publication.countDocuments({ thesisId: thesis._id, type: 'CONFERENCE', status: 'VERIFIED' });
    const publicationsApproved = verifiedJournals >= 2 && verifiedConferences >= 2;

    if (hasThreeYearsPassed && allReportsApproved && publicationsApproved) {
      const preExists = await Milestone.findOne({ thesisId: thesis._id, type: 'PRE_SUBMISSION' });
      if (!preExists) {
        await Milestone.create({
          thesisId: thesis._id,
          type: 'PRE_SUBMISSION',
          title: 'Pre-Submission Thesis & Plagiarism Clearance Package',
          status: 'PENDING',
          sequence: 99
        });
      }
    }
  }
};

// GET /api/milestones/:thesisId
const getMilestones = async (req, res) => {
  try {
    await generateMilestonesIfNeeded(req.params.thesisId);
    const milestones = await Milestone.find({ thesisId: req.params.thesisId })
      .sort('sequence createdAt');
    res.json(milestones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/milestones/:id/submit — Scholar uploads document
const submitDocument = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    // Verify scholar owns this thesis
    const thesis = await Thesis.findById(milestone.thesisId);
    if (['PENDING_HOD', 'SUBMITTED', 'AWARDED'].includes(thesis.status)) {
      return res.status(403).json({ message: 'Thesis is approved or pending final sign-off. Uploads are locked.' });
    }
    if (milestone.type === 'FINAL_SUBMISSION' && ['SUBMITTED', 'PENDING_HOD', 'APPROVED'].includes(milestone.status)) {
      return res.status(400).json({ message: 'Final Bound Thesis package is already submitted and under review.' });
    }

    // Update thesis details if provided (common when finalizing synopsis)
    if (req.body.abstract) {
      thesis.abstract = req.body.abstract;
    }
    if (req.body.title) {
      thesis.title = req.body.title;
    }
    await thesis.save();

    if (req.files) {
      if (req.files['document'] && req.files['document'][0]) {
        milestone.documentUrl = `/uploads/${req.files['document'][0].filename}`;
      }
      if (req.files['plagiarism'] && req.files['plagiarism'][0]) {
        milestone.plagiarismReportUrl = `/uploads/${req.files['plagiarism'][0].filename}`;
      }
    } else if (req.file) {
      milestone.documentUrl = `/uploads/${req.file.filename}`;
    }

    if (req.body.documentUrl) milestone.documentUrl = req.body.documentUrl;
    if (req.body.plagiarismReportUrl) milestone.plagiarismReportUrl = req.body.plagiarismReportUrl;

    milestone.status = 'SUBMITTED';
    milestone.submittedAt = new Date();
    await milestone.save();

    if (milestone.type === 'FINAL_SUBMISSION') {
      thesis.status = 'THESIS_SUBMITTED';
      await thesis.save();
    }

    if (thesis.supervisorId) {
      await createNotification({
        recipient: thesis.supervisorId,
        title: milestone.type === 'FINAL_SUBMISSION' ? '⏳ Final Thesis Awaiting Sign-off' : '⏳ Milestone Review Pending',
        message: milestone.type === 'FINAL_SUBMISSION'
          ? `Scholar "${req.user.name}" has uploaded their absolute Final Bound Thesis. Please review and provide sign-off.`
          : `Scholar "${req.user.name}" has uploaded a document for milestone "${milestone.title}". Action needed: Please review and record your grade.`,
        type: 'PENDING_ACTION',
        link: 'overview'
      });
    }

    res.json(milestone);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/milestones/:id/review — Faculty approves or rejects
const reviewMilestone = async (req, res) => {
  try {
    const { action, comment } = req.body; // action: 'APPROVE' | 'REVISION'
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    let isSynopsis = milestone.type === 'SYNOPSIS';
    let isPreSubmission = milestone.type === 'PRE_SUBMISSION';
    let isTwoStep = isSynopsis || isPreSubmission;

    if (isTwoStep) {
      if (action === 'APPROVE') {
        if (milestone.status === 'PENDING_HOD') {
          milestone.status = 'APPROVED';
        } else {
          milestone.status = 'PENDING_HOD';
        }
      } else {
        milestone.status = 'REVISION_REQUIRED';
      }
    } else {
      milestone.status = action === 'APPROVE' ? 'APPROVED' : 'REVISION_REQUIRED';
    }
    milestone.reviewedAt = new Date();

    if (comment) {
      milestone.comments.push({
        authorId: req.user._id,
        authorName: req.user.name,
        text: comment,
      });
    }

    await milestone.save();

    // If FINAL_SUBMISSION approved → supervisor triggers final approve on thesis (handled via thesis route)
    const thesis = await Thesis.findById(milestone.thesisId);
    if (thesis) {
      if (milestone.status === 'PENDING_HOD') {
        // Notify HOD
        await createNotification({
          roleScope: 'HOD',
          department: thesis.department,
          title: isPreSubmission ? '⏳ Pre-Submission HOD Approval Pending' : '⏳ Synopsis HOD Approval Pending',
          message: isPreSubmission
            ? `The pre-submission package of Scholar "${thesis.title}" has been approved by supervisor ${req.user.name} and awaits your final HOD approval.`
            : `The synopsis document of Scholar "${thesis.title}" has been approved by supervisor ${req.user.name} and awaits your final HOD approval.`,
          type: 'PENDING_ACTION',
          link: isPreSubmission ? 'overview' : 'registrations'
        });
      } else if (milestone.status === 'APPROVED') {
        await createNotification({
          recipient: thesis.scholarId,
          title: isSynopsis ? '🎉 Synopsis Approved!' : isPreSubmission ? '🎉 Pre-Submission Draft Approved!' : '🎉 Milestone Approved!',
          message: isSynopsis 
            ? `Your synopsis document has been officially approved by the department. HOD can now schedule the DRC meeting.`
            : isPreSubmission
            ? `Your pre-submission thesis draft and plagiarism package have been officially APPROVED by the department. HOD will schedule your Pre-Submission Seminar shortly.`
            : `Your supervisor "${req.user.name}" has APPROVED your submission for milestone "${milestone.title}".`,
          type: 'SUCCESSFUL_ACTION',
          link: 'overview'
        });
      } else {
        await createNotification({
          recipient: thesis.scholarId,
          title: isSynopsis ? '⚠️ Synopsis Revision Required' : isPreSubmission ? '⚠️ Pre-Submission Package Revision Required' : '⚠️ Milestone Revision Required',
          message: isSynopsis
            ? `Corrections have been requested for your synopsis submission by ${req.user.role === 'HOD' ? 'HOD' : 'supervisor'} "${req.user.name}". Feedback: "${comment || 'Please check comments.'}"`
            : isPreSubmission
            ? `Corrections have been requested for your pre-submission draft package by ${req.user.role === 'HOD' ? 'HOD' : 'supervisor'} "${req.user.name}". Feedback: "${comment || 'Please check comments.'}"`
            : `Your supervisor "${req.user.name}" has requested corrections for milestone "${milestone.title}". Feedback: "${comment || 'Please check supervisor comments.'}"`,
          type: 'PENDING_ACTION',
          link: 'overview'
        });
      }

      // Log the supervisor text feedback into the RACReview collection (Step 2)
      const racReview = new RACReview({
        scholarId: thesis.scholarId,
        thesisId: thesis._id,
        milestoneId: milestone._id,
        reviewerId: req.user._id,
        comments: comment || (action === 'APPROVE' ? 'Approved' : 'Revision Required'),
        status: action === 'APPROVE' ? 'SATISFACTORY' : 'UNSATISFACTORY',
        remarks: comment || '',
        racNumber: 1,
        scheduledDate: new Date()
      });
      await racReview.save();
    }

    res.json(milestone);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/milestones/create — Faculty/Admin can create a new progress report milestone
const createMilestone = async (req, res) => {
  try {
    const { thesisId, type, title, sequence, dueDate } = req.body;
    const milestone = await Milestone.create({ thesisId, type, title, sequence, dueDate });

    const thesis = await Thesis.findById(thesisId);
    if (thesis) {
      await createNotification({
        recipient: thesis.scholarId,
        title: '🚀 New Deliverable Assigned',
        message: `A new milestone has been created for your Ph.D. track: "${title}". Due Date: ${dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}.`,
        type: 'INFO',
        link: 'overview'
      });
    }

    res.status(201).json(milestone);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/milestones/defaulters — Admin fetches scholars whose progress reports are overdue (Step 5)
const getDefaulters = async (req, res) => {
  try {
    const overdueReports = await Milestone.find({
      type: '6_MONTH_REPORT',
      dueDate: { $lt: new Date() },
      status: 'PENDING'
    }).populate({
      path: 'thesisId',
      populate: { path: 'scholarId' }
    });

    const formatted = overdueReports.map(m => {
      const thesis = m.thesisId;
      const scholar = thesis?.scholarId;
      return {
        _id: m._id,
        milestoneTitle: m.title,
        dueDate: m.dueDate,
        status: m.status,
        scholarName: scholar ? scholar.name : 'Unknown Scholar',
        scholarDepartment: thesis ? thesis.department : 'N/A',
        enrollmentNumber: thesis ? thesis.enrollmentNumber : 'N/A',
        supervisorId: thesis ? thesis.supervisorId : null,
        scholarId: scholar ? scholar._id : null
      };
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getMilestones,
  submitDocument,
  reviewMilestone,
  createMilestone,
  getDefaulters,
  generateMilestonesIfNeeded
};
