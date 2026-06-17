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

// GET /api/public/labs
const getLabs = async (req, res) => {
  try {
    const labs = await ResearchLab.find({})
      .populate('leadId', 'name profile')
      .sort('name');
    res.status(200).json(labs);
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

module.exports = {
  getLabs,
  getPublications,
  getFunding,
  getEvents,
  getStats,
  submitInquiry,
  getDoctoralProjects,
  getCollaborationCalls
};
