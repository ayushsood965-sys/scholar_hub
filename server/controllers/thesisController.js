const Thesis = require('../models/Thesis');
const Milestone = require('../models/Milestone');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const augmentThesesWithMilestones = async (theses) => {
  const Publication = require('../models/Publication');
  if (!theses || theses.length === 0) return [];

  const thesisIds = theses.map(t => t._id);

  // Fetch all milestones and publications in parallel
  const [allMilestones, allPublications] = await Promise.all([
    Milestone.find({ 
      thesisId: { $in: thesisIds }, 
      type: { $in: ['SYNOPSIS', 'FINAL_SUBMISSION', 'PRE_SUBMISSION'] } 
    }),
    Publication.find({ thesisId: { $in: thesisIds } })
  ]);

  // Group milestones by thesisId in memory
  const milestonesMap = {};
  allMilestones.forEach(m => {
    const tId = m.thesisId.toString();
    if (!milestonesMap[tId]) milestonesMap[tId] = {};
    milestonesMap[tId][m.type] = m.status;
  });

  // Group publications by thesisId in memory
  const publicationsMap = {};
  allPublications.forEach(p => {
    const tId = p.thesisId ? p.thesisId.toString() : '';
    if (tId) {
      if (!publicationsMap[tId]) publicationsMap[tId] = [];
      publicationsMap[tId].push(p);
    }
  });

  return theses.map(thesis => {
    const thesisObj = thesis.toObject();
    const tId = thesis._id.toString();

    const mTypes = milestonesMap[tId] || {};
    thesisObj.synopsisStatus = mTypes['SYNOPSIS'] || null;
    thesisObj.finalSubStatus = mTypes['FINAL_SUBMISSION'] || null;
    thesisObj.preSubMilestoneStatus = mTypes['PRE_SUBMISSION'] || null;

    thesisObj.publications = publicationsMap[tId] || [];
    return thesisObj;
  });
};

// ── SCHOLAR ──────────────────────────────────────────────
// POST /api/thesis — Create thesis registration
const createThesis = async (req, res) => {
  try {
    const existing = await Thesis.findOne({ scholarId: req.user._id });
    if (existing) return res.status(400).json({ message: 'Profile registration already submitted or approved' });

    // Fetch full User profile
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Ensure the student has completed their profile details first!
    if (!user.profile?.enrollmentNumber || !user.department || !user.profile?.thesisTitle || !user.profile?.thesisSummary || !user.profile?.thesisKeywords) {
      return res.status(400).json({ 
        message: 'Please complete all required fields (General Info, Qualifications, and Preferred Guide) in your Profile tab first and click Save Profile before submitting for approval.' 
      });
    }

    user.profileCompleted = true;
    await user.save();

    const thesis = await Thesis.create({
      scholarId: req.user._id,
      department: user.department,
      title: user.profile.thesisTitle || user.profile.areaOfInterest || "Ph.D. Research Candidate",
      enrollmentNumber: user.profile.enrollmentNumber,
      abstract: user.profile.thesisSummary || `Specialization: ${user.profile.specialization || "N/A"}. Mode: ${user.profile.phdMode || "N/A"}. Candidate has completed and submitted their academic profile details for HOD registration review.`,
      keywords: user.profile.thesisKeywords || '',
      status: 'REGISTRATION_PENDING',
    });

    await createNotification({
      roleScope: 'HOD',
      department: thesis.department,
      title: '⏳ New Scholar Profile Verification',
      message: `Scholar ${user.name} has submitted their academic registration details and profile for HOD registration approval.`,
      type: 'PENDING_ACTION',
      link: 'registration'
    });

    res.status(201).json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/thesis/me — Scholar fetches their thesis + milestones
const getMyThesis = async (req, res) => {
  try {
    const thesis = await Thesis.findOne({ scholarId: req.user._id })
      .populate('supervisorId', 'name username department subRole');
    if (!thesis) return res.status(404).json({ message: 'No thesis found' });

    const milestones = await Milestone.find({ thesisId: thesis._id })
      .populate('forwardedTo', 'name email role subRole')
      .sort('sequence createdAt');

    const DRCMeeting = require('../models/DRCMeeting');
    const drcMeeting = await DRCMeeting.findOne({
      scholarId: req.user._id,
      isSynopsisApproval: true,
      status: 'APPROVED'
    });

    const thesisObj = thesis.toObject();
    thesisObj.synopsisApprovedDate = drcMeeting ? drcMeeting.scheduledDate : null;

    res.json({ thesis: thesisObj, milestones });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── ADMIN ──────────────────────────────────────────────
const getAllTheses = async (req, res) => {
  try {
    const { status, department } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;

    // HODs can only view theses in their own department
    if (req.user.role === 'HOD') {
      filter.department = req.user.department;
    }

    let mongoQuery = Thesis.find(filter)
      .populate('scholarId', 'name username email profile profileCompleted department')
      .populate('supervisorId', 'name username')
      .sort('-createdAt');

    const limit = parseInt(req.query.limit) || 0;
    const skip = parseInt(req.query.skip) || 0;
    if (skip) mongoQuery = mongoQuery.skip(skip);
    if (limit) mongoQuery = mongoQuery.limit(limit);

    const theses = await mongoQuery;
    const augmented = await augmentThesesWithMilestones(theses);
    res.json(augmented);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/thesis/:id — Single thesis detail
const getThesisById = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id)
      .populate('scholarId', 'name username email profile profileCompleted department')
      .populate('supervisorId', 'name username subRole department');
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD department check bypassed for read-only global search viewing
    // if (req.user.role === 'HOD' && thesis.department !== req.user.department) {
    //   return res.status(403).json({ message: 'Not authorized to view theses outside your department' });
    // }

    let milestones = await Milestone.find({ thesisId: thesis._id })
      .populate('forwardedTo', 'name email role subRole')
      .sort('sequence createdAt');

    const scholarIdStr = thesis.scholarId?._id ? thesis.scholarId._id.toString() : thesis.scholarId?.toString();
    const isScholar = scholarIdStr === req.user._id.toString();
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

    res.json({ thesis, milestones });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/verify — Admin verifies enrollment → COURSEWORK
const verifyEnrollment = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD department check
    if (req.user.role === 'HOD' && thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    // Auto verify student's user account
    const studentUser = await User.findById(thesis.scholarId);
    if (studentUser) {
      studentUser.isVerified = true;
      await studentUser.save();
    }

    thesis.enrollmentVerified = true;
    thesis.status = 'COURSEWORK';
    thesis.courseworkStatus = 'NOT_SUBMITTED';
    thesis.courseworkCompleted = false;
    thesis.courseworkDetails = {
      researchEthics: [],
      researchMethodology: [],
      elective: [],
      others: []
    };
    thesis.courseworkUploadProof = null;
    thesis.courseworkApprovals = {
      facultyApproved: false,
      facultyApproverId: null,
      facultyApprovedAt: null,
      hodApproved: false,
      hodApproverId: null,
      hodApprovedAt: null
    };
    thesis.auditLog.push({ action: 'ENROLLMENT_VERIFIED', note: `Verified by HOD on ${new Date().toDateString()}` });
    await thesis.save();

    await createNotification({
      recipient: thesis.scholarId,
      title: '🎉 Enrollment Verified!',
      message: `Your Ph.D. enrollment has been successfully verified by HOD! You are now in the COURSEWORK phase.`,
      type: 'SUCCESSFUL_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/assign — Admin assigns supervisor
const assignSupervisor = async (req, res) => {
  try {
    const { supervisorId } = req.body;
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD department check
    if (req.user.role === 'HOD' && thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    const supervisor = await User.findById(supervisorId);
    if (!supervisor || supervisor.role !== 'FACULTY') {
      return res.status(400).json({ message: 'Invalid supervisor' });
    }

    thesis.supervisorId = supervisorId;
    thesis.auditLog.push({ action: 'SUPERVISOR_ASSIGNED', note: `Assigned ${supervisor.name}` });
    await thesis.save();

    await createNotification({
      recipient: thesis.scholarId,
      title: '👨‍🏫 Supervisor Allocated',
      message: `Faculty member "${supervisor.name}" has been officially assigned as your Ph.D. Research Supervisor.`,
      type: 'SUCCESSFUL_ACTION',
      link: 'overview'
    });

    await createNotification({
      recipient: supervisor._id,
      title: '📚 Assigned as Ph.D. Supervisor',
      message: `You have been officially assigned as the Ph.D. supervisor for scholar "${thesis.scholarId?.name || 'Scholar'}" (Topic: "${thesis.title}").`,
      type: 'SUCCESSFUL_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/coursework — Admin/Faculty clears coursework → SYNOPSIS_PENDING
const clearCoursework = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // If faculty, verify they are the assigned supervisor or the HOD of the same department
    if (req.user.role === 'FACULTY') {
      const isSupervisor = thesis.supervisorId && thesis.supervisorId.toString() === req.user._id.toString();
      const isHodInDept = (req.user.subRole === 'HOD' || req.user.role === 'HOD') && thesis.department === req.user.department;
      if (!isSupervisor && !isHodInDept) {
        return res.status(403).json({ message: 'Not authorized to clear coursework for this scholar' });
      }
    } else if (req.user.role === 'HOD' && thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    thesis.courseworkCompleted = true;
    thesis.status = 'SYNOPSIS_PENDING';
    thesis.auditLog.push({
      action: 'COURSEWORK_CLEARED',
      note: `Coursework marked complete by ${req.user.role === 'HOD' ? 'HOD' : req.user.role === 'ADMIN' ? 'admin' : `${req.user.subRole || 'SUPERVISOR'} ${req.user.name}`}`
    });
    await thesis.save();

    // Auto-create synopsis milestone
    const existingSynopsis = await Milestone.findOne({ thesisId: thesis._id, type: 'SYNOPSIS' });
    if (!existingSynopsis) {
      await Milestone.create({
        thesisId: thesis._id,
        type: 'SYNOPSIS',
        title: 'Research Synopsis',
        status: 'PENDING',
        sequence: 1,
      });
    }

    await createNotification({
      recipient: thesis.scholarId,
      title: '📚 Coursework Requirements Cleared!',
      message: `Your doctoral coursework exams and requirements have been officially marked as cleared. You are now in the SYNOPSIS phase.`,
      type: 'SUCCESSFUL_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/award — Admin awards degree
const awardDegree = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD department check
    if (req.user.role === 'HOD' && thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    // Run verification checks
    const User = require('../models/User');
    const Milestone = require('../models/Milestone');
    const Publication = require('../models/Publication');
    const DRCMeeting = require('../models/DRCMeeting');

    const scholar = await User.findById(thesis.scholarId);

    const hasMphil = scholar?.profile?.qualifications?.mphil?.done === true && scholar?.isVerified === true;
    const requiredReportsCount = hasMphil ? 3 : 6;
    const reports = await Milestone.find({ thesisId: thesis._id, type: '6_MONTH_REPORT' });
    const approvedReportsCount = reports.filter(r => r.status === 'VERIFIED').length;
    const verifiedJournals = await Publication.countDocuments({ thesisId: thesis._id, type: 'JOURNAL', status: 'VERIFIED' });
    const verifiedConferences = await Publication.countDocuments({ thesisId: thesis._id, type: 'CONFERENCE', status: 'VERIFIED' });
    const synopsisMilestone = await Milestone.findOne({ thesisId: thesis._id, type: 'SYNOPSIS' });
    const finalMilestone = await Milestone.findOne({ thesisId: thesis._id, type: 'FINAL_SUBMISSION' });
    const drcApproved = await DRCMeeting.findOne({ thesisId: thesis._id, status: 'APPROVED' });

    const checks = {
      courseworkCleared: thesis.courseworkCompleted === true,
      enrollmentVerified: thesis.enrollmentVerified === true,
      synopsisApproved: synopsisMilestone?.status === 'APPROVED',
      drcCleared: !!drcApproved,
      reportsCleared: approvedReportsCount >= requiredReportsCount,
      publicationsCleared: verifiedJournals >= 2 && verifiedConferences >= 2,
      preSubmissionCleared: thesis.preSubmissionSeminar?.status === 'CLEARED',
      finalThesisApproved: finalMilestone?.status === 'APPROVED',
      externalEvaluationCleared: thesis.externalEvaluationStatus === 'SUCCESSFUL',
      vivaCleared: thesis.vivaStatus === 'SUCCESSFUL'
    };

    const failed = [];
    if (!checks.courseworkCleared) failed.push('Coursework must be cleared');
    if (!checks.enrollmentVerified) failed.push('Scholar enrollment must be verified');
    if (!checks.synopsisApproved) failed.push('Synopsis must be approved');
    if (!checks.drcCleared) failed.push('DRC evaluation must be approved');
    if (!checks.reportsCleared) failed.push(`At least ${requiredReportsCount} progress reports must be approved`);
    if (!checks.publicationsCleared) failed.push('At least 2 journals and 2 conferences must be verified');
    if (!checks.preSubmissionCleared) failed.push('Pre-submission seminar must be cleared');
    if (!checks.finalThesisApproved) failed.push('Final bound thesis must be approved by HOD');
    if (!checks.externalEvaluationCleared) failed.push('External evaluation reports must be successful');
    if (!checks.vivaCleared) failed.push('Viva-Voce oral defense must be successful');

    if (failed.length > 0) {
      return res.status(400).json({ 
        message: 'Candidate is not eligible for degree award. Failed checks: ' + failed.join(', ') 
      });
    }

    thesis.status = 'AWARDED';
    thesis.awardedAt = new Date();
    thesis.auditLog.push({ 
      action: 'DEGREE_AWARDED', 
      note: req.body.note || 'Degree awarded after successfully clearing all Ph.D. lifecycle evaluation criteria.' 
    });
    await thesis.save();

    // Mark final bound thesis milestone as APPROVED if not already
    if (finalMilestone && finalMilestone.status !== 'APPROVED') {
      finalMilestone.status = 'APPROVED';
      await finalMilestone.save();
    }

    await createNotification({
      recipient: thesis.scholarId,
      title: '🎓 Ph.D. Degree Awarded!',
      message: `Congratulations, Doctor! Your Ph.D. degree has been officially awarded by the Academic Council after successfully clearing all evaluation stages.`,
      type: 'SUCCESSFUL_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/thesis/:id/eligibility — Returns detailed eligibility status and verification checklist
const getEligibilityDetails = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD and Faculty authorization checks
    const isHod = req.user.role === 'HOD' || req.user.subRole === 'HOD';
    if (isHod) {
      if (thesis.department !== req.user.department) {
        return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
      }
    } else if (req.user.role === 'FACULTY') {
      const isSupervisor = thesis.supervisorId && thesis.supervisorId.toString() === req.user._id.toString();
      const isSameDept = thesis.department === req.user.department;
      if (!isSupervisor && !isSameDept) {
        return res.status(403).json({ message: "Not authorized to view this scholar's eligibility." });
      }
    }

    const User = require('../models/User');
    const Milestone = require('../models/Milestone');
    const Publication = require('../models/Publication');
    const DRCMeeting = require('../models/DRCMeeting');

    const scholar = await User.findById(thesis.scholarId);
    
    // 1. Coursework check
    const courseworkCleared = thesis.courseworkCompleted === true;

    // 2. Enrollment verified check
    const enrollmentVerified = thesis.enrollmentVerified === true;

    // 3. Synopsis approved check
    const synopsisMilestone = await Milestone.findOne({ thesisId: thesis._id, type: 'SYNOPSIS' });
    const synopsisApproved = synopsisMilestone?.status === 'APPROVED';

    // 4. DRC approved check
    const drcApproved = await DRCMeeting.findOne({ thesisId: thesis._id, status: 'APPROVED' });
    const drcCleared = !!drcApproved;

    // 5. 6-Month progress reports check
    const hasMphil = scholar?.profile?.qualifications?.mphil?.done === true && scholar?.isVerified === true;
    const requiredReportsCount = hasMphil ? 3 : 6;
    const reports = await Milestone.find({ thesisId: thesis._id, type: '6_MONTH_REPORT' });
    const approvedReportsCount = reports.filter(r => r.status === 'VERIFIED').length;
    const reportsCleared = approvedReportsCount >= requiredReportsCount;

    // Active research period check
    const admissionDate = scholar?.profile?.admissionDate ? new Date(scholar.profile.admissionDate) : null;
    const referenceDate = admissionDate && !isNaN(admissionDate.getTime()) ? admissionDate : (thesis.startDate ? new Date(thesis.startDate) : null);
    
    let activeMonths = 0;
    if (referenceDate) {
      const diffMs = new Date() - referenceDate;
      activeMonths = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375)));
    }
    const requiredMonths = hasMphil ? 18 : 36;
    const durationCleared = activeMonths >= requiredMonths;

    // 6. Publications check
    const verifiedJournals = await Publication.countDocuments({ thesisId: thesis._id, type: 'JOURNAL', status: 'VERIFIED' });
    const verifiedConferences = await Publication.countDocuments({ thesisId: thesis._id, type: 'CONFERENCE', status: 'VERIFIED' });
    const publicationsCleared = verifiedJournals >= 2 && verifiedConferences >= 2;

    // 7. Pre-submission seminar cleared
    const preSubmissionCleared = thesis.preSubmissionSeminar?.status === 'CLEARED';

    // 8. Final bound thesis approved
    const finalMilestone = await Milestone.findOne({ thesisId: thesis._id, type: 'FINAL_SUBMISSION' });
    const finalThesisApproved = finalMilestone?.status === 'APPROVED';

    // 9. External evaluation marked successful
    const externalEvaluationCleared = thesis.externalEvaluationStatus === 'SUCCESSFUL';

    // 10. Viva-Voce successful
    const vivaCleared = thesis.vivaStatus === 'SUCCESSFUL';

    const checklist = [
      { name: 'Doctoral Coursework Cleared', status: courseworkCleared, details: courseworkCleared ? 'Verified' : 'Coursework must be cleared by department' },
      { name: 'Scholar Enrollment Verified', status: enrollmentVerified, details: enrollmentVerified ? 'Verified' : 'Enrollment registration must be verified by HOD' },
      { name: 'Research Synopsis Approved', status: synopsisApproved, details: synopsisApproved ? 'Approved' : 'Synopsis document review must be approved' },
      { name: 'DRC Evaluation Cleared', status: drcCleared, details: drcCleared ? 'Approved' : 'Department Research Committee must approve synopsis' },
      { name: `Active Research Duration (Min ${requiredMonths} Months)`, status: durationCleared, details: `${activeMonths} months completed (Required: ${requiredMonths} months for ${hasMphil ? 'M.Phil holder' : 'regular Ph.D.'})` },
      { name: `6-Month Progress Reports Approved (Min ${requiredReportsCount})`, status: reportsCleared, details: `${approvedReportsCount} / ${requiredReportsCount} reports cleared` },
      { name: 'Mandatory Research Publications Verified', status: publicationsCleared, details: `Journals: ${verifiedJournals}/2, Conferences: ${verifiedConferences}/2` },
      { name: 'Pre-Submission Colloquium Cleared', status: preSubmissionCleared, details: preSubmissionCleared ? 'Cleared' : 'Open colloquium presentation must be cleared' },
      { name: 'Final Bound Thesis Signed Off', status: finalThesisApproved, details: finalThesisApproved ? 'Approved by Supervisor & HOD' : 'Final submission must clear HOD approval' },
      { name: 'External Evaluation Successful', status: externalEvaluationCleared, details: externalEvaluationCleared ? 'Positive evaluation reports logged' : 'External evaluation reports pending' },
      { name: 'Viva-Voce Oral Defense Cleared', status: vivaCleared, details: vivaCleared ? 'Conducted and PASSED' : 'Viva-Voce outcome must be recorded as successful' }
    ];

    const eligible = checklist.every(item => item.status === true);

    res.json({
      eligible,
      checklist,
      thesisStatus: thesis.status,
      vivaStatus: thesis.vivaStatus,
      externalEvaluationStatus: thesis.externalEvaluationStatus
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/audit — Admin updates audit log
const updateAuditLog = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD department check
    if (req.user.role === 'HOD' && thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    thesis.auditLog.push({ action: req.body.action, note: req.body.note });
    await thesis.save();
    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── FACULTY ──────────────────────────────────────────────
// GET /api/thesis/assigned — Faculty fetches their assigned theses
const getAssignedTheses = async (req, res) => {
  try {
    let mongoQuery = Thesis.find({ supervisorId: req.user._id })
      .populate('scholarId', 'name username email profile profileCompleted department')
      .sort('-updatedAt');

    const limit = parseInt(req.query.limit) || 0;
    const skip = parseInt(req.query.skip) || 0;
    if (skip) mongoQuery = mongoQuery.skip(skip);
    if (limit) mongoQuery = mongoQuery.limit(limit);

    const theses = await mongoQuery;
    const augmented = await augmentThesesWithMilestones(theses);
    res.json(augmented);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/thesis/dept — HOD fetches all theses in their department
const getDeptTheses = async (req, res) => {
  try {
    let mongoQuery = Thesis.find({ department: req.user.department })
      .populate('scholarId', 'name username email profile profileCompleted department')
      .populate('supervisorId', 'name username')
      .sort('-updatedAt');

    const limit = parseInt(req.query.limit) || 0;
    const skip = parseInt(req.query.skip) || 0;
    if (skip) mongoQuery = mongoQuery.skip(skip);
    if (limit) mongoQuery = mongoQuery.limit(limit);

    const theses = await mongoQuery;
    const augmented = await augmentThesesWithMilestones(theses);
    res.json(augmented);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/drc — HOD DRC approval → ACTIVE_RESEARCH
const drcApprove = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD department check
    if (req.user.role === 'HOD' && thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    thesis.status = 'ACTIVE_RESEARCH';
    thesis.startDate = new Date();
    thesis.auditLog.push({ action: 'DRC_APPROVED', note: `DRC approved by HOD ${req.user.name}` });
    await thesis.save();

    await createNotification({
      recipient: thesis.scholarId,
      title: '✅ DRC Synopsis Approved!',
      message: `Congratulations! The Departmental Research Committee (DRC) has approved your research synopsis. You are now in the ACTIVE_RESEARCH phase.`,
      type: 'SUCCESSFUL_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/schedule-seminar — HOD schedules pre-submission seminar
const scheduleSeminar = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD department check
    if (req.user.role === 'HOD' && thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    const { scheduledDate, scheduledTime, venue, committeeMembers } = req.body;
    if (!scheduledDate || !scheduledTime || !venue) {
      return res.status(400).json({ message: 'Please fill in Scheduled Date, Time, and Venue.' });
    }

    const Milestone = require('../models/Milestone');
    let milestone = await Milestone.findOne({ thesisId: thesis._id, type: 'PRE_SUBMISSION' });
    if (!milestone) {
      return res.status(400).json({ message: 'Pre-submission milestone not found. Candidate must upload the pre-submission package first.' });
    }

    milestone.dueDate = new Date(scheduledDate);
    // Overwrite any previous schedule comments to keep it clean
    milestone.comments = milestone.comments.filter(c => !c.text.startsWith('Pre-Submission Seminar scheduled'));
    milestone.comments.push({
      authorId: req.user._id,
      authorName: req.user.name,
      text: `Pre-Submission Seminar scheduled for ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime} in ${venue}. Panel: ${committeeMembers || 'Department Board'}.`
    });
    await milestone.save();

    thesis.auditLog.push({ 
      action: 'SEMINAR_SCHEDULED', 
      note: `Pre-submission seminar scheduled by HOD ${req.user.name} on ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime} in ${venue}.` 
    });
    await thesis.save();

    await createNotification({
      recipient: thesis.scholarId,
      title: '📆 Pre-Submission Seminar Scheduled!',
      message: `Your pre-submission seminar presentation has been scheduled for ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime} in ${venue}. Please prepare your slides and defense.`,
      type: 'PENDING_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/seminar — HOD seminar clearance → PRE_SUBMISSION
const seminarClear = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD department check
    if (req.user.role === 'HOD' && thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    // Publication requirement checks: at least 2 verified journals and 2 verified conferences
    const Publication = require('../models/Publication');
    const verifiedJournals = await Publication.countDocuments({
      thesisId: thesis._id,
      type: 'JOURNAL',
      status: 'VERIFIED'
    });
    const verifiedConferences = await Publication.countDocuments({
      thesisId: thesis._id,
      type: 'CONFERENCE',
      status: 'VERIFIED'
    });

    if (verifiedJournals < 2 || verifiedConferences < 2) {
      return res.status(400).json({
        message: `Cannot clear pre-submission seminar. The scholar must have at least 2 verified Journal publications (Current: ${verifiedJournals}/2) and 2 verified Conference presentations (Current: ${verifiedConferences}/2).`
      });
    }

    thesis.status = 'PRE_SUBMISSION';
    const notes = req.body.remarks || `Pre-submission seminar cleared by HOD ${req.user.name}`;
    thesis.auditLog.push({ action: 'SEMINAR_CLEARED', note: notes });
    await thesis.save();

    // Mark pre-submission milestone as APPROVED
    const Milestone = require('../models/Milestone');
    let milestone = await Milestone.findOne({ thesisId: thesis._id, type: 'PRE_SUBMISSION' });
    if (milestone) {
      milestone.status = 'APPROVED';
      milestone.reviewedAt = new Date();
      if (req.body.remarks) {
        milestone.comments.push({
          authorId: req.user._id,
          authorName: req.user.name,
          text: req.body.remarks
        });
      }
      await milestone.save();
    } else {
      await Milestone.create({
        thesisId: thesis._id,
        type: 'PRE_SUBMISSION',
        title: 'Pre-Submission Thesis & Plagiarism Clearance Package',
        status: 'APPROVED',
        sequence: 99,
        reviewedAt: new Date(),
        comments: req.body.remarks ? [{
          authorId: req.user._id,
          authorName: req.user.name,
          text: req.body.remarks
        }] : []
      });
    }

    // Auto-create final submission milestone (sequence 100) if it doesn't exist
    const finalExists = await Milestone.findOne({ thesisId: thesis._id, type: 'FINAL_SUBMISSION' });
    if (!finalExists) {
      await Milestone.create({
        thesisId: thesis._id,
        type: 'FINAL_SUBMISSION',
        title: 'Final Complete Thesis Submission Package',
        status: 'PENDING',
        sequence: 100,
      });
    }

    await createNotification({
      recipient: thesis.scholarId,
      title: '🎯 Pre-Submission Seminar Cleared!',
      message: `Your pre-submission seminar and defense colloquium have been officially marked as cleared. Please prepare and upload your final thesis package.`,
      type: 'SUCCESSFUL_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/final-approve — Supervisor final digital approval → PENDING_HOD
const finalApprove = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    thesis.status = 'PENDING_HOD';
    thesis.auditLog.push({ action: 'SUPERVISOR_APPROVED', note: `Final digital sign-off by supervisor ${req.user.name}` });
    await thesis.save();

    // Mark final submission milestone as PENDING_HOD
    const Milestone = require('../models/Milestone');
    let milestone = await Milestone.findOne({ thesisId: thesis._id, type: 'FINAL_SUBMISSION' });
    if (milestone) {
      milestone.status = 'PENDING_HOD';
      milestone.reviewedAt = new Date();
      milestone.comments.push({
        authorId: req.user._id,
        authorName: req.user.name,
        text: `Approved and signed off by supervisor ${req.user.name}. Sent to HOD for final sign-off.`
      });
      await milestone.save();
    }

    // Notify Student
    await createNotification({
      recipient: thesis.scholarId,
      title: '🚀 Supervisor Signed Off Final Thesis',
      message: `Your supervisor ${req.user.name} has signed off on your final thesis. It has been routed to the HOD for final digital approval.`,
      type: 'SUCCESSFUL_ACTION',
      link: 'overview'
    });

    // Notify HOD
    await createNotification({
      roleScope: 'HOD',
      department: thesis.department,
      title: '⏳ Final Thesis HOD Approval Pending',
      message: `Final bound thesis of scholar "${thesis.title}" has been signed off by supervisor ${req.user.name} and is pending your final HOD approval.`,
      type: 'PENDING_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/final-reject — Supervisor rejects final submission back to student
const finalReject = async (req, res) => {
  try {
    const { comment } = req.body;
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    thesis.status = 'PRE_SUBMISSION';
    thesis.auditLog.push({ 
      action: 'SUPERVISOR_REJECTED', 
      note: `Final thesis submission returned to scholar by supervisor ${req.user.name}. Remarks: ${comment || 'None'}` 
    });
    await thesis.save();

    const Milestone = require('../models/Milestone');
    let milestone = await Milestone.findOne({ thesisId: thesis._id, type: 'FINAL_SUBMISSION' });
    if (milestone) {
      milestone.status = 'REVISION_REQUIRED';
      milestone.reviewedAt = new Date();
      milestone.comments.push({
        authorId: req.user._id,
        authorName: req.user.name,
        text: comment || 'Supervisor requested corrections.'
      });
      await milestone.save();
    }

    // Notify Student
    await createNotification({
      recipient: thesis.scholarId,
      title: '⚠️ Final Thesis Corrections Requested',
      message: `Your supervisor ${req.user.name} has requested corrections for your final thesis submission. Remarks: "${comment || 'Please check comments.'}"`,
      type: 'PENDING_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/final-approve-hod — HOD final approval → SUBMITTED
const finalApproveHOD = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD department check
    if (req.user.role === 'HOD' && thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    thesis.status = 'SUBMITTED';
    thesis.submittedAt = new Date();
    thesis.auditLog.push({ action: 'HOD_APPROVED', note: `Final digital sign-off by HOD ${req.user.name}` });
    await thesis.save();

    // Mark final submission milestone as APPROVED
    const Milestone = require('../models/Milestone');
    let milestone = await Milestone.findOne({ thesisId: thesis._id, type: 'FINAL_SUBMISSION' });
    if (milestone) {
      milestone.status = 'APPROVED';
      milestone.reviewedAt = new Date();
      milestone.comments.push({
        authorId: req.user._id,
        authorName: req.user.name,
        text: `Approved and signed off by HOD ${req.user.name}. Ready for examiner dispatch.`
      });
      await milestone.save();
    }

    // Notify Student
    await createNotification({
      recipient: thesis.scholarId,
      title: '🎉 Final Thesis Approved by HOD!',
      message: `Your final thesis document has been officially approved by the HOD. It has been marked as SUBMITTED and is ready for offline examiner dispatch.`,
      type: 'SUCCESSFUL_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/final-reject-hod — HOD rejects final submission back to student
const finalRejectHOD = async (req, res) => {
  try {
    const { comment } = req.body;
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD department check
    if (req.user.role === 'HOD' && thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    thesis.status = 'PRE_SUBMISSION';
    thesis.auditLog.push({ 
      action: 'HOD_REJECTED', 
      note: `Final thesis submission returned to scholar by HOD ${req.user.name}. Remarks: ${comment || 'None'}` 
    });
    await thesis.save();

    const Milestone = require('../models/Milestone');
    let milestone = await Milestone.findOne({ thesisId: thesis._id, type: 'FINAL_SUBMISSION' });
    if (milestone) {
      milestone.status = 'REVISION_REQUIRED';
      milestone.reviewedAt = new Date();
      milestone.comments.push({
        authorId: req.user._id,
        authorName: req.user.name,
        text: comment || 'HOD requested corrections.'
      });
      await milestone.save();
    }

    // Notify Student
    await createNotification({
      recipient: thesis.scholarId,
      title: '⚠️ Final Thesis HOD Corrections Requested',
      message: `HOD ${req.user.name} has requested corrections for your final thesis. Remarks: "${comment || 'Please check comments.'}"`,
      type: 'PENDING_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/dispatch — HOD/Admin logs dispatch to external examiners
const dispatchThesis = async (req, res) => {
  try {
    const { dispatchDate, dispatchMethod, dispatchTrackingNumber } = req.body;
    if (!dispatchDate || !dispatchMethod) {
      return res.status(400).json({ message: 'Dispatch date and method are required' });
    }

    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD department check
    if (req.user.role === 'HOD' && thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    thesis.dispatchDate = new Date(dispatchDate);
    thesis.dispatchMethod = dispatchMethod;
    thesis.dispatchTrackingNumber = dispatchTrackingNumber || '';
    
    thesis.auditLog.push({ 
      action: 'THESIS_DISPATCHED', 
      note: `Thesis dispatched to external examiners via ${dispatchMethod} (Ref: ${dispatchTrackingNumber || 'N/A'})` 
    });
    
    await thesis.save();

    await createNotification({
      recipient: thesis.scholarId,
      title: '📬 Thesis Dispatched for Evaluation',
      message: `Your final Ph.D. thesis has been officially dispatched to external examiners via ${dispatchMethod}.`,
      type: 'SUCCESSFUL_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/external-evaluation — HOD logs outcome of external evaluation
const logExternalEvaluation = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!status || !['SUCCESSFUL', 'FAILED'].includes(status)) {
      return res.status(400).json({ message: 'Valid external evaluation status is required (SUCCESSFUL/FAILED)' });
    }

    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD department check
    if (req.user.role === 'HOD' && thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    thesis.externalEvaluationStatus = status;
    thesis.externalEvaluationRemarks = remarks || '';
    thesis.externalEvaluationLoggedAt = new Date();
    thesis.externalEvaluationLoggedBy = req.user._id;

    if (status === 'SUCCESSFUL') {
      thesis.auditLog.push({ 
        action: 'EXTERNAL_EVALUATION_SUCCESS', 
        note: `External examiner evaluation cleared successfully. Remarks: ${remarks || 'None'}` 
      });
      await thesis.save();

      // Notify Student
      await createNotification({
        recipient: thesis.scholarId,
        title: '🎉 External Evaluation Successful!',
        message: `Your external thesis evaluation report is positive and has been marked as SUCCESSFUL. Viva-Voce defense will be scheduled shortly.`,
        type: 'SUCCESSFUL_ACTION',
        link: 'overview'
      });
    } else {
      // Rejection: gets back to the student
      thesis.status = 'PRE_SUBMISSION';
      thesis.auditLog.push({ 
        action: 'EXTERNAL_EVALUATION_FAILED', 
        note: `External examiner evaluation FAILED. Returned to scholar. Remarks: ${remarks || 'None'}` 
      });
      await thesis.save();

      // Reset final submission milestone so student can re-upload
      const Milestone = require('../models/Milestone');
      let milestone = await Milestone.findOne({ thesisId: thesis._id, type: 'FINAL_SUBMISSION' });
      if (milestone) {
        milestone.status = 'REVISION_REQUIRED';
        milestone.comments.push({
          authorId: req.user._id,
          authorName: req.user.name,
          text: `External evaluation failed: ${remarks || 'Needs corrections.'}`
        });
        await milestone.save();
      }

      // Notify Student
      await createNotification({
        recipient: thesis.scholarId,
        title: '⚠️ Final Thesis External Evaluation Failed',
        message: `Your external evaluation reports were negative. Your final thesis submission has been returned to you for modifications. Remarks: "${remarks || 'None'}"`,
        type: 'PENDING_ACTION',
        link: 'overview'
      });
    }

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/schedule-viva — HOD/Admin schedules offline Viva-Voce defense
const scheduleViva = async (req, res) => {
  try {
    const { vivaDate, vivaTime, vivaVenue, vivaPanel } = req.body;
    if (!vivaDate || !vivaTime || !vivaVenue) {
      return res.status(400).json({ message: 'Viva date, time, and venue are required' });
    }

    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    if (thesis.externalEvaluationStatus !== 'SUCCESSFUL') {
      return res.status(400).json({ message: 'Viva-Voce defense can only be scheduled after a successful external evaluation.' });
    }

    // HOD department check
    if (req.user.role === 'HOD' && thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    thesis.vivaDate = new Date(vivaDate);
    thesis.vivaTime = vivaTime;
    thesis.vivaVenue = vivaVenue;
    thesis.vivaPanel = vivaPanel || '';
    thesis.vivaStatus = 'SCHEDULED';

    thesis.auditLog.push({ 
      action: 'VIVA_SCHEDULED', 
      note: `Viva-Voce scheduled for ${new Date(vivaDate).toLocaleDateString()} at ${vivaTime} in ${vivaVenue}` 
    });

    await thesis.save();

    await createNotification({
      recipient: thesis.scholarId,
      title: '📅 Viva-Voce Defense Scheduled!',
      message: `Your final Viva-Voce defense has been scheduled for ${new Date(vivaDate).toLocaleDateString()} at ${vivaTime} in ${vivaVenue}.`,
      type: 'SUCCESSFUL_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/record-viva — HOD/Admin records Viva-Voce outcome
const recordViva = async (req, res) => {
  try {
    const { vivaStatus, remarks } = req.body;
    if (!vivaStatus || !['SUCCESSFUL', 'UNSUCCESSFUL'].includes(vivaStatus)) {
      return res.status(400).json({ message: 'Valid Viva-Voce status is required (SUCCESSFUL/UNSUCCESSFUL)' });
    }

    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD department check
    if (req.user.role === 'HOD' && thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    thesis.vivaStatus = vivaStatus;
    thesis.vivaRemarks = remarks || '';

    thesis.auditLog.push({ 
      action: 'VIVA_OUTCOME_LOGGED', 
      note: `Viva-Voce defense recorded as ${vivaStatus}. Remarks: ${remarks || 'None'}` 
    });

    await thesis.save();

    await createNotification({
      recipient: thesis.scholarId,
      title: vivaStatus === 'SUCCESSFUL' ? '🎉 Viva-Voce Defense Successful!' : '⚠️ Viva-Voce Defense Revisions Required',
      message: vivaStatus === 'SUCCESSFUL'
        ? `Congratulations! Your Viva-Voce panel has cleared your defense successfully. Your degree will be awarded shortly.`
        : `Your Viva-Voce panel has requested corrections: "${remarks || 'See HOD details'}"`,
      type: vivaStatus === 'SUCCESSFUL' ? 'SUCCESSFUL_ACTION' : 'PENDING_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// PUT /api/thesis/:id/transfer — Transfer Scholar
const transferThesis = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // Validate that thesis is not SUBMITTED or AWARDED
    if (['SUBMITTED', 'AWARDED'].includes(thesis.status)) {
      return res.status(400).json({ message: 'Cannot transfer a scholar whose thesis is already submitted or awarded.' });
    }

    const User = require('../models/User');
    const scholar = await User.findById(thesis.scholarId);
    if (!scholar) return res.status(404).json({ message: 'Scholar user not found' });

    if (req.user.role === 'ADMIN') {
      // Super Admin (Global Transfer)
      const { targetDepartment, targetSupervisorId, targetHodId } = req.body;

      if (!targetDepartment || !targetSupervisorId || !targetHodId) {
        return res.status(400).json({ message: 'Transfer failed. Department, Supervisor, and HOD are all required fields.' });
      }

      const targetSupervisor = await User.findById(targetSupervisorId);
      if (!targetSupervisor) return res.status(404).json({ message: 'Target supervisor not found.' });
      if (!targetSupervisor.isVerified) return res.status(400).json({ message: 'Target supervisor is not verified.' });
      if (targetSupervisor.department !== targetDepartment) {
        return res.status(400).json({ message: 'Target supervisor must belong to the selected department.' });
      }

      const targetHod = await User.findById(targetHodId);
      if (!targetHod) return res.status(404).json({ message: 'Target HOD not found.' });
      if (!targetHod.isVerified) return res.status(400).json({ message: 'Target HOD is not verified.' });
      if (targetHod.department !== targetDepartment) {
        return res.status(400).json({ message: 'Target HOD must belong to the selected department.' });
      }

      const oldDept = thesis.department;
      const oldSupervisorId = thesis.supervisorId;

      // Apply complete transfer
      thesis.department = targetDepartment;
      thesis.supervisorId = targetSupervisor._id;
      scholar.department = targetDepartment;

      thesis.auditLog.push({
        action: 'GLOBAL_TRANSFERRED',
        note: `Globally transferred from department ${oldDept} to ${targetDepartment} by Admin ${req.user.name}. New Supervisor: ${targetSupervisor.name}, New HOD: ${targetHod.name}.`
      });

      await thesis.save();
      await scholar.save();

      // Notifications
      await createNotification({
        recipient: thesis.scholarId,
        title: '🔄 Global Transfer Executed',
        message: `Your research profile has been globally transferred to the ${targetDepartment} department under supervisor ${targetSupervisor.name}.`,
        type: 'SYSTEM_ALERT',
        link: 'overview'
      });

      await createNotification({
        recipient: targetSupervisor._id,
        title: '🔄 Scholar Assigned (Global Transfer)',
        message: `Admin ${req.user.name} has globally transferred scholar ${scholar.name} to your supervision in the ${targetDepartment} department.`,
        type: 'PENDING_ACTION',
        link: 'overview'
      });

      await createNotification({
        recipient: targetHod._id,
        title: '🔄 Scholar Transferred In (Global Transfer)',
        message: `Scholar ${scholar.name} has been globally transferred into your department by Admin ${req.user.name}.`,
        type: 'PENDING_ACTION',
        link: 'overview'
      });

      if (oldSupervisorId) {
        await createNotification({
          recipient: oldSupervisorId,
          title: '🔄 Scholar Transferred Out',
          message: `Scholar ${scholar.name} has been globally transferred to another department and is no longer under your supervision.`,
          type: 'SYSTEM_ALERT',
          link: 'overview'
        });
      }

    } else if (req.user.role === 'HOD' || req.user.role === 'FACULTY') {
      // Intra-department transfer (Supervisor Transfer)
      const { targetUserId } = req.body;
      if (!targetUserId) {
        return res.status(400).json({ message: 'Target supervisor is required for transfer.' });
      }

      const targetUser = await User.findById(targetUserId);
      if (!targetUser) return res.status(404).json({ message: 'Target supervisor not found.' });
      if (!targetUser.isVerified) return res.status(400).json({ message: 'Target supervisor is not verified.' });

      // Enforce HOD & Faculty department boundaries
      if (thesis.department !== req.user.department) {
        return res.status(403).json({ message: 'Not authorized. Scholar belongs to another department.' });
      }
      if (targetUser.department !== thesis.department) {
        return res.status(400).json({ message: 'Cannot transfer scholar to a supervisor outside your department.' });
      }

      if (req.user.role === 'FACULTY' && (!thesis.supervisorId || thesis.supervisorId.toString() !== req.user._id.toString())) {
        return res.status(403).json({ message: 'Not authorized. You are not the assigned supervisor.' });
      }

      const oldSupervisorId = thesis.supervisorId;
      thesis.supervisorId = targetUser._id;

      thesis.auditLog.push({
        action: 'SUPERVISOR_TRANSFERRED',
        note: `Supervision transferred from ${oldSupervisorId ? 'previous supervisor' : 'none'} to ${targetUser.name} by ${req.user.role} ${req.user.name}.`
      });

      await thesis.save();

      // Notifications
      await createNotification({
        recipient: thesis.scholarId,
        title: '🔄 Supervisor Changed',
        message: `Your supervision has been officially transferred to ${targetUser.name}.`,
        type: 'SYSTEM_ALERT',
        link: 'overview'
      });

      await createNotification({
        recipient: targetUser._id,
        title: '🔄 New Scholar Assigned',
        message: `${req.user.name} has transferred supervision of scholar ${scholar.name} to you.`,
        type: 'PENDING_ACTION',
        link: 'overview'
      });

      if (oldSupervisorId && oldSupervisorId.toString() !== targetUser._id.toString()) {
        await createNotification({
          recipient: oldSupervisorId,
          title: '🔄 Supervision Transferred',
          message: `Your assigned scholar ${scholar.name} has been transferred to ${targetUser.name}. You are no longer their supervisor.`,
          type: 'SYSTEM_ALERT',
          link: 'overview'
        });
      }
    } else {
      return res.status(403).json({ message: 'Only Admin, Faculty, or HOD can initiate transfers.' });
    }

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/force-pre-submission — HOD force-moves scholar to PRE_SUBMISSION (bypasses all checks)
const forcePreSubmission = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // Only HOD can force this
    if (req.user.role !== 'HOD' && req.user.subRole !== 'HOD') {
      return res.status(403).json({ message: 'Only the HOD can force-advance a scholar to Pre-Submission.' });
    }

    // Department check
    if (thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    // Must be in ACTIVE_RESEARCH
    if (thesis.status !== 'ACTIVE_RESEARCH') {
      return res.status(400).json({ message: `Scholar is currently in ${thesis.status}. This action is only available during ACTIVE_RESEARCH phase.` });
    }

    // Calculate current research stats before bypass
    const User = require('../models/User');
    const scholar = await User.findById(thesis.scholarId);
    const hasMphil = scholar?.profile?.qualifications?.mphil?.done === true && scholar?.isVerified === true;
    const admissionDate = scholar?.profile?.admissionDate ? new Date(scholar.profile.admissionDate) : null;
    const referenceDate = admissionDate && !isNaN(admissionDate.getTime()) ? admissionDate : (thesis.startDate ? new Date(thesis.startDate) : new Date());
    const diffMs = new Date() - referenceDate;
    const diffMonths = Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 30.4375));

    const Milestone = require('../models/Milestone');
    const reports = await Milestone.find({ thesisId: thesis._id, type: '6_MONTH_REPORT' });
    const approvedReportsCount = reports.filter(r => r.status === 'VERIFIED').length;

    const Publication = require('../models/Publication');
    const journalsCount = await Publication.countDocuments({ thesisId: thesis._id, type: 'JOURNAL', status: 'VERIFIED' });
    const conferencesCount = await Publication.countDocuments({ thesisId: thesis._id, type: 'CONFERENCE', status: 'VERIFIED' });

    thesis.status = 'PRE_SUBMISSION';
    thesis.activeResearchBypassed = true;
    thesis.activeResearchBypassMetadata = {
      bypassedBy: req.user.name,
      designation: req.user.profile?.designation || 'Head of Department',
      timestamp: new Date(),
      justification: req.body.remarks || '',
      statsBeforeBypass: {
        researchTimeMonths: parseFloat(diffMonths.toFixed(1)),
        approvedReportsCount,
        journalsCount,
        conferencesCount
      }
    };

    thesis.auditLog.push({
      action: 'FORCE_PRE_SUBMISSION',
      note: `HOD ${req.user.name} (${req.user.profile?.designation || 'Head of Department'}) force-advanced scholar to Pre-Submission phase (bypassing checks). Original stats at bypass - Time: ${diffMonths.toFixed(1)}m, Reports: ${approvedReportsCount}, Journals: ${journalsCount}, Conferences: ${conferencesCount}. Remarks: ${req.body.remarks || 'None'}`
    });
    await thesis.save();

    // Auto-create PRE_SUBMISSION milestone if it doesn't exist
    let preMilestone = await Milestone.findOne({ thesisId: thesis._id, type: 'PRE_SUBMISSION' });
    if (!preMilestone) {
      await Milestone.create({
        thesisId: thesis._id,
        type: 'PRE_SUBMISSION',
        title: 'Pre-Submission Thesis & Plagiarism Clearance Package',
        status: 'PENDING',
        sequence: 99
      });
    }

    // Auto-create FINAL_SUBMISSION milestone if it doesn't exist
    const finalExists = await Milestone.findOne({ thesisId: thesis._id, type: 'FINAL_SUBMISSION' });
    if (!finalExists) {
      await Milestone.create({
        thesisId: thesis._id,
        type: 'FINAL_SUBMISSION',
        title: 'Final Complete Thesis Submission Package',
        status: 'PENDING',
        sequence: 100,
      });
    }

    await createNotification({
      recipient: thesis.scholarId,
      title: '🚀 Advanced to Pre-Submission Phase!',
      message: `The HOD has advanced your thesis to the Pre-Submission phase. Please prepare and upload your rough thesis draft and plagiarism clearance report.`,
      type: 'SUCCESSFUL_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    console.error('forcePreSubmission error:', err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/thesis/search/global — HOD & Faculty search scholars across all departments
const searchGlobalTheses = async (req, res) => {
  try {
    const { enrollmentNumber, department } = req.query;
    if (!enrollmentNumber && !department) {
      return res.status(400).json({ message: 'Please provide search criteria: registration/enrollment number or department.' });
    }

    const filter = {};
    if (enrollmentNumber) {
      filter.enrollmentNumber = { $regex: new RegExp(enrollmentNumber.trim(), 'i') };
    }
    if (department) {
      filter.department = department;
    }

    const theses = await Thesis.find(filter)
      .populate('scholarId', 'name username email profile profileCompleted department')
      .populate('supervisorId', 'name username subRole department')
      .sort('-createdAt');

    const augmented = await augmentThesesWithMilestones(theses);
    res.json(augmented);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/me/coursework/submit - Student submits coursework details
const submitCourseworkDetails = async (req, res) => {
  try {
    const thesis = await Thesis.findOne({ scholarId: req.user._id });
    if (!thesis) return res.status(404).json({ message: 'No research profile found.' });

    if (thesis.status !== 'COURSEWORK') {
      return res.status(400).json({ message: 'Coursework submission is only allowed in the Coursework phase.' });
    }

    let { researchEthics, researchMethodology, elective, others } = req.body;

    // Parse JSON strings since the request is sent via multipart/form-data
    if (typeof researchEthics === 'string') {
      try { researchEthics = JSON.parse(researchEthics); } catch (e) { return res.status(400).json({ message: 'Invalid format for Research and Publication Ethics.' }); }
    }
    if (typeof researchMethodology === 'string') {
      try { researchMethodology = JSON.parse(researchMethodology); } catch (e) { return res.status(400).json({ message: 'Invalid format for Research Methodology.' }); }
    }
    if (typeof elective === 'string') {
      try { elective = JSON.parse(elective); } catch (e) { return res.status(400).json({ message: 'Invalid format for Discipline-Specific Elective.' }); }
    }
    if (typeof others === 'string') {
      try { others = JSON.parse(others); } catch (e) { return res.status(400).json({ message: 'Invalid format for Others section.' }); }
    }

    // Validate proof file
    if (!req.file && !thesis.courseworkUploadProof) {
      return res.status(400).json({ message: 'Upload Proof is required.' });
    }

    // Validate rows
    const validateSection = (section, name, isOptional = false) => {
      if (!section || !Array.isArray(section)) {
        if (isOptional) return;
        throw new Error(`Please add at least one subject in ${name}.`);
      }
      if (!isOptional && section.length === 0) {
        throw new Error(`Please add at least one subject in ${name}.`);
      }
      for (const row of section) {
        // Skip empty rows in optional sections
        if (isOptional && !row.subjectName?.trim() && !row.subjectCode?.trim() && !row.marksObtained && !row.maxMarks) {
          continue;
        }

        if (!row.subjectName?.trim()) {
          throw new Error(`Subject Name is required in all active rows of ${name}.`);
        }
        const obtained = Number(row.marksObtained);
        const max = Number(row.maxMarks);
        if (isNaN(obtained) || obtained < 0) {
          throw new Error(`Valid Marks Obtained is required in ${name}.`);
        }
        if (isNaN(max) || max <= 0) {
          throw new Error(`Valid Maximum Marks (greater than 0) is required in ${name}.`);
        }
        if (obtained > max) {
          throw new Error(`Marks Obtained cannot be greater than Maximum Marks in ${name}.`);
        }
      }
    };

    try {
      validateSection(researchEthics, 'Research and Publication Ethics');
      validateSection(researchMethodology, 'Research Methodology');
      validateSection(elective, 'Discipline-Specific Elective Course');
      validateSection(others, 'Others', true);
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }

    // Clean up empty rows in others
    const cleanOthers = (others || []).filter(row => 
      row.subjectName?.trim() || row.subjectCode?.trim() || row.marksObtained || row.maxMarks
    );

    thesis.courseworkDetails = {
      researchEthics,
      researchMethodology,
      elective,
      others: cleanOthers
    };

    if (req.file) {
      thesis.courseworkUploadProof = `/uploads/${req.file.filename}`;
    }

    thesis.courseworkStatus = 'PENDING_FACULTY';
    thesis.courseworkApprovals = {
      facultyApproved: false,
      facultyApproverId: null,
      facultyApprovedAt: null,
      hodApproved: false,
      hodApproverId: null,
      hodApprovedAt: null
    };

    thesis.auditLog.push({
      action: 'COURSEWORK_SUBMITTED',
      note: 'Coursework details submitted by student for supervisor approval.'
    });

    await thesis.save();

    // Notify Supervisor
    if (thesis.supervisorId) {
      await createNotification({
        recipient: thesis.supervisorId,
        title: '⏳ Coursework Approval Pending',
        message: `Scholar ${req.user.name} has submitted their coursework details for your verification.`,
        type: 'PENDING_ACTION',
        link: 'scholars'
      });
    }

    res.json(thesis);
  } catch (err) {
    console.error("COURSEWORK_SUBMIT_ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/coursework/approve-faculty - Faculty approves coursework details
const approveCourseworkFaculty = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found.' });

    // Verify req.user is supervisor
    if (!thesis.supervisorId || thesis.supervisorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized. Only the assigned supervisor can verify this coursework.' });
    }

    if (thesis.courseworkStatus !== 'PENDING_FACULTY') {
      return res.status(400).json({ message: 'This coursework is not awaiting supervisor approval.' });
    }

    thesis.courseworkStatus = 'PENDING_HOD';
    thesis.courseworkApprovals.facultyApproved = true;
    thesis.courseworkApprovals.facultyApproverId = req.user._id;
    thesis.courseworkApprovals.facultyApprovedAt = new Date();

    thesis.auditLog.push({
      action: 'COURSEWORK_FACULTY_APPROVED',
      note: `Verified by supervisor ${req.user.name}. Forwarded to HOD for final approval.`
    });

    await thesis.save();

    // Notify HOD
    await createNotification({
      roleScope: 'HOD',
      department: thesis.department,
      title: '⏳ Coursework HOD Approval Pending',
      message: `Coursework details of Scholar "${thesis.title}" have been approved by supervisor ${req.user.name} and await your final HOD approval.`,
      type: 'PENDING_ACTION',
      link: 'registrations'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/coursework/reject-faculty - Faculty rejects coursework details
const rejectCourseworkFaculty = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found.' });

    if (!thesis.supervisorId || thesis.supervisorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized. Only the assigned supervisor can reject this coursework.' });
    }

    thesis.courseworkStatus = 'REJECTED';
    thesis.courseworkUploadProof = null;
    thesis.auditLog.push({
      action: 'COURSEWORK_FACULTY_REJECTED',
      note: `Rejected by supervisor ${req.user.name}. Remarks: ${req.body.remarks || 'None'}`
    });

    await thesis.save();

    // Notify Student
    await createNotification({
      recipient: thesis.scholarId,
      title: '❌ Coursework Rejected by Supervisor',
      message: `Your supervisor has rejected your coursework submission: "${req.body.remarks || 'Please review and resubmit.'}"`,
      type: 'PENDING_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/coursework/approve-hod - HOD approves coursework details (final approval)
const approveCourseworkHOD = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found.' });

    if (req.user.role !== 'HOD' || thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. Only the department HOD can provide final coursework clearance.' });
    }

    if (thesis.courseworkStatus !== 'PENDING_HOD') {
      return res.status(400).json({ message: 'This coursework is not awaiting HOD approval.' });
    }

    thesis.courseworkStatus = 'APPROVED';
    thesis.courseworkCompleted = true;
    thesis.status = 'SYNOPSIS_PENDING';
    
    thesis.courseworkApprovals.hodApproved = true;
    thesis.courseworkApprovals.hodApproverId = req.user._id;
    thesis.courseworkApprovals.hodApprovedAt = new Date();

    thesis.auditLog.push({
      action: 'COURSEWORK_HOD_APPROVED',
      note: `Final clearance granted by HOD ${req.user.name}.`
    });

    await thesis.save();

    // Auto-create synopsis milestone if not exists
    const existingSynopsis = await Milestone.findOne({ thesisId: thesis._id, type: 'SYNOPSIS' });
    if (!existingSynopsis) {
      await Milestone.create({
        thesisId: thesis._id,
        type: 'SYNOPSIS',
        title: 'Research Synopsis',
        status: 'PENDING',
        sequence: 1,
      });
    }

    // Notify Student
    await createNotification({
      recipient: thesis.scholarId,
      title: '🎉 Coursework Completed!',
      message: `Your coursework has been approved by the HOD. You are now officially cleared to proceed to the SYNOPSIS phase.`,
      type: 'SUCCESSFUL_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/coursework/reject-hod - HOD rejects coursework details
const rejectCourseworkHOD = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found.' });

    if (req.user.role !== 'HOD' || thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. Only the department HOD can reject this coursework.' });
    }

    thesis.courseworkStatus = 'REJECTED';
    thesis.courseworkUploadProof = null;
    thesis.auditLog.push({
      action: 'COURSEWORK_HOD_REJECTED',
      note: `Rejected by HOD ${req.user.name}. Remarks: ${req.body.remarks || 'None'}`
    });

    await thesis.save();

    // Notify Student
    await createNotification({
      recipient: thesis.scholarId,
      title: '❌ Coursework Rejected by HOD',
      message: `HOD has rejected your coursework submission: "${req.body.remarks || 'Please revise marks details.'}"`,
      type: 'PENDING_ACTION',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/pre-submission/schedule — HOD schedules pre-submission seminar
const schedulePreSubmissionSeminar = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD department check
    if (req.user.role !== 'HOD' && req.user.subRole !== 'HOD') {
      return res.status(403).json({ message: 'Not authorized. Only HOD can perform this action.' });
    }
    if (thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    // Ensure the PRE_SUBMISSION milestone draft is APPROVED
    const preMilestone = await Milestone.findOne({ thesisId: thesis._id, type: 'PRE_SUBMISSION' });
    if (!preMilestone || preMilestone.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Pre-Submission Thesis Draft package must be approved by Supervisor and HOD before scheduling the seminar.' });
    }

    const { scheduledDate, scheduledTime, venue, committeeMembers, remarks } = req.body;
    if (!scheduledDate || !scheduledTime || !venue) {
      return res.status(400).json({ message: 'Please specify Scheduled Date, Time, and Venue.' });
    }

    if (!thesis.preSubmissionSeminar) {
      thesis.preSubmissionSeminar = {};
    }

    thesis.preSubmissionSeminar.status = 'SCHEDULED';
    thesis.preSubmissionSeminar.scheduledDate = scheduledDate;
    thesis.preSubmissionSeminar.scheduledTime = scheduledTime;
    thesis.preSubmissionSeminar.venue = venue;
    thesis.preSubmissionSeminar.committeeMembers = committeeMembers || '';
    thesis.preSubmissionSeminar.remarks = remarks || '';
    thesis.preSubmissionSeminar.hodApprovedAt = new Date();
    thesis.preSubmissionSeminar.hodApproverId = req.user._id;

    thesis.auditLog.push({
      action: 'PRE_SUBMISSION_SEMINAR_SCHEDULED',
      note: `Pre-submission seminar scheduled by HOD. Date: ${new Date(scheduledDate).toLocaleDateString()}, Time: ${scheduledTime}, Venue: ${venue}. Remarks: ${remarks || 'None'}`
    });

    await thesis.save();

    // Notify Student
    await createNotification({
      recipient: thesis.scholarId,
      title: '📆 Pre-Submission Seminar Scheduled!',
      message: `Your Pre-Submission Seminar has been scheduled for ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime} in ${venue}.`,
      type: 'INFO',
      link: 'presubmission'
    });

    // Notify Supervisor
    await createNotification({
      recipient: thesis.supervisorId,
      title: '📆 Pre-Submission Seminar Scheduled!',
      message: `The Pre-Submission Seminar for scholar "${thesis.title}" has been scheduled for ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime} in ${venue}.`,
      type: 'INFO',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/pre-submission/record-outcome — HOD records seminar outcome
const recordPreSubmissionSeminarOutcome = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD department check
    if (req.user.role !== 'HOD' && req.user.subRole !== 'HOD') {
      return res.status(403).json({ message: 'Not authorized. Only HOD can perform this action.' });
    }
    if (thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    if (thesis.preSubmissionSeminar?.status !== 'SCHEDULED') {
      return res.status(400).json({ message: 'Pre-Submission Seminar has not been scheduled yet.' });
    }

    const { status, remarks } = req.body;
    if (status !== 'CLEARED' && status !== 'UNCLEARED') {
      return res.status(400).json({ message: 'Outcome status must be either CLEARED or UNCLEARED.' });
    }

    thesis.preSubmissionSeminar.status = status;
    thesis.preSubmissionSeminar.outcomeRecordedAt = new Date();
    thesis.preSubmissionSeminar.outcomeRemarks = remarks || '';

    if (status === 'CLEARED') {
      thesis.status = 'PRE_SUBMISSION';
      thesis.auditLog.push({
        action: 'SEMINAR_CLEARED',
        note: `Pre-submission seminar evaluated CLEARED by HOD. Remarks: ${remarks || 'None'}`
      });

      // Mark pre-submission milestone as APPROVED
      const preSub = await Milestone.findOne({ thesisId: thesis._id, type: 'PRE_SUBMISSION' });
      if (preSub) {
        preSub.status = 'APPROVED';
        preSub.reviewedAt = new Date();
        await preSub.save();
      }

      // Auto-create final submission milestone (sequence 100) if it doesn't exist
      const finalExists = await Milestone.findOne({ thesisId: thesis._id, type: 'FINAL_SUBMISSION' });
      if (!finalExists) {
        await Milestone.create({
          thesisId: thesis._id,
          type: 'FINAL_SUBMISSION',
          title: 'Final Complete Thesis Submission Package',
          status: 'PENDING',
          sequence: 100,
        });
      }
    } else {
      thesis.auditLog.push({
        action: 'SEMINAR_FAILED',
        note: `Pre-submission seminar evaluated UNCLEARED by HOD. Remarks: ${remarks || 'None'}`
      });
    }

    await thesis.save();

    // Notify Student
    await createNotification({
      recipient: thesis.scholarId,
      title: status === 'CLEARED' ? '🎉 Seminar Cleared!' : '⚠️ Seminar Uncleared',
      message: status === 'CLEARED'
        ? 'Congratulations! Your Pre-Submission Seminar outcome was evaluated as CLEARED. Finalbound thesis upload is now unlocked.'
        : `Your Pre-Submission Seminar outcome was evaluated as UNCLEARED. Remarks: "${remarks || 'None'}"`,
      type: status === 'CLEARED' ? 'SUCCESSFUL_ACTION' : 'PENDING_ACTION',
      link: 'finalsubmission'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/thesis/:id/provisional-synopsis-clear — HOD provisionally clear synopsis → ACTIVE_RESEARCH
const provisionalSynopsisClear = async (req, res) => {
  try {
    const thesis = await Thesis.findById(req.params.id);
    if (!thesis) return res.status(404).json({ message: 'Thesis not found' });

    // HOD department check
    if (req.user.role === 'HOD' && thesis.department !== req.user.department) {
      return res.status(403).json({ message: 'Not authorized. This scholar belongs to another department.' });
    }

    thesis.status = 'ACTIVE_RESEARCH';
    thesis.synopsisProvisionallyCleared = true;
    thesis.startDate = new Date();
    thesis.auditLog.push({ 
      action: 'SYNOPSIS_PROVISIONALLY_CLEARED', 
      note: `Synopsis provisionally cleared by HOD ${req.user.name}. Scholar fast-tracked to Active Research phase.` 
    });
    await thesis.save();

    // Auto-generate milestones for Active Research (progress reports) immediately
    const { generateMilestonesIfNeeded } = require('./milestoneController');
    await generateMilestonesIfNeeded(thesis._id);

    await createNotification({
      recipient: thesis.scholarId,
      title: '⚠️ Synopsis Provisionally Cleared',
      message: `Your research synopsis requirement has been provisionally cleared by the HOD. You are transitioned to the ACTIVE_RESEARCH phase, but you must upload and officially verify your synopsis before final pre-submission.`,
      type: 'INFO',
      link: 'overview'
    });

    res.json(thesis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createThesis, getMyThesis, getAllTheses, getThesisById,
  verifyEnrollment, assignSupervisor, clearCoursework, awardDegree, updateAuditLog,
  getAssignedTheses, getDeptTheses, drcApprove, scheduleSeminar, seminarClear, finalApprove,
  dispatchThesis, scheduleViva, recordViva, transferThesis, forcePreSubmission,
  searchGlobalTheses,
  submitCourseworkDetails, approveCourseworkFaculty, rejectCourseworkFaculty,
  approveCourseworkHOD, rejectCourseworkHOD,
  schedulePreSubmissionSeminar, recordPreSubmissionSeminarOutcome,
  finalReject, finalApproveHOD, finalRejectHOD, logExternalEvaluation, getEligibilityDetails,
  provisionalSynopsisClear
};
