const ResearchLab = require('../models/ResearchLab');
const FundingOpportunity = require('../models/FundingOpportunity');
const Event = require('../models/Event');
const CollaborationInquiry = require('../models/CollaborationInquiry');
const DoctoralProject = require('../models/DoctoralProject');
const CollaborationCall = require('../models/CollaborationCall');
const FundingAward = require('../models/FundingAward');
const Partnership = require('../models/Partnership');
const User = require('../models/User');

// ==========================================
// RESEARCH LABS CRUD
// ==========================================

const createLab = async (req, res) => {
  try {
    const {
      name, department, leadId, focus, projects, status,
      description, members, researchAreas, equipment,
      website, location, imageUrl, contactEmail, labType,
      fundingSupport, establishedYear
    } = req.body;

    if (!name || !department || !leadId || !focus) {
      return res.status(400).json({ message: 'Name, department, lead supervisor, and focus are required' });
    }

    const lab = new ResearchLab({
      name,
      department,
      leadId,
      focus,
      projects: projects || [],
      status: status || 'Actively Recruiting Scholars',
      description: description || '',
      members: members || [],
      researchAreas: researchAreas || [],
      equipment: equipment || [],
      website: website || '',
      location: location || '',
      imageUrl: imageUrl || '',
      contactEmail: contactEmail || '',
      labType: labType || 'Departmental',
      fundingSupport: fundingSupport || [],
      establishedYear: establishedYear || null,
      createdBy: req.user ? req.user._id : null
    });

    await lab.save();

    // Link members
    if (members && members.length > 0) {
      await User.updateMany({ _id: { $in: members } }, { labId: lab._id });
    }
    // Link lead
    await User.findByIdAndUpdate(leadId, { labId: lab._id });

    res.status(201).json(lab);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateLab = async (req, res) => {
  try {
    const {
      name, department, leadId, focus, projects, status,
      description, members, researchAreas, equipment,
      website, location, imageUrl, contactEmail, labType,
      fundingSupport, establishedYear
    } = req.body;

    const lab = await ResearchLab.findById(req.params.id);
    if (!lab) return res.status(404).json({ message: 'Lab not found' });

    const oldMembers = lab.members || [];
    const oldLeadId = lab.leadId;

    if (name) lab.name = name;
    if (department) lab.department = department;
    if (leadId) lab.leadId = leadId;
    if (focus) lab.focus = focus;
    if (projects) lab.projects = projects;
    if (status) lab.status = status;
    if (description !== undefined) lab.description = description;
    if (members !== undefined) lab.members = members;
    if (researchAreas !== undefined) lab.researchAreas = researchAreas;
    if (equipment !== undefined) lab.equipment = equipment;
    if (website !== undefined) lab.website = website;
    if (location !== undefined) lab.location = location;
    if (imageUrl !== undefined) lab.imageUrl = imageUrl;
    if (contactEmail !== undefined) lab.contactEmail = contactEmail;
    if (labType !== undefined) lab.labType = labType;
    if (fundingSupport !== undefined) lab.fundingSupport = fundingSupport;
    if (establishedYear !== undefined) lab.establishedYear = establishedYear;

    await lab.save();

    // Link/unlink members if updated
    if (members !== undefined) {
      const newMembersStr = members.map(m => m.toString());
      const removedMembers = oldMembers.filter(m => !newMembersStr.includes(m.toString()));
      if (removedMembers.length > 0) {
        await User.updateMany({ _id: { $in: removedMembers }, labId: lab._id }, { labId: null });
      }
      if (members.length > 0) {
        await User.updateMany({ _id: { $in: members } }, { labId: lab._id });
      }
    }

    // Link new lead and clean up old lead if changed
    if (leadId && oldLeadId && leadId.toString() !== oldLeadId.toString()) {
      await User.findByIdAndUpdate(oldLeadId, { labId: null });
      await User.findByIdAndUpdate(leadId, { labId: lab._id });
    } else if (leadId) {
      await User.findByIdAndUpdate(leadId, { labId: lab._id });
    }

    res.status(200).json(lab);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteLab = async (req, res) => {
  try {
    const lab = await ResearchLab.findByIdAndDelete(req.params.id);
    if (!lab) return res.status(404).json({ message: 'Lab not found' });

    // Remove lab references from all users
    await User.updateMany({ labId: req.params.id }, { labId: null });

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
    const {
      title, agency, amount, duration, scope, status,
      type, eligibilityDepartments, eligibilityCriteria,
      deadline, applicationUrl, contactEmail, documentsRequired,
      fundingBody, recurrence
    } = req.body;

    if (!title || !agency || !amount || !duration || !scope) {
      return res.status(400).json({ message: 'All grant details are required' });
    }

    const funding = new FundingOpportunity({
      title,
      agency,
      amount,
      duration,
      scope,
      status: status || 'Applications Open',
      type: type || 'Fellowship',
      eligibilityDepartments: eligibilityDepartments || [],
      eligibilityCriteria: eligibilityCriteria || '',
      deadline: deadline || null,
      applicationUrl: applicationUrl || '',
      contactEmail: contactEmail || '',
      documentsRequired: documentsRequired || [],
      fundingBody: fundingBody || 'Other',
      recurrence: recurrence || 'One-time',
      createdBy: req.user ? req.user._id : null
    });

    await funding.save();
    res.status(201).json(funding);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateFunding = async (req, res) => {
  try {
    const {
      title, agency, amount, duration, scope, status,
      type, eligibilityDepartments, eligibilityCriteria,
      deadline, applicationUrl, contactEmail, documentsRequired,
      fundingBody, recurrence
    } = req.body;

    const funding = await FundingOpportunity.findById(req.params.id);
    if (!funding) return res.status(404).json({ message: 'Funding opportunity not found' });

    if (title) funding.title = title;
    if (agency) funding.agency = agency;
    if (amount) funding.amount = amount;
    if (duration) funding.duration = duration;
    if (scope) funding.scope = scope;
    if (status) funding.status = status;
    if (type) funding.type = type;
    if (eligibilityDepartments !== undefined) funding.eligibilityDepartments = eligibilityDepartments;
    if (eligibilityCriteria !== undefined) funding.eligibilityCriteria = eligibilityCriteria;
    if (deadline !== undefined) funding.deadline = deadline;
    if (applicationUrl !== undefined) funding.applicationUrl = applicationUrl;
    if (contactEmail !== undefined) funding.contactEmail = contactEmail;
    if (documentsRequired !== undefined) funding.documentsRequired = documentsRequired;
    if (fundingBody) funding.fundingBody = fundingBody;
    if (recurrence) funding.recurrence = recurrence;

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
    const {
      title, description, type, department, status,
      partnerType, deadline, fundingAmount, contactPerson,
      contactEmail, eligibleDepartments, outcomes, relatedLabId
    } = req.body;

    if (!title || !description || !department) {
      return res.status(400).json({ message: 'Title, description, and department are required' });
    }

    const call = new CollaborationCall({
      title,
      description,
      type: type || 'Industry Partner',
      department,
      status: status || 'Active',
      partnerType: partnerType || 'Industry',
      deadline: deadline || null,
      fundingAmount: fundingAmount || '',
      contactPerson: contactPerson || '',
      contactEmail: contactEmail || '',
      eligibleDepartments: eligibleDepartments || [],
      outcomes: outcomes || [],
      relatedLabId: relatedLabId || null,
      createdBy: req.user ? req.user._id : null
    });

    await call.save();
    res.status(201).json(call);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateCollaborationCall = async (req, res) => {
  try {
    const {
      title, description, type, department, status,
      partnerType, deadline, fundingAmount, contactPerson,
      contactEmail, eligibleDepartments, outcomes, relatedLabId
    } = req.body;

    const call = await CollaborationCall.findById(req.params.id);
    if (!call) return res.status(404).json({ message: 'Collaboration call not found' });

    if (title) call.title = title;
    if (description) call.description = description;
    if (type) call.type = type;
    if (department) call.department = department;
    if (status) call.status = status;
    if (partnerType) call.partnerType = partnerType;
    if (deadline !== undefined) call.deadline = deadline;
    if (fundingAmount !== undefined) call.fundingAmount = fundingAmount;
    if (contactPerson !== undefined) call.contactPerson = contactPerson;
    if (contactEmail !== undefined) call.contactEmail = contactEmail;
    if (eligibleDepartments !== undefined) call.eligibleDepartments = eligibleDepartments;
    if (outcomes !== undefined) call.outcomes = outcomes;
    if (relatedLabId !== undefined) call.relatedLabId = relatedLabId;

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

const createFundingAward = async (req, res) => {
  try {
    const { scholarId, thesisId, fundingOpportunityId, awardTitle, amountSanctioned, amountDisbursed, startDate, endDate, status, renewalDate, remarks } = req.body;
    if (!scholarId || !awardTitle) {
      return res.status(400).json({ message: 'Scholar and Award Title are required' });
    }

    const Thesis = require('../models/Thesis');

    const award = new FundingAward({
      scholarId,
      thesisId: thesisId || null,
      fundingOpportunityId: fundingOpportunityId || null,
      awardTitle,
      amountSanctioned: amountSanctioned || '',
      amountDisbursed: amountDisbursed || '',
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || 'ACTIVE',
      renewalDate: renewalDate || null,
      remarks: remarks || '',
      awardedBy: req.user ? req.user._id : null
    });

    await award.save();

    // If there is a thesis, update its fundingSource field
    if (thesisId) {
      await Thesis.findByIdAndUpdate(thesisId, { fundingSource: awardTitle });
    } else {
      // Find the student's active thesis and update it
      const studentThesis = await Thesis.findOne({ scholarId });
      if (studentThesis) {
        award.thesisId = studentThesis._id;
        await award.save();
        await Thesis.findByIdAndUpdate(studentThesis._id, { fundingSource: awardTitle });
      }
    }

    res.status(201).json(award);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFundingAwards = async (req, res) => {
  try {
    const awards = await FundingAward.find({})
      .populate('scholarId', 'name department profile')
      .populate('thesisId', 'title')
      .populate('fundingOpportunityId', 'title agency')
      .sort('-createdAt');
    res.status(200).json(awards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateFundingAward = async (req, res) => {
  try {
    const { awardTitle, amountSanctioned, amountDisbursed, startDate, endDate, status, renewalDate, remarks, thesisId } = req.body;
    const award = await FundingAward.findById(req.params.id);
    if (!award) return res.status(404).json({ message: 'Funding award not found' });

    const Thesis = require('../models/Thesis');

    if (awardTitle) {
      award.awardTitle = awardTitle;
      if (award.thesisId) {
        await Thesis.findByIdAndUpdate(award.thesisId, { fundingSource: awardTitle });
      }
    }
    if (amountSanctioned !== undefined) award.amountSanctioned = amountSanctioned;
    if (amountDisbursed !== undefined) award.amountDisbursed = amountDisbursed;
    if (startDate !== undefined) award.startDate = startDate;
    if (endDate !== undefined) award.endDate = endDate;
    if (status) award.status = status;
    if (renewalDate !== undefined) award.renewalDate = renewalDate;
    if (remarks !== undefined) award.remarks = remarks;
    if (thesisId !== undefined) award.thesisId = thesisId;

    await award.save();
    res.status(200).json(award);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteFundingAward = async (req, res) => {
  try {
    const award = await FundingAward.findByIdAndDelete(req.params.id);
    if (!award) return res.status(404).json({ message: 'Funding award not found' });

    const Thesis = require('../models/Thesis');

    // Clean up thesis fundingSource if it was linked
    if (award.thesisId) {
      await Thesis.findByIdAndUpdate(award.thesisId, { fundingSource: '' });
    }

    res.status(200).json({ message: 'Funding award deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// PARTNERSHIPS CRUD
// ==========================================

const createPartnership = async (req, res) => {
  try {
    const { partnerName, partnerType, title, description, departments, linkedLabIds, startDate, endDate, mouDocumentUrl, partnerLogoUrl, outcomes, status, contactPerson, contactEmail } = req.body;
    if (!partnerName || !title) {
      return res.status(400).json({ message: 'Partner name and title are required' });
    }

    const partnership = new Partnership({
      partnerName,
      partnerType: partnerType || 'Industry',
      title,
      description: description || '',
      departments: departments || [],
      linkedLabIds: linkedLabIds || [],
      startDate: startDate || null,
      endDate: endDate || null,
      mouDocumentUrl: mouDocumentUrl || '',
      partnerLogoUrl: partnerLogoUrl || '',
      outcomes: outcomes || [],
      status: status || 'ACTIVE',
      contactPerson: contactPerson || '',
      contactEmail: contactEmail || '',
      createdBy: req.user ? req.user._id : null
    });

    await partnership.save();
    res.status(201).json(partnership);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updatePartnership = async (req, res) => {
  try {
    const { partnerName, partnerType, title, description, departments, linkedLabIds, startDate, endDate, mouDocumentUrl, partnerLogoUrl, outcomes, status, contactPerson, contactEmail } = req.body;
    const partnership = await Partnership.findById(req.params.id);
    if (!partnership) return res.status(404).json({ message: 'Partnership not found' });

    if (partnerName) partnership.partnerName = partnerName;
    if (partnerType) partnership.partnerType = partnerType;
    if (title) partnership.title = title;
    if (description !== undefined) partnership.description = description;
    if (departments !== undefined) partnership.departments = departments;
    if (linkedLabIds !== undefined) partnership.linkedLabIds = linkedLabIds;
    if (startDate !== undefined) partnership.startDate = startDate;
    if (endDate !== undefined) partnership.endDate = endDate;
    if (mouDocumentUrl !== undefined) partnership.mouDocumentUrl = mouDocumentUrl;
    if (partnerLogoUrl !== undefined) partnership.partnerLogoUrl = partnerLogoUrl;
    if (outcomes !== undefined) partnership.outcomes = outcomes;
    if (status) partnership.status = status;
    if (contactPerson !== undefined) partnership.contactPerson = contactPerson;
    if (contactEmail !== undefined) partnership.contactEmail = contactEmail;

    await partnership.save();
    res.status(200).json(partnership);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deletePartnership = async (req, res) => {
  try {
    const partnership = await Partnership.findByIdAndDelete(req.params.id);
    if (!partnership) return res.status(404).json({ message: 'Partnership not found' });
    res.status(200).json({ message: 'Partnership deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// COLLABORATION INQUIRIES WORKFLOW
// ==========================================

const assignInquiry = async (req, res) => {
  try {
    const { assignedTo, priority } = req.body;
    const inquiry = await CollaborationInquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

    if (assignedTo !== undefined) {
      inquiry.assignedTo = assignedTo || null;
      inquiry.assignedAt = assignedTo ? new Date() : null;
      inquiry.status = 'REVIEWED'; // Automatically set to REVIEWED when assigned
    }
    if (priority) inquiry.priority = priority;

    await inquiry.save();
    res.status(200).json(inquiry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addInquiryNote = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Note text is required' });
    }

    const inquiry = await CollaborationInquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

    inquiry.notes.push({
      author: req.user ? req.user._id : null,
      text,
      date: new Date()
    });

    await inquiry.save();
    res.status(200).json(inquiry);
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
  deleteCollaborationCall,
  createFundingAward,
  getFundingAwards,
  updateFundingAward,
  deleteFundingAward,
  createPartnership,
  updatePartnership,
  deletePartnership,
  assignInquiry,
  addInquiryNote
};
