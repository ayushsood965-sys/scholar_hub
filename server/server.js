require('dotenv').config();
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
const fs = require('fs');
const { seedUserData } = require('./seedUsersHelper');

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

// Connect to database
connectDB().then(async () => {
  console.log('✅ Database connected.');
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
        profileCompleted: true,
        profile: {
          email: 'admin@scholarsync.com',
          phoneNumber: '+91 99999-88888'
        }
      });
      console.log(`👑 Super Admin user auto-seeded (admin/${process.env.ADMIN_PASSWORD || 'password'})`);
    } else {
      console.log('👑 Super Admin user already exists.');
    }

    // Auto-seed departments if the collection is empty
    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      const departmentsToSeed = require('./utils/departmentsData');
      await Department.insertMany(departmentsToSeed);
      console.log('🏛️ Auto-seeded default departments successfully.');
    } else {
      console.log('🏛️ Departments already populated.');
    }

    // Auto-seed research labs, funding opportunities, and events
    const ResearchLab = require('./models/ResearchLab');
    const FundingOpportunity = require('./models/FundingOpportunity');
    const Event = require('./models/Event');

    const labCount = await ResearchLab.countDocuments();
    if (labCount === 0) {
      let leadUser = await User.findOne({ role: 'FACULTY' });
      if (!leadUser) {
        leadUser = await User.findOne({ username: 'admin' });
      }
      
      if (leadUser) {
        const labsToSeed = [
          {
            name: "AI & Neural Systems Laboratory",
            department: "Department of Computer Science",
            leadId: leadUser._id,
            focus: "Deep Learning, Autonomous Agents, NLP",
            projects: ["Transformers in Medical Imaging", "Reinforcement Learning for Autonomous Drone Swarms"],
            status: "Actively Recruiting Scholars"
          },
          {
            name: "Quantum Mechanics & Advanced Materials Lab",
            department: "Department of Physics",
            leadId: leadUser._id,
            focus: "Superconductors, Quantum Cryptography, Nanotubes",
            projects: ["High-Temp Superconductivity in Hydrides", "Quantum Cryptographic Protocol Validation"],
            status: "2 Research Slots Open"
          },
          {
            name: "Bio-Informatics & Genomics Centre",
            department: "Department of Data Science and Artificial Intelligence",
            leadId: leadUser._id,
            focus: "Cancer Genome Sequencing, Neural Protein Folding",
            projects: ["AlphaFold Pipelines for Enzyme Optimization", "High-Throughput DNA Sequence Alignment"],
            status: "Collaborating with Biotech Inc."
          },
          {
            name: "Chemical Kinetics & Environmental Synthesis Lab",
            department: "Department of Chemistry",
            leadId: leadUser._id,
            focus: "Green Catalysts, Photochemistry, CO2 Capture",
            projects: ["Organocatalytic Hydrogen Generation", "Solar-Driven Polymeric CO2 Sequestration"],
            status: "Grant Funded by DST-SERB"
          }
        ];
        await ResearchLab.insertMany(labsToSeed);
        console.log('🔬 Auto-seeded default research labs.');
      }
    }

    const fundingCount = await FundingOpportunity.countDocuments();
    if (fundingCount === 0) {
      const fundingToSeed = [
        {
          title: "DST-SERB Core Research Grant",
          agency: "Department of Science and Technology, Govt. of India",
          amount: "₹45,00,000",
          duration: "3 Years",
          scope: "Supports fundamental research in science, technology, and advanced AI frameworks.",
          status: "Applications Open"
        },
        {
          title: "ScholarSync Corporate Innovation Fellowship",
          agency: "Kizen Tech Corp",
          amount: "₹8,00,000 / Year + Stipend",
          duration: "Ongoing",
          scope: "Awarded to elite scholars focusing on industrial automation and cloud-native database orchestration.",
          status: "Actively Reviewing"
        },
        {
          title: "Global Green-Tech Council Research Grant",
          agency: "Global Green-Tech Alliance",
          amount: "$120,000",
          duration: "2 Years",
          scope: "Granted to breakthrough green chemistry, solar conversion, and environmental recycling concepts.",
          status: "Call Ends July 2026"
        }
      ];
      await FundingOpportunity.insertMany(fundingToSeed);
      console.log('💰 Auto-seeded default funding opportunities.');
    }
    const eventCount = await Event.countDocuments();
    if (eventCount === 0) {
      const eventsToSeed = [
        {
          title: "Annual University Research Symposium & Doctoral Colloquium 2026",
          date: new Date('2026-06-12T09:30:00'),
          time: "09:30 AM - 05:30 PM",
          location: "Auditorium & Virtual Stream",
          speaker: "Keynote: Dr. Andrew Ng (Co-Founder, Coursera & DeepLearning.AI)",
          type: "Conference"
        },
        {
          title: "Hands-on Workshop: Scalable Machine Learning Pipelines with PyTorch & Ray",
          date: new Date('2026-06-28T14:00:00'),
          time: "02:00 PM - 06:00 PM",
          location: "Data Science Lab-4",
          speaker: "Conducted by: Elena Rostova & Core AI Faculty",
          type: "Workshop"
        }
      ];
      await Event.insertMany(eventsToSeed);
      console.log('📅 Auto-seeded default events.');
    }

    // Auto-seed default doctoral projects
    const DoctoralProject = require('./models/DoctoralProject');
    const projectCount = await DoctoralProject.countDocuments();
    if (projectCount === 0) {
      const projectsToSeed = [
        {
          title: "Neural Machine Translation for Low-Resource Languages",
          department: "Department of Computer Science Engineering",
          abstract: "Investigating unsupervised pre-training techniques and multilingual adapter modules to improve translation accuracy for regional dialects.",
          scholarName: "Piyush Sharma",
          supervisorName: "Dr. Mahinder Singh",
          status: "Awarded"
        },
        {
          title: "Secure Distributed Ledger Orchestration for Smart Grids",
          department: "Department of Electrical Engineering",
          abstract: "Designing consensus mechanisms and lightweight cryptographic architectures for real-time peer-to-peer energy trading in smart grids.",
          scholarName: "Aditya Verma",
          supervisorName: "Dr. Rajesh Kumar",
          status: "Awarded"
        },
        {
          title: "Synthesizing Novel Biocompatible Catalysts for Green Hydrogen Production",
          department: "Department of Chemistry",
          abstract: "Leveraging organic co-polymers and transition-metal nanoparticles to construct stable and highly efficient water-splitting catalysts.",
          scholarName: "Sneha Patel",
          supervisorName: "Dr. Anjali Mehta",
          status: "Awarded"
        },
        {
          title: "Applying Deep Learning to Cancer Genomics and Protein Folding",
          department: "Department of Data Science and Artificial Intelligence",
          abstract: "Utilizing transformer architectures and multimodal sequence embeddings to predict protein-protein interaction interfaces and accelerate enzyme design.",
          scholarName: "Rohan Das",
          supervisorName: "Dr. Vikram Malhotra",
          status: "Awarded"
        }
      ];
      await DoctoralProject.insertMany(projectsToSeed);
      console.log('🎓 Auto-seeded default doctoral projects.');
    }

    // Auto-seed default collaboration calls
    const CollaborationCall = require('./models/CollaborationCall');
    const callCount = await CollaborationCall.countDocuments();
    if (callCount === 0) {
      const callsToSeed = [
        {
          title: "Call for Industry Mentors: AI in Agriculture",
          description: "Department of Computer Science is seeking domain partners to guide Ph.D. scholars on crop disease detection frameworks.",
          type: "Industry Partner",
          department: "Department of Computer Science",
          status: "Active"
        },
        {
          title: "Inter-Dept Initiative: Materials Science & Physics",
          description: "Joint grant proposal for high-energy battery substrates. Seeking specialized mathematical modelers.",
          type: "Inter-Departmental",
          department: "Department of Physics",
          status: "Active"
        }
      ];
      await CollaborationCall.insertMany(callsToSeed);
      console.log(' Auto-seeded default collaboration calls.');
    }

    // Auto-seed category and gender masters
    const CategoryGenderMaster = require('./models/CategoryGenderMaster');
    const cgCount = await CategoryGenderMaster.countDocuments();
    if (cgCount === 0) {
      const categoryGenderToSeed = [
        { type: 'GENDER', label: 'Male', value: 'Male', sortOrder: 1 },
        { type: 'GENDER', label: 'Female', value: 'Female', sortOrder: 2 },
        { type: 'GENDER', label: 'Other', value: 'Other', sortOrder: 3 },
        { type: 'CATEGORY', label: 'General / Unreserved', value: 'General', sortOrder: 1 },
        { type: 'CATEGORY', label: 'OBC (Other Backward Classes)', value: 'OBC', sortOrder: 2 },
        { type: 'CATEGORY', label: 'SC (Scheduled Caste)', value: 'SC', sortOrder: 3 },
        { type: 'CATEGORY', label: 'ST (Scheduled Tribe)', value: 'ST', sortOrder: 4 },
        { type: 'CATEGORY', label: 'EWS (Economically Weaker Section)', value: 'EWS', sortOrder: 5 },
      ];
      await CategoryGenderMaster.insertMany(categoryGenderToSeed);
      console.log('️ Auto-seeded default category and gender masters.');
    } else {
      console.log('️ Category and gender masters already populated.');
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

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://scholar-track-ayush.vercel.app',
  'https://scholar-sync-ayush.vercel.app'
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

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/thesis', thesisRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/departments', departmentRoutes);
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
    // Seed Departments
    const departmentsToSeed = require('./utils/departmentsData');

    let deptsAdded = 0;
    for (const d of departmentsToSeed) {
      const exists = await Department.findOne({ $or: [{ name: d.name }, { code: d.code }] });
      if (!exists) {
        await Department.create(d);
        deptsAdded++;
      }
    }

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
        { name: 'Departments Seeded', status: `Seeded ${deptsAdded} new departments.` },
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
