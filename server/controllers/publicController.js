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
    const [scholarsCount, guidesCount, publicationsCount, awardedCount, departmentCount] = await Promise.all([
      User.countDocuments({ role: 'STUDENT', profileCompleted: true }),
      User.countDocuments({ role: 'FACULTY', profileCompleted: true }),
      Publication.countDocuments({ status: 'VERIFIED' }),
      Thesis.countDocuments({ status: 'AWARDED' }),
      Department.countDocuments({})
    ]);

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

const getRepositoryDepartments = async (req, res) => {
  try {
    const departments = await Department.find({});
    
    const enriched = await Promise.all(departments.map(async (dept) => {
      const hodUser = await User.findOne({
        role: 'HOD',
        department: dept.name,
        isActive: true
      }, 'name username role profile department avatarUrl');

      const facultyCount = await User.countDocuments({
        role: { $in: ['FACULTY', 'HOD'] },
        isActive: true,
        department: dept.name
      });

      const scholarCount = await User.countDocuments({
        role: 'STUDENT',
        isActive: true,
        department: dept.name
      });

      return {
        _id: dept._id,
        name: dept.name,
        code: dept.code,
        hod: hodUser || null,
        facultyCount,
        scholarCount
      };
    }));

    res.status(200).json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRepositoryDepartmentFaculties = async (req, res) => {
  try {
    const { code } = req.params;
    const dept = await Department.findOne({ code: code.toUpperCase() });
    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const faculties = await User.find({
      role: { $in: ['FACULTY', 'HOD'] },
      isActive: true,
      department: dept.name
    }, 'name username role profile department avatarUrl');

    const filteredFaculties = faculties.map(u => {
      const isPrivate = u.profile?.privacySettings?.profileVisibility === 'private';
      if (isPrivate) {
        return {
          _id: u._id,
          name: u.name,
          username: u.username,
          role: u.role,
          department: u.department,
          avatarUrl: u.avatarUrl,
          profile: {
            designation: u.profile?.designation,
            specialization: u.profile?.specialization,
            isPrivate: true
          }
        };
      }
      return u;
    });

    res.status(200).json(filteredFaculties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRepositoryDepartmentScholars = async (req, res) => {
  try {
    const { code } = req.params;
    const dept = await Department.findOne({ code: code.toUpperCase() });
    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const scholars = await User.find({
      role: 'STUDENT',
      isActive: true,
      department: dept.name
    }, 'name username role profile department avatarUrl');

    const filteredScholars = scholars.map(u => {
      const isPrivate = u.profile?.privacySettings?.profileVisibility === 'private';
      if (isPrivate) {
        return {
          _id: u._id,
          name: u.name,
          username: u.username,
          role: u.role,
          department: u.department,
          avatarUrl: u.avatarUrl,
          profile: {
            degreeType: u.profile?.degreeType,
            degreeName: u.profile?.degreeName,
            subject: u.profile?.subject,
            isPhD: u.profile?.isPhD,
            isPrivate: true
          }
        };
      }
      return u;
    });

    res.status(200).json(filteredScholars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRepositoryProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    const privacySettings = user.profile?.privacySettings || {
      profileVisibility: 'public',
      documentVisibility: 'private'
    };

    const isProfilePrivate = privacySettings.profileVisibility === 'private';
    const isDocsPrivate = privacySettings.documentVisibility === 'private';

    if (isProfilePrivate) {
      return res.status(200).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        department: user.department,
        avatarUrl: user.avatarUrl,
        privacyMessage: "This profile details have been set to private by the user.",
        profile: {
          isPhD: user.profile?.isPhD,
          degreeType: user.profile?.degreeType,
          degreeName: user.profile?.degreeName,
          designation: user.profile?.designation,
          specialization: user.profile?.specialization,
          isPrivate: true
        }
      });
    }

    const userObj = user.toObject();
    if (userObj.profile) {
      const profile = userObj.profile;
      const privacy = { ...(profile.privacySettings || {}) };
      if (user.role === 'STUDENT') {
        privacy.publications = true;
        privacy.ipr = true;
      }

      // Unconditionally remove preferredGuideId as it should not be shown on the public profile anyway
      delete profile.preferredGuideId;

      // 1. Personal Information
      if (privacy.dob === false && profile.dob) profile.dob = "Uploaded, but privacy is set to private.";
      if (privacy.gender === false && profile.gender) profile.gender = "Uploaded, but privacy is set to private.";
      if (privacy.category === false && profile.category) profile.category = "Uploaded, but privacy is set to private.";
      if (privacy.nationality === false && profile.nationality) profile.nationality = "Uploaded, but privacy is set to private.";
      if (privacy.fatherName === false && profile.fatherName) profile.fatherName = "Uploaded, but privacy is set to private.";
      if (privacy.motherName === false && profile.motherName) profile.motherName = "Uploaded, but privacy is set to private.";
      if (privacy.phoneNumber === false && (profile.phoneNumber || userObj.phoneNumber)) {
        profile.phoneNumber = "Uploaded, but privacy is set to private.";
        userObj.phoneNumber = "Uploaded, but privacy is set to private.";
      }
      if (privacy.address === false && profile.address) profile.address = "Uploaded, but privacy is set to private.";
      if (privacy.admissionDate === false && profile.admissionDate) profile.admissionDate = "Uploaded, but privacy is set to private.";
      if (privacy.enrollmentNumber === false && profile.enrollmentNumber) profile.enrollmentNumber = "Uploaded, but privacy is set to private.";
      if (privacy.erpAdmissionNo === false && profile.erpAdmissionNo) profile.erpAdmissionNo = "Uploaded, but privacy is set to private.";
      if (privacy.phdMode === false && profile.phdMode) profile.phdMode = "Uploaded, but privacy is set to private.";
      if (privacy.thesisKeywords === false && profile.thesisKeywords) profile.thesisKeywords = "Uploaded, but privacy is set to private.";
      if (privacy.academicSession === false && profile.academicSession) profile.academicSession = "Uploaded, but privacy is set to private.";

      // 2. Academic Qualifications
      if (profile.qualifications) {
        const qualsKeys = ['class10', 'class12', 'graduation', 'postGraduation', 'mphil', 'netJrf', 'ugcNet'];
        for (const qKey of qualsKeys) {
          if (profile.qualifications[qKey]) {
            if (privacy[qKey] === false) {
              profile.qualifications[qKey] = {
                isPrivate: true,
                certificatePrivate: privacy[`${qKey}Doc`] === false,
                certificateUrl: privacy[`${qKey}Doc`] === false ? null : profile.qualifications[qKey].certificateUrl
              };
            } else if (privacy[`${qKey}Doc`] === false) {
              profile.qualifications[qKey].certificateUrl = null;
              profile.qualifications[qKey].certificatePrivate = true;
            }
          }
        }
        if (Array.isArray(profile.qualifications.otherQuals)) {
          const otherPrivacy = privacy.otherQuals || [];
          profile.qualifications.otherQuals = profile.qualifications.otherQuals.map((qual, index) => {
            const priv = otherPrivacy[index] || { details: true, doc: true };
            if (priv.details === false) {
              return {
                isPrivate: true,
                degree: "Uploaded, but privacy is set to private.",
                certificatePrivate: priv.doc === false,
                certificateUrl: priv.doc === false ? null : qual.certificateUrl
              };
            }
            const updated = { ...qual };
            if (priv.doc === false) {
              updated.certificateUrl = null;
              updated.certificatePrivate = true;
            }
            return updated;
          });
        }
        if (Array.isArray(profile.qualifications.fellowships)) {
          const fellowPrivacy = privacy.fellowships || [];
          profile.qualifications.fellowships = profile.qualifications.fellowships.map((fell, index) => {
            const priv = fellowPrivacy[index] || { details: true, doc: true };
            if (priv.details === false) {
              return {
                isPrivate: true,
                name: "Uploaded, but privacy is set to private.",
                certificatePrivate: priv.doc === false,
                certificateUrl: priv.doc === false ? null : fell.certificateUrl
              };
            }
            const updated = { ...fell };
            if (priv.doc === false) {
              updated.certificateUrl = null;
              updated.certificatePrivate = true;
            }
            return updated;
          });
        }
      }

      // 3. Research, Professional & Service fields
      if (privacy.specialization === false && profile.specialization) profile.specialization = "Uploaded, but privacy is set to private.";
      if (privacy.areaOfInterest === false && profile.areaOfInterest) profile.areaOfInterest = "Uploaded, but privacy is set to private.";
      if (privacy.thesisTitle === false && profile.thesisTitle) profile.thesisTitle = "Uploaded, but privacy is set to private.";
      if (privacy.thesisSummary === false && profile.thesisSummary) profile.thesisSummary = "Uploaded, but privacy is set to private.";
      if (privacy.officeRoom === false && profile.officeRoom) profile.officeRoom = "Uploaded, but privacy is set to private.";
      if (privacy.yearsOfService === false && profile.yearsOfService !== undefined) {
        profile.yearsOfServicePrivate = true;
      }
      if (privacy.additionalResponsibilities === false && profile.additionalResponsibilities) profile.additionalResponsibilities = "Uploaded, but privacy is set to private.";

      if (privacy.experience === false && Array.isArray(profile.experience) && profile.experience.length > 0) {
        profile.experience = { isPrivate: true, count: profile.experience.length };
      }
      if (privacy.expertise === false && Array.isArray(profile.expertise) && profile.expertise.length > 0) {
        profile.expertise = { isPrivate: true, count: profile.expertise.length };
      }
      if (privacy.awards === false && Array.isArray(profile.awards) && profile.awards.length > 0) {
        profile.awards = { isPrivate: true, count: profile.awards.length };
      }
      if (privacy.publications === false && Array.isArray(profile.publications) && profile.publications.length > 0) {
        profile.publications = { isPrivate: true, count: profile.publications.length };
      }
      if (privacy.projects === false && Array.isArray(profile.projects) && profile.projects.length > 0) {
        profile.projects = { isPrivate: true, count: profile.projects.length };
      }
      if (privacy.ipr === false && Array.isArray(profile.ipr) && profile.ipr.length > 0) {
        profile.ipr = { isPrivate: true, count: profile.ipr.length };
      }
      if (privacy.thesesSupervised === false && Array.isArray(profile.thesesSupervised) && profile.thesesSupervised.length > 0) {
        profile.thesesSupervised = { isPrivate: true, count: profile.thesesSupervised.length };
      }
      if (privacy.professionalBodies === false && Array.isArray(profile.professionalBodies) && profile.professionalBodies.length > 0) {
        profile.professionalBodies = { isPrivate: true, count: profile.professionalBodies.length };
      }
      if (privacy.committees === false && Array.isArray(profile.committees) && profile.committees.length > 0) {
        profile.committees = { isPrivate: true, count: profile.committees.length };
      }

      userObj.profile = profile;
    }

    res.status(200).json(userObj);
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
  getFacultyAssignedInquiries,
  getRepositoryDepartments,
  getRepositoryDepartmentFaculties,
  getRepositoryDepartmentScholars,
  getRepositoryProfile
};
