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
const emailLogRoutes = require('./routes/emailLogRoutes');
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
app.set('trust proxy', 1);

// Connect to database
connectDB().then(async () => {
  console.log('✅ Database connected.');
  await connectRedis();

  // Start the background email worker
  const { startEmailWorker } = require('./utils/emailWorker');
  startEmailWorker();

  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'Super Administrator',
        username: 'admin',
        password: process.env.ADMIN_PASSWORD || (() => { throw new Error('ADMIN_PASSWORD environment variable must be set in production'); })(),
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
app.use('/api/email-logs', emailLogRoutes);

// Health check endpoint for UptimeRobot
app.get('/api/health', (req, res) => {
  res.status(200).send('Server is awake');
});

// -------------------------------------------------------------
// SYSTEM UTILITY ROUTES (/clear-all & /seed)
// -------------------------------------------------------------

const UTILITY_PASSWORD = process.env.UTILITY_PASSWORD || (() => { throw new Error('UTILITY_PASSWORD environment variable must be configured in environment'); })();

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

