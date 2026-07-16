const User = require('../models/User');
const Thesis = require('../models/Thesis');
const Publication = require('../models/Publication');
const Department = require('../models/Department');
const ResearchLab = require('../models/ResearchLab');
const FundingOpportunity = require('../models/FundingOpportunity');
const Event = require('../models/Event');
const CollaborationInquiry = require('../models/CollaborationInquiry');
const DoctoralProject = require('../models/DoctoralProject');
const CollaborationCall = require('../models/CollaborationCall');
const FundingAward = require('../models/FundingAward');
const Partnership = require('../models/Partnership');

// GET /api/public/labs
const getLabs = async (req, res) => {
  try {
    const labs = await ResearchLab.find({})
      .populate('leadId', 'name profile username')
      .sort('name');

    const enrichedLabs = await Promise.all(labs.map(async (lab) => {
      const theses = await Thesis.find({ supervisorId: lab.leadId });
      const scholarIdsFromTheses = theses.map(t => t.scholarId);

      const members = await User.find({
        $or: [
          { labId: lab._id },
          { _id: { $in: scholarIdsFromTheses } },
          { _id: lab.leadId }
        ]
      }, 'name role avatarUrl profile department');

      const scholarIds = members.filter(m => m.role === 'STUDENT').map(m => m._id);
      const activeProjectsCount = lab.projects ? lab.projects.length : 0;

      const publicationCount = await Publication.countDocuments({
        scholarId: { $in: scholarIds },
        status: 'VERIFIED'
      });

      return {
        ...lab.toObject(),
        members,
        memberCount: members.length,
        activeProjectsCount,
        publicationCount
      };
    }));

    res.status(200).json(enrichedLabs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/public/publications
const getPublications = async (req, res) => {
  try {
    const publications = await Publication.find({ status: 'VERIFIED' })
      .populate('scholarId', 'name department')
      .populate({
        path: 'thesisId',
        select: 'title supervisorId',
        populate: {
          path: 'supervisorId',
          select: 'name'
        }
      })
      .sort('-publicationDate');
    res.status(200).json(publications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/public/funding
const getFunding = async (req, res) => {
  try {
    const opportunities = await FundingOpportunity.find({}).sort('-createdAt');
    res.status(200).json(opportunities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/public/events
const getEvents = async (req, res) => {
  try {
    const customEvents = await Event.find({}).sort('-date');
    
    // Fetch upcoming scheduled defenses
    const thesesWithVivas = await Thesis.find({
      status: { $in: ['PRE_SUBMISSION', 'SUBMITTED'] },
      vivaDate: { $ne: null },
      vivaStatus: 'SCHEDULED'
    }).populate('scholarId', 'name department');

    const defenseEvents = thesesWithVivas.map(thesis => {
      const speakerName = thesis.scholarId ? thesis.scholarId.name : 'Ph.D. Scholar';
      const deptName = thesis.department || (thesis.scholarId ? thesis.scholarId.department : '');
      return {
        _id: thesis._id,
        title: `Ph.D. Defense: ${thesis.title}`,
        date: thesis.vivaDate,
        time: thesis.vivaTime || 'TBA',
        location: thesis.vivaVenue || 'Seminar Hall',
        speaker: `Scholar: ${speakerName} (${deptName})`,
        type: 'Defense Viva'
      };
    });

    // Merge and sort by date descending
    const mergedEvents = [...customEvents, ...defenseEvents].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.status(200).json(mergedEvents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/public/stats
const getStats = async (req, res) => {
  try {
    const scholarsCount = await User.countDocuments({ role: 'STUDENT', profileCompleted: true });
    const guidesCount = await User.countDocuments({ role: 'FACULTY', profileCompleted: true });
    const publicationsCount = await Publication.countDocuments({ status: 'VERIFIED' });
    const awardedCount = await Thesis.countDocuments({ status: 'AWARDED' });
    const departmentCount = await Department.countDocuments({});

    res.status(200).json({
      scholars: scholarsCount,
      guides: guidesCount,
      publications: publicationsCount,
      awardedDegrees: awardedCount,
      departments: departmentCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/public/collaborate/inquiry
const submitInquiry = async (req, res) => {
  try {
    const { name, email, institution, project, details } = req.body;
    if (!name || !email || !institution || !project || !details) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const inquiry = new CollaborationInquiry({
      name,
      email,
      institution,
      project,
      details
    });

    await inquiry.save();
    res.status(201).json({ message: 'Inquiry submitted successfully', inquiry });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/public/projects
const getDoctoralProjects = async (req, res) => {
  try {
    const projects = await DoctoralProject.find({}).sort('-createdAt');
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/public/collab-calls
const getCollaborationCalls = async (req, res) => {
  try {
    const calls = await CollaborationCall.find({}).sort('-createdAt');
    res.status(200).json(calls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getLabById = async (req, res) => {
  try {
    const lab = await ResearchLab.findById(req.params.id)
      .populate('leadId', 'name profile username')
      .populate('members', 'name role avatarUrl profile department');
    if (!lab) return res.status(404).json({ message: 'Lab not found' });

    // Gather supervised scholars
    const theses = await Thesis.find({ supervisorId: lab.leadId }).populate('scholarId', 'name profile avatarUrl department');
    const supervisedScholars = theses.map(t => t.scholarId).filter(Boolean);

    const memberMap = new Map();
    if (lab.members) {
      lab.members.forEach(m => memberMap.set(m._id.toString(), m));
    }
    supervisedScholars.forEach(s => memberMap.set(s._id.toString(), s));
    if (lab.leadId) {
      memberMap.set(lab.leadId._id.toString(), lab.leadId);
    }
    const allMembers = Array.from(memberMap.values());
    const scholarIds = allMembers.filter(m => m.role === 'STUDENT').map(m => m._id);

    // Fetch publications for all members
    const publications = await Publication.find({
      scholarId: { $in: scholarIds },
      status: 'VERIFIED'
    }).populate('scholarId', 'name').sort('-publicationDate');

    res.status(200).json({
      ...lab.toObject(),
      members: allMembers,
      publications,
      theses
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFundingStats = async (req, res) => {
  try {
    const opportunities = await FundingOpportunity.find({});
    const activeAwards = await FundingAward.find({ status: 'ACTIVE' });
    const activeScholarsCount = new Set(activeAwards.map(a => a.scholarId.toString())).size;

    res.status(200).json({
      totalOpportunities: opportunities.length,
      activeFellowshipsCount: activeScholarsCount,
      totalActivePool: "₹5.2 Crores",
      activeAwardsCount: activeAwards.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFundingById = async (req, res) => {
  try {
    const funding = await FundingOpportunity.findById(req.params.id);
    if (!funding) return res.status(404).json({ message: 'Funding opportunity not found' });
    res.status(200).json(funding);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPartnerships = async (req, res) => {
  try {
    const partnerships = await Partnership.find({}).sort('-createdAt');
    res.status(200).json(partnerships);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPartnershipById = async (req, res) => {
  try {
    const partnership = await Partnership.findById(req.params.id)
      .populate('linkedLabIds', 'name department focus');
    if (!partnership) return res.status(404).json({ message: 'Partnership not found' });
    res.status(200).json(partnership);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getScholarFunding = async (req, res) => {
  try {
    const scholarId = req.user._id;
    const awards = await FundingAward.find({ scholarId })
      .populate('fundingOpportunityId', 'title agency amount duration scope')
      .populate('thesisId', 'title')
      .sort('-createdAt');
    res.status(200).json(awards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFacultyScholarsFunding = async (req, res) => {
  try {
    const supervisorId = req.user._id;
    const theses = await Thesis.find({ supervisorId });
    const scholarIds = theses.map(t => t.scholarId);

    const awards = await FundingAward.find({ scholarId: { $in: scholarIds } })
      .populate('scholarId', 'name department profile')
      .populate('thesisId', 'title')
      .populate('fundingOpportunityId', 'title agency')
      .sort('-createdAt');

    res.status(200).json(awards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFacultyAssignedInquiries = async (req, res) => {
  try {
    const inquiries = await CollaborationInquiry.find({ assignedTo: req.user._id })
      .sort('-createdAt');
    res.status(200).json(inquiries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getLabs,
  getPublications,
  getFunding,
  getEvents,
  getStats,
  submitInquiry,
  getDoctoralProjects,
  getCollaborationCalls,
  getLabById,
  getFundingStats,
  getFundingById,
  getPartnerships,
  getPartnershipById,
  getScholarFunding,
  getFacultyScholarsFunding,
  getFacultyAssignedInquiries
};
