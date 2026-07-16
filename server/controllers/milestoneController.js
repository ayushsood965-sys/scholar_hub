const Milestone = require('../models/Milestone');
const Thesis = require('../models/Thesis');
const User = require('../models/User');
const RACReview = require('../models/RACReview');
const paginate = require('../utils/paginate');
const { createNotification } = require('./notificationController');

const getPeriodMeta = (startDate, seq) => {
  const start = new Date(startDate);
  start.setMonth(start.getMonth() + (seq - 1) * 6);
  
  const end = new Date(startDate);
  end.setMonth(end.getMonth() + seq * 6);
  
  const options = { year: 'numeric', month: 'short' };
  const durationStr = `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  
  return {
    title: `Research Progress Report #${seq}`,
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
          status: 'DRAFT'
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
    const approvedReportsCount = reports.filter(r => r.status === 'VERIFIED').length;
    const allReportsApproved = approvedReportsCount >= requiredReportsCount;

    // 3. Required publications are approved (at least 2 verified journals and 2 verified conferences)
    const Publication = require('../models/Publication');
    const verifiedJournals = await Publication.countDocuments({ thesisId: thesis._id, type: 'JOURNAL', status: 'VERIFIED' });
    const verifiedConferences = await Publication.countDocuments({ thesisId: thesis._id, type: 'CONFERENCE', status: 'VERIFIED' });
    const publicationsApproved = verifiedJournals >= 2 && verifiedConferences >= 2;

    // 4. Research Synopsis must be officially cleared/approved
    const synopsisMilestone = await Milestone.findOne({ thesisId: thesis._id, type: 'SYNOPSIS' });
    const synopsisApproved = synopsisMilestone?.status === 'APPROVED';

    if (hasThreeYearsPassed && allReportsApproved && publicationsApproved && synopsisApproved) {
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
    let milestones = await Milestone.find({ thesisId: req.params.thesisId })
      .populate('forwardedTo', 'name email role subRole')
      .sort('sequence createdAt');

    // Filter out chapter drafts if the requester is not the scholar and not an admin
    const thesis = await Thesis.findById(req.params.thesisId);
    const isScholar = thesis && thesis.scholarId.toString() === req.user._id.toString();
    const isSupervisor = thesis && thesis.supervisorId && thesis.supervisorId.toString() === req.user._id.toString();
    const isHodUser = req.user.role === 'HOD' || req.user.subRole === 'HOD' || req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    if (!isScholar && !isAdmin && req.user.role !== 'STUDENT') {
      milestones = milestones.filter(m => {
        if (m.type === 'CHAPTER_DRAFT') {
          const fwdId = m.forwardedTo?._id ? m.forwardedTo._id.toString() : m.forwardedTo?.toString();
          return fwdId && fwdId === req.user._id.toString();
        }
        return true;
      });
    }

    // Hide uploaded report files from HOD/Admin until verified by Supervisor
    milestones = milestones.map(m => {
      const obj = m.toObject ? m.toObject() : m;
      if (obj.type === '6_MONTH_REPORT' && isHodUser && !isSupervisor && !isAdmin) {
        if (!['UNDER_REVIEW_HOD', 'VERIFIED', 'REJECTED_BY_HOD'].includes(obj.status)) {
          obj.documentUrl = null;
          obj.plagiarismReportUrl = null;
        }
      }
      return obj;
    });

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

    if (milestone.type === '6_MONTH_REPORT') {
      milestone.status = 'PENDING';
    } else {
      milestone.status = 'SUBMITTED';
    }
    milestone.submittedAt = new Date();

    milestone.history = milestone.history || [];
    milestone.history.push({
      action: 'SUBMITTED',
      actorName: req.user.name,
      actorRole: 'STUDENT',
      documentUrl: milestone.documentUrl,
      plagiarismReportUrl: milestone.plagiarismReportUrl,
      remarks: 'Uploaded package files.',
      timestamp: new Date()
    });

    await milestone.save();

    if (milestone.type === 'FINAL_SUBMISSION') {
      thesis.status = 'THESIS_SUBMITTED';
      
      // Reset external evaluation and viva fields for a fresh evaluation cycle
      thesis.externalEvaluationStatus = 'PENDING';
      thesis.dispatchDate = null;
      thesis.dispatchMethod = '';
      thesis.dispatchTrackingNumber = '';
      thesis.externalEvaluationSentTo = '';
      thesis.externalEvaluationRemarks = '';
      thesis.externalEvaluationLoggedAt = null;
      thesis.externalEvaluationLoggedBy = null;
      
      thesis.vivaStatus = 'NOT_SCHEDULED';
      thesis.vivaDate = null;
      thesis.vivaTime = '';
      thesis.vivaVenue = '';
      thesis.vivaRemarks = '';
      thesis.vivaPanel = '';
      thesis.vivaCoordinator = '';
      thesis.vivaMeetingLink = '';
      
      await thesis.save();
    }

    const recipient = (milestone.type === 'CHAPTER_DRAFT' && milestone.forwardedTo) 
      ? milestone.forwardedTo 
      : thesis.supervisorId;

    if (recipient) {
      await createNotification({
        recipient,
        title: milestone.type === 'CHAPTER_DRAFT' ? '⏳ Chapter Draft Submitted' : (milestone.type === 'FINAL_SUBMISSION' ? '⏳ Final Thesis Awaiting Sign-off' : '⏳ Milestone Review Pending'),
        message: milestone.type === 'CHAPTER_DRAFT'
          ? `Scholar "${req.user.name}" has submitted chapter draft "${milestone.title}" to you for review.`
          : milestone.type === 'FINAL_SUBMISSION'
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

    if (milestone.type === 'CHAPTER_DRAFT' && milestone.forwardedTo) {
      if (milestone.forwardedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized. This chapter draft was not forwarded to you.' });
      }
    }

    const thesis = await Thesis.findById(milestone.thesisId);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    const isSupervisor = thesis.supervisorId && thesis.supervisorId.toString() === req.user._id.toString();
    const isHodUser = req.user.role === 'HOD' || req.user.subRole === 'HOD' || req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    if (milestone.type === '6_MONTH_REPORT') {
      if (isSupervisor) {
        if (action === 'APPROVE') {
          milestone.status = 'UNDER_REVIEW_HOD';
        } else {
          milestone.status = 'REJECTED_BY_SUPERVISOR';
        }
      } else if (isHodUser) {
        if (milestone.status !== 'UNDER_REVIEW_HOD') {
          return res.status(400).json({ message: 'This report must first be verified by the supervisor.' });
        }
        if (action === 'APPROVE') {
          milestone.status = 'VERIFIED';
        } else {
          milestone.status = 'REJECTED_BY_HOD';
        }
      } else {
        return res.status(403).json({ message: 'Not authorized to review this report.' });
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

      // Notifications
      if (milestone.status === 'UNDER_REVIEW_HOD') {
        await createNotification({
          roleScope: 'HOD',
          department: thesis.department,
          title: '📑 Progress Report Supervisor Approved',
          message: `The 6-month progress report "${milestone.title}" of scholar "${thesis.title || 'Scholar'}" has been verified by supervisor ${req.user.name} and awaits HOD approval.`,
          type: 'PENDING_ACTION',
          link: 'overview'
        });
        await createNotification({
          recipient: thesis.scholarId,
          title: '📑 Progress Report Verified by Supervisor',
          message: `Your 6-month progress report "${milestone.title}" has been verified by your supervisor and forwarded to HOD for final approval.`,
          type: 'INFO',
          link: 'overview'
        });
      } else if (milestone.status === 'REJECTED_BY_SUPERVISOR') {
        await createNotification({
          recipient: thesis.scholarId,
          title: '❌ Progress Report Rejected by Supervisor',
          message: `Your 6-month progress report "${milestone.title}" has been rejected by supervisor ${req.user.name}. Feedback: "${comment || 'Please check comments.'}"`,
          type: 'PENDING_ACTION',
          link: 'overview'
        });
      } else if (milestone.status === 'VERIFIED') {
        await createNotification({
          recipient: thesis.scholarId,
          title: '🎉 Progress Report Approved by HOD',
          message: `Your 6-month progress report "${milestone.title}" has been officially APPROVED and VERIFIED by the HOD.`,
          type: 'SUCCESSFUL_ACTION',
          link: 'overview'
        });
        if (thesis.supervisorId) {
          await createNotification({
            recipient: thesis.supervisorId,
            title: '✅ Progress Report Verified by HOD',
            message: `The 6-month progress report "${milestone.title}" for scholar "${thesis.title || 'Scholar'}" has been approved by HOD.`,
            type: 'INFO',
            link: 'overview'
          });
        }
      } else if (milestone.status === 'REJECTED_BY_HOD') {
        await createNotification({
          recipient: thesis.scholarId,
          title: '❌ Progress Report Rejected by HOD',
          message: `Your 6-month progress report "${milestone.title}" has been rejected by the HOD. Feedback: "${comment || 'Please check comments.'}"`,
          type: 'PENDING_ACTION',
          link: 'overview'
        });
      }

      // Log the supervisor/HOD feedback into the RACReview collection
      const racReview = new RACReview({
        scholarId: thesis.scholarId,
        thesisId: thesis._id,
        milestoneId: milestone._id,
        reviewerId: req.user._id,
        comments: comment || (action === 'APPROVE' ? 'Approved' : 'Revision Required'),
        status: action === 'APPROVE' ? 'SATISFACTORY' : 'UNSATISFACTORY',
        remarks: comment || '',
        racNumber: milestone.sequence || 1,
        scheduledDate: new Date()
      });
      await racReview.save();

      return res.json(milestone);
    }

    let isSynopsis = milestone.type === 'SYNOPSIS';
    let isPreSubmission = milestone.type === 'PRE_SUBMISSION';
    let isTwoStep = isSynopsis || isPreSubmission;

    const previousStatus = milestone.status;
    const isHOD = req.user.role === 'HOD' || req.user.subRole === 'HOD';

    if (isTwoStep) {
      if (action === 'APPROVE') {
        if (milestone.status === 'PENDING_HOD') {
          if (milestone.type === 'PRE_SUBMISSION') {
            milestone.status = 'VERIFIED';
          } else {
            milestone.status = 'APPROVED';
          }
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

    let histAction = '';
    if (action === 'APPROVE') {
      if (isTwoStep) {
        if (previousStatus === 'PENDING_HOD') {
          histAction = 'HOD_APPROVED';
        } else {
          histAction = 'SUPERVISOR_APPROVED';
        }
      } else {
        histAction = 'APPROVED';
      }
    } else {
      if (isTwoStep) {
        histAction = isHOD ? 'HOD_REJECTED' : 'SUPERVISOR_REJECTED';
      } else {
        histAction = 'REVISION_REQUIRED';
      }
    }

    milestone.history = milestone.history || [];
    milestone.history.push({
      action: histAction,
      actorName: req.user.name,
      actorRole: isHOD ? 'HOD' : (isSupervisor ? 'SUPERVISOR' : req.user.role),
      documentUrl: milestone.documentUrl,
      plagiarismReportUrl: milestone.plagiarismReportUrl,
      remarks: comment || (action === 'APPROVE' ? 'Approved.' : 'Revision requested.'),
      timestamp: new Date()
    });

    await milestone.save();

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
    const { thesisId, type, title, sequence, dueDate, forwardedTo, forwardedRole } = req.body;
    const milestone = await Milestone.create({
      thesisId,
      type,
      title,
      sequence,
      dueDate,
      forwardedTo,
      forwardedRole,
      status: type === '6_MONTH_REPORT' ? 'DRAFT' : 'PENDING'
    });

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
    let mongoQuery = Milestone.find({
      type: '6_MONTH_REPORT',
      dueDate: { $lt: new Date() },
      status: 'PENDING'
    }).populate({
      path: 'thesisId',
      populate: { path: 'scholarId' }
    });

    const overdueReports = await paginate(mongoQuery, req.query);

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

// POST /api/milestones/:id/fee-details — Scholar saves fee payment metadata and files receipt
const updateFeeDetails = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    const thesis = await Thesis.findById(milestone.thesisId);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });
    
    // Authorization check: only own scholar can update
    if (thesis.scholarId.toString() !== req.user._id.toString() && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const { periodFrom, periodTo, totalFeeDeposited, remarks } = req.body;
    if (!remarks) {
      return res.status(400).json({ message: 'Remarks are mandatory.' });
    }

    let feeReceiptUrl = milestone.feeDetails?.feeReceiptUrl || null;
    if (req.file) {
      feeReceiptUrl = `/uploads/${req.file.filename}`;
    }

    if (!feeReceiptUrl) {
      return res.status(400).json({ message: 'Fee receipt upload is mandatory.' });
    }

    // Parse dates and calculate months/days duration
    const fromDate = new Date(periodFrom);
    const toDate = new Date(periodTo);
    let durationMonths = 0;
    let durationDays = 0;

    if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
      const diffTime = Math.abs(toDate - fromDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      durationMonths = Math.floor(diffDays / 30);
      durationDays = diffDays % 30;
    }

    milestone.feeDetails = {
      periodFrom: isNaN(fromDate.getTime()) ? null : fromDate,
      periodTo: isNaN(toDate.getTime()) ? null : toDate,
      durationMonths,
      durationDays,
      totalFeeDeposited: totalFeeDeposited || '',
      remarks,
      feeReceiptUrl
    };

    if (milestone.type === '6_MONTH_REPORT' && !milestone.documentUrl) {
      milestone.status = 'DRAFT';
    }

    milestone.markModified('feeDetails');
    await milestone.save();

    res.json(milestone);
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
  generateMilestonesIfNeeded,
  updateFeeDetails
};
