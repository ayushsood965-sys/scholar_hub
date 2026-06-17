const ResearchLab = require('../models/ResearchLab');
const FundingOpportunity = require('../models/FundingOpportunity');
const Event = require('../models/Event');
const CollaborationInquiry = require('../models/CollaborationInquiry');
const DoctoralProject = require('../models/DoctoralProject');
const CollaborationCall = require('../models/CollaborationCall');

// ==========================================
// RESEARCH LABS CRUD
// ==========================================

const createLab = async (req, res) => {
  try {
    const { name, department, leadId, focus, projects, status } = req.body;
    if (!name || !department || !leadId || !focus) {
      return res.status(400).json({ message: 'Name, department, lead supervisor, and focus are required' });
    }

    const lab = new ResearchLab({
      name,
      department,
      leadId,
      focus,
      projects: projects || [],
      status: status || 'Actively Recruiting Scholars'
    });

    await lab.save();
    res.status(201).json(lab);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateLab = async (req, res) => {
  try {
    const { name, department, leadId, focus, projects, status } = req.body;
    const lab = await ResearchLab.findById(req.params.id);
    if (!lab) return res.status(404).json({ message: 'Lab not found' });

    if (name) lab.name = name;
    if (department) lab.department = department;
    if (leadId) lab.leadId = leadId;
    if (focus) lab.focus = focus;
    if (projects) lab.projects = projects;
    if (status) lab.status = status;

    await lab.save();
    res.status(200).json(lab);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteLab = async (req, res) => {
  try {
    const lab = await ResearchLab.findByIdAndDelete(req.params.id);
    if (!lab) return res.status(404).json({ message: 'Lab not found' });
    res.status(200).json({ message: 'Research lab deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// COLLABORATION INQUIRIES
// ==========================================

const getInquiries = async (req, res) => {
  try {
    const inquiries = await CollaborationInquiry.find({}).sort('-createdAt');
    res.status(200).json(inquiries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateInquiry = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const inquiry = await CollaborationInquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

    if (status) inquiry.status = status;
    if (remarks !== undefined) inquiry.remarks = remarks;

    await inquiry.save();
    res.status(200).json(inquiry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// FUNDING OPPORTUNITIES CRUD
// ==========================================

const createFunding = async (req, res) => {
  try {
    const { title, agency, amount, duration, scope, status } = req.body;
    if (!title || !agency || !amount || !duration || !scope) {
      return res.status(400).json({ message: 'All grant details are required' });
    }

    const funding = new FundingOpportunity({
      title,
      agency,
      amount,
      duration,
      scope,
      status: status || 'Applications Open'
    });

    await funding.save();
    res.status(201).json(funding);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateFunding = async (req, res) => {
  try {
    const { title, agency, amount, duration, scope, status } = req.body;
    const funding = await FundingOpportunity.findById(req.params.id);
    if (!funding) return res.status(404).json({ message: 'Funding opportunity not found' });

    if (title) funding.title = title;
    if (agency) funding.agency = agency;
    if (amount) funding.amount = amount;
    if (duration) funding.duration = duration;
    if (scope) funding.scope = scope;
    if (status) funding.status = status;

    await funding.save();
    res.status(200).json(funding);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteFunding = async (req, res) => {
  try {
    const funding = await FundingOpportunity.findByIdAndDelete(req.params.id);
    if (!funding) return res.status(404).json({ message: 'Funding opportunity not found' });
    res.status(200).json({ message: 'Funding opportunity deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// EVENTS CRUD
// ==========================================

const createEvent = async (req, res) => {
  try {
    const { title, date, time, location, speaker, type } = req.body;
    if (!title || !date || !time || !location || !speaker) {
      return res.status(400).json({ message: 'All event details are required' });
    }

    const event = new Event({
      title,
      date,
      time,
      location,
      speaker,
      type: type || 'Seminar'
    });

    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { title, date, time, location, speaker, type } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (title) event.title = title;
    if (date) event.date = date;
    if (time) event.time = time;
    if (location) event.location = location;
    if (speaker) event.speaker = speaker;
    if (type) event.type = type;

    await event.save();
    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// DOCTORAL PROJECTS CRUD
// ==========================================

const createDoctoralProject = async (req, res) => {
  try {
    const { title, department, abstract, scholarName, supervisorName, status } = req.body;
    if (!title || !department || !abstract || !scholarName || !supervisorName) {
      return res.status(400).json({ message: 'All project details are required' });
    }

    const project = new DoctoralProject({
      title,
      department,
      abstract,
      scholarName,
      supervisorName,
      status: status || 'ACTIVE_RESEARCH'
    });

    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateDoctoralProject = async (req, res) => {
  try {
    const { title, department, abstract, scholarName, supervisorName, status } = req.body;
    const project = await DoctoralProject.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (title) project.title = title;
    if (department) project.department = department;
    if (abstract) project.abstract = abstract;
    if (scholarName) project.scholarName = scholarName;
    if (supervisorName) project.supervisorName = supervisorName;
    if (status) project.status = status;

    await project.save();
    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteDoctoralProject = async (req, res) => {
  try {
    const project = await DoctoralProject.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.status(200).json({ message: 'Featured project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// COLLABORATION CALLS CRUD
// ==========================================

const createCollaborationCall = async (req, res) => {
  try {
    const { title, description, type, department, status } = req.body;
    if (!title || !description || !department) {
      return res.status(400).json({ message: 'Title, description, and department are required' });
    }

    const call = new CollaborationCall({
      title,
      description,
      type: type || 'Industry Partner',
      department,
      status: status || 'Active'
    });

    await call.save();
    res.status(201).json(call);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateCollaborationCall = async (req, res) => {
  try {
    const { title, description, type, department, status } = req.body;
    const call = await CollaborationCall.findById(req.params.id);
    if (!call) return res.status(404).json({ message: 'Collaboration call not found' });

    if (title) call.title = title;
    if (description) call.description = description;
    if (type) call.type = type;
    if (department) call.department = department;
    if (status) call.status = status;

    await call.save();
    res.status(200).json(call);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteCollaborationCall = async (req, res) => {
  try {
    const call = await CollaborationCall.findByIdAndDelete(req.params.id);
    if (!call) return res.status(404).json({ message: 'Collaboration call not found' });
    res.status(200).json({ message: 'Collaboration call deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createLab,
  updateLab,
  deleteLab,
  getInquiries,
  updateInquiry,
  createFunding,
  updateFunding,
  deleteFunding,
  createEvent,
  updateEvent,
  deleteEvent,
  createDoctoralProject,
  updateDoctoralProject,
  deleteDoctoralProject,
  createCollaborationCall,
  updateCollaborationCall,
  deleteCollaborationCall
};
