require('dotenv').config();
// Build Cache Test - 2026-07-15T02:41:00Z
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const thesisRoutes = require('./routes/thesisRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const lifecycleRoutes = require('./routes/lifecycleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const publicationRoutes = require('./routes/publicationRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const additionalDocumentRoutes = require('./routes/additionalDocumentRoutes');
const publicRoutes = require('./routes/publicRoutes');
const adminConfigRoutes = require('./routes/adminConfigRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const seedRoutes = require('./routes/seedRoutes');
const studentMappingRoutes = require('./routes/studentMappingRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const installLogRoutes = require('./routes/installLogRoutes');
const fs = require('fs');
const { seedUserData } = require('./seedUsersHelper');
const { connectRedis } = require('./config/redis');
const cacheMiddleware = require('./middleware/cacheMiddleware');

const cookieParser = require('cookie-parser');

const User = require('./models/User');
const Thesis = require('./models/Thesis');
const Milestone = require('./models/Milestone');
const Publication = require('./models/Publication');
const RACReview = require('./models/RACReview');
const ChangeRequest = require('./models/ChangeRequest');
const DRCMeeting = require('./models/DRCMeeting');
const Department = require('./models/Department');
const Notification = require('./models/Notification');

const app = express();
app.set('trust proxy', true);

// Connect to database
connectDB().then(async () => {
  console.log('✅ Database connected.');
  await connectRedis();
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'Super Administrator',
        username: 'admin',
        password: process.env.ADMIN_PASSWORD || 'password',
        role: 'SUPER_ADMIN',
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
        profileCompleted: true,
        profile: {
          email: 'admin@scholarsync.com',
          phoneNumber: '+91 99999-88888'
        }
      });
      console.log('👑 Super Admin user auto-seeded (admin/********)');
    } else {
      console.log('👑 Super Admin user already exists.');
    }



    // Auto-seed research labs, funding opportunities, events, partnerships, and calls
    const ResearchLab = require('./models/ResearchLab');
    const FundingOpportunity = require('./models/FundingOpportunity');
    const Event = require('./models/Event');
    const Partnership = require('./models/Partnership');
    const CollaborationCall = require('./models/CollaborationCall');
    const DoctoralProject = require('./models/DoctoralProject');

    let leadUser = await User.findOne({ role: 'FACULTY' });
    if (!leadUser) {
      leadUser = await User.findOne({ username: 'admin' });
    }

    const labCount = await ResearchLab.countDocuments();
    if (labCount === 0 && leadUser) {
      const labsToSeed = [
        {
          name: "Computational Intelligence & AI Lab",
          department: "Department of Computer Science",
          leadId: leadUser._id,
          focus: "Machine Learning, NLP, Computer Vision",
          projects: ["Unsupervised Dialect Translation", "Real-time Edge Intelligence"],
          status: "Actively Recruiting Scholars",
          description: "Focuses on developing next-generation language models and computer vision pipelines for regional applications.",
          researchAreas: ["Machine Learning", "NLP", "Computer Vision"],
          equipment: [
            { name: "NVIDIA RTX 4090 Workstation", description: "Deep learning model training", isShared: true },
            { name: "Edge AI Kits", description: "IoT deployment testing", isShared: false }
          ],
          website: "https://ai.hpushimla.in",
          location: "Room 304, Multi-Faculty Science Block",
          imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
          contactEmail: "ailab@hpu.ac.in",
          labType: "Departmental",
          fundingSupport: ["DST-SERB", "UGC"],
          establishedYear: 2020
        },
        {
          name: "Centre for Green Energy & Nano Technology",
          department: "Department of Physics",
          leadId: leadUser._id,
          focus: "Solar Cells, Nanomaterials, Quantum Dot Syntheses",
          projects: ["Perovskite Solar Cell Optimization", "Nanoparticle Thin Film Gas Sensors"],
          status: "2 Research Slots Open",
          description: "Synthesizing and characterizing novel nanomaterials to create highly efficient, low-cost solar panels.",
          researchAreas: ["Solar energy materials", "Nanotechnology"],
          equipment: [
            { name: "UV-Vis Spectrophotometer", description: "Absorption spectra logging", isShared: true },
            { name: "Spin Coater", description: "Thin-film deposition", isShared: false }
          ],
          website: "https://nanotech.hpushimla.in",
          location: "Ground Floor, Physics Block",
          imageUrl: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80",
          contactEmail: "nanotech@hpu.ac.in",
          labType: "Centre of Excellence",
          fundingSupport: ["HIMCOSTE", "DST-FIST"],
          establishedYear: 2019
        },
        {
          name: "Bioinformatics Centre",
          department: "Department of Bio Technology",
          leadId: leadUser._id,
          focus: "Genomics, Proteomics, Molecular Docking",
          projects: ["Himalayan Flora Gene Sequencing", "Protein Folding for Cold-Adapted Enzymes"],
          status: "Collaborating with Biotech Inc.",
          description: "Applying computational algorithms to biological datasets to discover novel therapeutics from Himalayan medicinal plants.",
          researchAreas: ["Genomics", "Structural Bioinformatics"],
          equipment: [
            { name: "High-Performance Compute Cluster", description: "Sequence alignment and molecular simulations", isShared: true }
          ],
          website: "https://bioinfo.hpushimla.in",
          location: "Room 102, Biotech Building",
          imageUrl: "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=800&q=80",
          contactEmail: "bioinfo@hpu.ac.in",
          labType: "Central Instrumentation",
          fundingSupport: ["DBT", "RUSA"],
          establishedYear: 2021
        },
        {
          name: "Molecular & Forensic Genetics Lab",
          department: "Department of Forensic Science",
          leadId: leadUser._id,
          focus: "DNA Fingerprinting, Crime Genetics",
          projects: ["DNA Profile Standards for Himachali Populations"],
          status: "Actively Recruiting Scholars",
          description: "Establishes population-level genetic databases for forensic investigations and human identification projects.",
          researchAreas: ["Forensic Genetics", "DNA Phenotyping"],
          equipment: [
            { name: "PCR Thermocycler", description: "DNA amplification", isShared: true },
            { name: "Genetic Analyzer", description: "Capillary electrophoresis sequencing", isShared: false }
          ],
          website: "https://forensic.hpushimla.in",
          location: "Room 205, Biotech Building",
          imageUrl: "https://images.unsplash.com/photo-1530210120071-01b5140b943d?auto=format&fit=crop&w=800&q=80",
          contactEmail: "forensiclab@hpu.ac.in",
          labType: "Departmental",
          fundingSupport: ["University Grant", "State Police Dept"],
          establishedYear: 2022
        }
      ];
      await ResearchLab.insertMany(labsToSeed);
      console.log('🔬 Auto-seeded HPU-specific research labs.');
    }

    const fundingCount = await FundingOpportunity.countDocuments();
    if (fundingCount === 0) {
      const fundingToSeed = [
        {
          title: "UGC-NET JRF Fellowship 2026-27",
          agency: "University Grants Commission (UGC)",
          amount: "₹37,000 / Month + HRA",
          duration: "5 Years",
          scope: "Provides financial assistance to NET JRF qualified doctoral scholars in all streams.",
          status: "Applications Open",
          type: "Fellowship",
          eligibilityDepartments: [],
          eligibilityCriteria: "UGC-NET JRF qualified, registered full-time Ph.D. scholar.",
          applicationUrl: "https://scholarships.gov.in",
          contactEmail: "ugcjrf@hpu.ac.in",
          documentsRequired: ["NET JRF Award Letter", "Admission Receipt", "Supervisor Joining Report"],
          fundingBody: "UGC",
          recurrence: "Monthly"
        },
        {
          title: "CSIR-NET JRF for Sciences",
          agency: "Council of Scientific & Industrial Research (CSIR)",
          amount: "₹37,00,000 (Total Pool)",
          duration: "5 Years",
          scope: "Fellowship for researchers pursuing science streams (Chemistry, Physics, Biotech).",
          status: "Applications Open",
          type: "Fellowship",
          eligibilityDepartments: ["Department of Chemistry", "Department of Physics", "Department of Bio Sciences", "Department of Bio Technology"],
          eligibilityCriteria: "CSIR-NET JRF qualified.",
          applicationUrl: "https://csirhrdg.res.in",
          contactEmail: "csirjrf@hpu.ac.in",
          documentsRequired: ["CSIR JRF Award Letter", "Annual Progress Report"],
          fundingBody: "CSIR",
          recurrence: "Monthly"
        },
        {
          title: "DST-SERB Core Research Grant (CRG)",
          agency: "Science and Engineering Research Board (SERB), DST",
          amount: "₹45,00,000",
          duration: "3 Years",
          scope: "Funding for core research proposals in all fields of Science and Technology.",
          status: "Applications Open",
          type: "Project Grant",
          eligibilityDepartments: [],
          eligibilityCriteria: "Faculty Principal Investigator with full-time Ph.D. scholars.",
          applicationUrl: "https://serbonline.in",
          contactEmail: "serb@hpu.ac.in",
          documentsRequired: ["Detailed Research Proposal", "Budget Endorsement", "PI Bio-Data"],
          fundingBody: "SERB",
          recurrence: "Project-based"
        },
        {
          title: "HIMCOSTE R&D Project Grant",
          agency: "HP State Council for Science, Technology & Environment",
          amount: "₹8,00,000",
          duration: "2 Years",
          scope: "Supports R&D projects with local relevance to Himachal Pradesh (biodiversity, ecology, tech).",
          status: "Applications Open",
          type: "Project Grant",
          eligibilityDepartments: ["Department of Bio Sciences", "Department of Bio Technology", "Department of Environmental Science", "Department of Geography"],
          eligibilityCriteria: "Research projects addressing HP-specific ecological or developmental problems.",
          applicationUrl: "http://himcoste.hp.gov.in",
          contactEmail: "himcoste@hp.gov.in",
          documentsRequired: ["HPU Endorsement Form", "Proposal Pitch", "Budget Template"],
          fundingBody: "HIMCOSTE",
          recurrence: "Project-based"
        },
        {
          title: "HP State Research Fellowship",
          agency: "Government of Himachal Pradesh",
          amount: "₹20,000 / Month",
          duration: "3 Years",
          scope: "Fellowship for Himachali domicile scholars who do not receive any other financial support.",
          status: "Applications Open",
          type: "State Scholarship",
          eligibilityDepartments: [],
          eligibilityCriteria: "HP Domicile, Non-JRF registered Ph.D. scholar.",
          applicationUrl: "https://hp.gov.in/scholarships",
          contactEmail: "statefellowship@hpu.ac.in",
          documentsRequired: ["Domicile Certificate", "Non-Fellowship Affidavit", "Bonafide Himachali Proof"],
          fundingBody: "HP State Govt",
          recurrence: "Monthly"
        }
      ];
      await FundingOpportunity.insertMany(fundingToSeed);
      console.log('💰 Auto-seeded HPU-specific funding opportunities.');
    }

    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      const eventsToSeed = [
        {
          title: "HPU Annual University Research Symposium & Doctoral Colloquium 2026",
          date: new Date('2026-09-12T09:30:00'),
          time: "09:30 AM - 05:30 PM",
          location: "Auditorium & Virtual Stream, HPU Summer Hill",
          speaker: "Keynote: Prof. C.N.R. Rao (Bharat Ratna, Solid State Scientist)",
          type: "Conference"
        },
        {
          title: "Workshop: High-Performance Computing Tools for Academic Data Modeling",
          date: new Date('2026-10-18T14:00:00'),
          time: "02:00 PM - 06:00 PM",
          location: "Computational Intelligence Lab, Room 304",
          speaker: "Conducted by: Core IT Faculty & CDAC Experts",
          type: "Workshop"
        }
      ];
      await Event.insertMany(eventsToSeed);
      console.log('📅 Auto-seeded HPU-specific events.');
    }

    const projectCount = await DoctoralProject.countDocuments();
    if (projectCount === 0) {
      const projectsToSeed = [
        {
          title: "Neural Machine Translation for Western Pahari Dialects",
          department: "Department of Computer Science",
          abstract: "Investigating unsupervised pre-training techniques and multilingual adapter modules to improve translation accuracy for regional dialects of Himachal Pradesh.",
          scholarName: "Piyush Sharma",
          supervisorName: "Dr. Mahinder Singh",
          status: "ACTIVE_RESEARCH"
        },
        {
          title: "Advanced Solar Perovskite Thin-Films for High Altitude Performance",
          department: "Department of Physics",
          abstract: "Designing and analyzing quantum dot solar cell architectures optimized for high ultraviolet exposure and sub-zero temperature environments.",
          scholarName: "Aditya Verma",
          supervisorName: "Dr. Rajesh Kumar",
          status: "ACTIVE_RESEARCH"
        }
      ];
      await DoctoralProject.insertMany(projectsToSeed);
      console.log('🎓 Auto-seeded HPU doctoral projects.');
    }

    const callCount = await CollaborationCall.countDocuments();
    if (callCount === 0) {
      const callsToSeed = [
        {
          title: "Industry Co-Supervision for PhD in Pahari Language Processing",
          description: "Department of Computer Science is seeking industry partners or language scholars to co-supervise research on pahari dialect NLP pipelines.",
          type: "Industry Partner",
          department: "Department of Computer Science",
          status: "Active",
          partnerType: "Industry",
          fundingAmount: "Negotiable",
          contactPerson: "Dr. Mahinder Singh",
          contactEmail: "msingh@hpu.ac.in",
          eligibleDepartments: ["Department of Computer Science", "Department of English"],
          outcomes: ["Joint Pahari Text Corpus", "Pahari NLP Tool Library"]
        },
        {
          title: "Joint Research Call: Apple Crop Disease Analytics using Drone Imaging",
          description: "Seeking collaboration from agricultural institutes to build automatic Apple scab and blight classification models.",
          type: "Inter-Departmental",
          department: "Department of Computer Science",
          status: "Active",
          partnerType: "Academic",
          fundingAmount: "₹5,00,000 Seed Fund",
          contactPerson: "Dr. Rajesh Kumar",
          contactEmail: "rkumar@hpu.ac.in",
          eligibleDepartments: ["Department of Computer Science", "Department of Bio Sciences", "Department of Bio Technology"],
          outcomes: ["Drone Image Dataset of Apple Orchards", "Disease Detection Mobile App"]
        }
      ];
      await CollaborationCall.insertMany(callsToSeed);
      console.log('🤝 Auto-seeded HPU collaboration calls.');
    }

    const partnershipCount = await Partnership.countDocuments();
    if (partnershipCount === 0) {
      const partnershipsToSeed = [
        {
          partnerName: "Indian Army (ARTRAC Shimla)",
          partnerType: "Defense",
          title: "MoU for Joint R&D in Drone Technology, Cybersecurity & Himalayan Ecology",
          description: "Strategic research agreement to co-develop security architectures for high-altitude communications and drone navigation in mountain terrains.",
          departments: ["Department of Computer Science", "Department of Physics", "Department of Environmental Science"],
          startDate: new Date('2025-11-10'),
          outcomes: ["Secure high-altitude routing protocol", "Joint mountain terrain GIS mapping"],
          status: "ACTIVE",
          contactPerson: "Dean of Research, HPU",
          contactEmail: "deanresearch@hpu.ac.in"
        },
        {
          partnerName: "Cosmo Ferrites Limited",
          partnerType: "Industry",
          title: "MoU for Collaborative Green Energy & Soft Magnetic Materials Research",
          description: "Partnership focused on industrial syntheses of manganese-zinc and nickel-zinc ferrites for energy-efficient transformers.",
          departments: ["Department of Physics", "Department of Chemistry"],
          startDate: new Date('2025-06-01'),
          outcomes: ["Co-developed high-frequency magnetic substrates", "PhD industrial internships"],
          status: "ACTIVE",
          contactPerson: "Prof. Rajesh Kumar",
          contactEmail: "rkumar@hpu.ac.in"
        },
        {
          partnerName: "DRDO (Institute of Nuclear Medicine & Allied Sciences)",
          partnerType: "Government",
          title: "Collaborative Biomedical Research and Resource Sharing Agreement",
          description: "Provides HPU doctoral scholars shared access to advanced instrumentation labs for cold-adapted molecular research.",
          departments: ["Department of Bio Sciences", "Department of Bio Technology", "Department of Chemistry"],
          startDate: new Date('2025-08-15'),
          outcomes: ["Shared lab access logs", "2 joint patent applications in bio-preservation"],
          status: "ACTIVE",
          contactPerson: "Prof. Anjali Mehta",
          contactEmail: "amehta@hpu.ac.in"
        }
      ];
      await Partnership.insertMany(partnershipsToSeed);
      console.log('🤝 Auto-seeded HPU partnerships.');
    }


  } catch (err) {
    console.error('❌ Error during auto-seeding:', err);
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allowed inline scripts/styles in /clear-all and /seed templates
}));
app.use(cookieParser());

// Custom NoSQL Query Sanitizer for Express 5 Compatibility
const sanitizeObject = (obj) => {
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitizeObject(obj[key]);
      }
    });
  }
};
app.use((req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
});

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175'
    ];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for sensitive routes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 login requests per 15 minutes
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/login', loginLimiter);
app.use('/api/seed-users', loginLimiter);
app.use('/api/clear-all', loginLimiter);

// Global API rate limiting to protect against DDoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per 15 minutes
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', cacheMiddleware(300));
app.use('/api/auth', authRoutes);
app.use('/api/thesis', thesisRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/lifecycle', lifecycleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/publications', publicationRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/additional-documents', additionalDocumentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/config', adminConfigRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/student-mapping', studentMappingRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/install-logs', installLogRoutes);

// Health check endpoint for UptimeRobot
app.get('/api/health', (req, res) => {
  res.status(200).send('Server is awake');
});

// -------------------------------------------------------------
// SYSTEM UTILITY ROUTES (/clear-all & /seed)
// -------------------------------------------------------------

const UTILITY_PASSWORD = process.env.UTILITY_PASSWORD || 'Ayush1994*';

// HTML Template Helper for stunning Glassmorphic UI
const { renderAdminPage } = require('./utils/adminPageTemplate');

// GET Route handlers
const handleClearAllGet = (req, res) => {
  res.send(renderAdminPage('clear', req.query.error));
};

const handleSeedGet = (req, res) => {
  res.send(renderAdminPage('seed', req.query.error));
};

// POST Route handlers
const handleClearAllPost = async (req, res) => {
  const { password } = req.body;
  const isApi = req.xhr || req.headers.accept?.indexOf('json') > -1;

  if (password !== UTILITY_PASSWORD) {
    if (isApi) {
      return res.status(401).json({ success: false, message: 'Invalid utility password.' });
    }
    return res.redirect('/clear-all?error=Invalid%20Utility%20Password');
  }

  try {
    // Clear all Mongoose database collections
    const userRes = await User.deleteMany({});
    const thesisRes = await Thesis.deleteMany({});
    const milestoneRes = await Milestone.deleteMany({});
    const pubRes = await Publication.deleteMany({});
    const racRes = await RACReview.deleteMany({});
    const changeRes = await ChangeRequest.deleteMany({});
    const drcRes = await DRCMeeting.deleteMany({});
    const deptRes = await Department.deleteMany({});
    const notifRes = await Notification.deleteMany({});

    // Delete PDF and DOCX files in uploads/
    const path = require('path');
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, 'uploads');
    let deletedFiles = [];
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (ext === '.pdf' || ext === '.docx') {
          fs.unlinkSync(path.join(uploadsDir, file));
          deletedFiles.push(file);
        }
      }
    }

    const successData = {
      records: [
        { name: 'Users', count: userRes.deletedCount },
        { name: 'Theses', count: thesisRes.deletedCount },
        { name: 'Milestones', count: milestoneRes.deletedCount },
        { name: 'Publications', count: pubRes.deletedCount },
        { name: 'RAC Reviews', count: racRes.deletedCount },
        { name: 'Change Requests', count: changeRes.deletedCount },
        { name: 'DRC Meetings', count: drcRes.deletedCount },
        { name: 'Departments', count: deptRes.deletedCount },
        { name: 'Notifications', count: notifRes.deletedCount }
      ],
      files: deletedFiles
    };

    if (isApi) {
      return res.json({ success: true, message: 'Database reset and clean completed successfully.', ...successData });
    }

    res.send(renderAdminPage('clear', '', successData));
  } catch (err) {
    console.error('Error clearing database:', err);
    if (isApi) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.redirect(`/clear-all?error=${encodeURIComponent(err.message)}`);
  }
};

const handleSeedPost = async (req, res) => {
  const { password } = req.body;
  const isApi = req.xhr || req.headers.accept?.indexOf('json') > -1;

  if (password !== UTILITY_PASSWORD) {
    if (isApi) {
      return res.status(401).json({ success: false, message: 'Invalid utility password.' });
    }
    return res.redirect('/seed?error=Invalid%20Utility%20Password');
  }

  try {
    // Ensure Super Admin exists
    const adminExists = await User.findOne({ username: 'admin' });
    let adminStatus = 'Super Admin already exists.';
    if (!adminExists) {
      const adminPass = process.env.ADMIN_PASSWORD || 'admin';
      await User.create({
        name: 'Super Administrator',
        username: 'admin',
        password: adminPass,
        role: 'SUPER_ADMIN',
        isActive: true,
        isVerified: true,
        profileCompleted: true
      });
      adminStatus = `Super Admin user auto-seeded (admin/${adminPass}).`;
    }

    const successData = {
      seeded: [
        { name: 'Super Administrator', status: adminStatus }
      ]
    };

    if (isApi) {
      return res.json({ success: true, message: 'Database seeding completed successfully.', ...successData });
    }

    res.send(renderAdminPage('seed', '', successData));
  } catch (err) {
    console.error('Seeding error:', err);
    if (isApi) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.redirect(`/seed?error=${encodeURIComponent(err.message)}`);
  }
};

const handleSeedUsersGet = (req, res) => {
  res.send(renderAdminPage('seed-users', req.query.error));
};

const handleSeedUsersPost = async (req, res) => {
  const { password, selectedDepartments, studentCount, facultyCount } = req.body;
  const isApi = req.xhr || req.headers.accept?.indexOf('json') > -1;

  if (password !== UTILITY_PASSWORD) {
    if (isApi) {
      return res.status(401).json({ success: false, message: 'Invalid utility password.' });
    }
    return res.redirect('/seed-users?error=Invalid%20Utility%20Password');
  }

  try {
    const seedResult = await seedUserData(selectedDepartments, studentCount, facultyCount);
    
    const successData = {
      records: [
        { name: 'Users Created', count: seedResult.users },
        { name: 'Theses Created', count: seedResult.theses },
        { name: 'Milestones Created', count: seedResult.milestones },
        { name: 'RAC Reviews Created', count: seedResult.reviews },
        { name: 'Publications Created', count: seedResult.publications },
        { name: 'DRC Meetings Created', count: seedResult.meetings }
      ]
    };

    if (isApi) {
      return res.json({ success: true, message: 'User seeding completed successfully.', ...successData });
    }

    res.send(renderAdminPage('seed-users', '', successData));
  } catch (err) {
    console.error('User seeding error:', err);
    if (isApi) {
      return res.status(500).json({ success: false, message: err.message });
    }
    res.redirect(`/seed-users?error=${encodeURIComponent(err.message)}`);
  }
};

const { protect, authorize } = require('./middleware/authMiddleware');

// API endpoints for system utilities (Protected behind JWT + SUPER_ADMIN)
app.post('/api/clear-all', protect, authorize('SUPER_ADMIN'), handleClearAllPost);
app.post('/api/seed', protect, authorize('SUPER_ADMIN'), handleSeedPost);
app.post('/api/seed-users', protect, authorize('SUPER_ADMIN'), handleSeedUsersPost);


const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app, server };

