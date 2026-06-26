require('dotenv').config();
const express = require('express');
const cors = require('cors');
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
        password: 'password',
        role: 'SUPER_ADMIN',
        isActive: true,
        isVerified: true,
        profileCompleted: true,
        profile: {
          email: 'admin@scholarsync.com',
          phoneNumber: '+91 99999-88888'
        }
      });
      console.log('👑 Super Admin user auto-seeded (admin/password)');
    } else {
      console.log('👑 Super Admin user already exists.');
    }

    // Auto-seed departments if the collection is empty
    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      const departmentsToSeed = [
        { name: 'Department of Chemistry', code: 'CHEM' },
        { name: 'Department of Computer Science', code: 'CS' },
        { name: 'Department of Data Science and Artificial Intelligence', code: 'DSAI' },
        { name: 'Department of Electronics', code: 'ELEX' },
        { name: 'Department of Geography', code: 'GEOG' },
        { name: 'Department of Mathematics', code: 'MATH' },
        { name: 'Department of Physics', code: 'PHYS' },
        { name: 'Department of Archaeology (Ancient History & Archaeology)', code: 'ARCH' },
        { name: 'Department of Defence and Strategic Studies', code: 'DSS' },
        { name: 'Department of Economics', code: 'ECON' },
        { name: 'Department of History', code: 'HIST' },
        { name: 'Department of Journalism and Mass Communications', code: 'JMC' },
        { name: 'Department of Library and Information Science', code: 'LIS' },
        { name: 'Department of Life Long Learning', code: 'LLL' },
        { name: 'Department of Political Science', code: 'POL' },
        { name: 'Department of Population Studies', code: 'POPS' },
        { name: 'Department of Psychology', code: 'PSY' },
        { name: 'Department of Public Administration', code: 'PA' },
        { name: 'Department of Sociology and Social Work', code: 'SSW' },
        { name: 'Department of Yoga Studies', code: 'YS' },
        { name: 'Department of Bio Sciences', code: 'BIOS' },
        { name: 'Department of Bio Technology', code: 'BIOT' },
        { name: 'Department of Environmental Science', code: 'ENVS' },
        { name: 'Department of Forensic Science', code: 'FORS' },
        { name: 'Department of Microbiology', code: 'MICRO' },
        { name: 'Centre for Buddhist Studies', code: 'CBS' },
        { name: 'Department of English', code: 'ENG' },
        { name: 'Department of Hindi', code: 'HIN' },
        { name: 'Department of Modern European and Foreign Languages', code: 'MEFL' },
        { name: 'Department of Sanskrit', code: 'SKT' },
        { name: 'Department of Applied Sciences & Humanities', code: 'ASH' },
        { name: 'Department of Civil Engineering', code: 'CIVIL' },
        { name: 'Department of Computer Science Engineering', code: 'CSE' },
        { name: 'Department of Electrical Engineering', code: 'EE' },
        { name: 'Department of Electronics and Communication', code: 'ECE' },
        { name: 'Department of Information Technology', code: 'IT' },
        { name: 'Department of Commerce', code: 'COMM' },
        { name: 'Institute of Vocational Studies', code: 'IVS' },
        { name: 'International Institute of Management Studies (HPU Business School)', code: 'IIMS' },
        { name: 'Department of Education', code: 'EDU' },
        { name: 'Department of Physical Education', code: 'PE' },
        { name: 'Department of Teacher Education', code: 'TE' },
        { name: 'Department of Performing Arts (Music, Dance, and Dramatics)', code: 'DPA' },
        { name: 'Department of Visual Arts (Painting, Commercial Art, and Sculpture)', code: 'DVA' },
        { name: 'Department of Law', code: 'LAW' },
        { name: 'Department of Interdisciplinary Studies', code: 'IDS' }
      ];
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
      console.log('📢 Auto-seeded default collaboration calls.');
    }
  } catch (err) {
    console.error('❌ Error during auto-seeding:', err);
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const UTILITY_PASSWORD = 'Ayush1994*';

// HTML Template Helper for stunning Glassmorphic UI
const renderAdminPage = (type, error = '', successData = null) => {
  const isClear = type === 'clear';
  const isSeedUsers = type === 'seed-users';
  const title = isClear ? 'System Clean Portal' : isSeedUsers ? 'User Seeding Portal' : 'System Seeding Portal';
  const primaryColor = isClear ? '#ef4444' : isSeedUsers ? '#3b82f6' : '#10b981';
  const accentGradient = isClear 
    ? 'linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%)' 
    : isSeedUsers
    ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)'
    : 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)';
  const shadowGlow = isClear 
    ? 'rgba(239, 68, 68, 0.25)' 
    : isSeedUsers
    ? 'rgba(59, 130, 246, 0.25)'
    : 'rgba(16, 185, 129, 0.25)';
  const description = isClear
    ? 'Deletes all records from the database and removes all uploaded PDF/DOCX files. This action resets the portal to a fresh state and is irreversible.'
    : isSeedUsers
    ? 'Seeds the database with 10 students, 5 faculties, and 1 HOD in each department (730+ users), complete with full historical milestones, RAC reviews, DRC meetings, and publications using sample.pdf.'
    : 'Seeds the database with academic departments.';

  let contentHtml = '';

  if (successData) {
    // Show beautiful success page
    contentHtml = `
      <div class="success-icon" style="background: ${primaryColor}20; color: ${primaryColor};">
        ${isClear ? '🧹' : isSeedUsers ? '👥' : '🌱'}
      </div>
      <h2>${isClear ? 'System Reset Complete!' : isSeedUsers ? 'User Seeding Complete!' : 'System Seeded Successfully!'}</h2>
      <p class="desc" style="margin-bottom: 24px;">The request was authorized and completed without errors.</p>
      
      <div class="results-box">
        <h3>Summary of Operations</h3>
        <ul>
          ${successData.records ? successData.records.map(r => `<li><span>${r.name}</span><strong>${r.count ? r.count : 0} ${isClear ? 'deleted' : 'created'}</strong></li>`).join('') : ''}
          ${successData.seeded ? successData.seeded.map(s => `<li><span>${s.name}</span><strong>${s.status}</strong></li>`).join('') : ''}
        </ul>
        
        ${successData.files && successData.files.length > 0 ? `
          <h3 style="margin-top: 20px;">Deleted Document Files (${successData.files.length})</h3>
          <div class="files-scroll">
            ${successData.files.map(f => `<div class="file-tag">📄 ${f}</div>`).join('')}
          </div>
        ` : ''}
      </div>

      <a href="/" class="btn" style="background: ${accentGradient}; text-align: center; text-decoration: none; display: block; margin-top: 24px; box-shadow: 0 4px 14px ${shadowGlow};">
        Return to Portal Home
      </a>
    `;
  } else {
    // Show password prompt form
    contentHtml = `
      <div class="success-icon" style="background: ${primaryColor}20; color: ${primaryColor};">
        ${isClear ? '⚠️' : isSeedUsers ? '🔑' : '⚙️'}
      </div>
      <h2>${title}</h2>
      <p class="desc">${description}</p>

      ${error ? `
        <div class="error-alert">
          <span>❌</span>
          <div style="flex: 1;">${error}</div>
        </div>
      ` : ''}

      <form method="POST" action="/${isClear ? 'clear-all' : isSeedUsers ? 'seed-users' : 'seed'}" id="action-form">
        <div class="input-group">
          <label for="password">Enter Security Password</label>
          <div style="position: relative;">
            <input type="password" name="password" id="password" placeholder="••••••••••••" required autocomplete="off" />
            <button type="button" class="toggle-password" id="toggle-pw-btn" onclick="togglePasswordVisibility()">Show</button>
          </div>
        </div>

        <button type="submit" class="btn" style="background: ${accentGradient}; box-shadow: 0 4px 14px ${shadowGlow};">
          ${isClear ? 'Execute Full Clean' : isSeedUsers ? 'Execute User Seeding' : 'Execute Seeding'}
        </button>
      </form>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} | ScholarSync Hub</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        }

        body {
          background: linear-gradient(135deg, #0b0f19 0%, #161e31 100%);
          color: #f1f5f9;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow-x: hidden;
        }

        /* Beautiful glowing orbs */
        .orb {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          filter: blur(80px);
          z-index: -1;
          opacity: 0.15;
        }
        .orb-1 {
          top: 10%;
          left: 10%;
          background: ${primaryColor};
        }
        .orb-2 {
          bottom: 10%;
          right: 10%;
          background: #3b82f6;
        }

        .card {
          backdrop-filter: blur(16px) saturate(180%);
          background: rgba(30, 41, 59, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          border-radius: 24px;
          width: 100%;
          max-width: 500px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .success-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          font-size: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          align-self: flex-start;
          animation: float 3s ease-in-out infinite;
        }

        h2 {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .desc {
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 32px;
          font-weight: 500;
        }

        .input-group {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94a3b8;
        }

        input[type="password"], input[type="text"] {
          width: 100%;
          padding: 16px;
          padding-right: 64px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          color: #ffffff;
          font-size: 15px;
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
        }

        input[type="password"]:focus, input[type="text"]:focus {
          border-color: ${primaryColor};
          box-shadow: 0 0 0 4px ${primaryColor}15;
          background: rgba(15, 23, 42, 0.8);
        }

        .toggle-password {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: color 0.2s;
        }
        .toggle-password:hover {
          color: #ffffff;
        }

        .btn {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 14px;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }

        .btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        .btn:active {
          transform: translateY(0);
        }

        .error-alert {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 24px;
          color: #fca5a5;
          font-size: 14px;
          display: flex;
          gap: 12px;
          align-items: center;
          font-weight: 500;
        }

        .results-box {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 8px;
        }

        .results-box h3 {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94a3b8;
          margin-bottom: 12px;
          font-weight: 700;
        }

        .results-box ul {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .results-box li {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
          padding-bottom: 6px;
        }

        .results-box li:last-child {
          border: none;
          padding: 0;
        }

        .results-box span {
          color: #cbd5e1;
        }

        .results-box strong {
          color: #ffffff;
          font-weight: 600;
        }

        .files-scroll {
          max-height: 120px;
          overflow-y: auto;
          margin-top: 10px;
          padding-right: 4px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .files-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .files-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        .file-tag {
          font-size: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          padding: 6px 10px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        @media (max-width: 480px) {
          .card {
            padding: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>

      <div class="card">
        ${contentHtml}
      </div>

      <script>
        function togglePasswordVisibility() {
          var input = document.getElementById("password");
          var btn = document.getElementById("toggle-pw-btn");
          if (input.type === "password") {
            input.type = "text";
            btn.textContent = "Hide";
          } else {
            input.type = "password";
            btn.textContent = "Show";
          }
        }
      </script>
    </body>
    </html>
  `;
};

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
    const departmentsToSeed = [
      { name: 'Department of Chemistry', code: 'CHEM' },
      { name: 'Department of Computer Science', code: 'CS' },
      { name: 'Department of Data Science and Artificial Intelligence', code: 'DSAI' },
      { name: 'Department of Electronics', code: 'ELEX' },
      { name: 'Department of Geography', code: 'GEOG' },
      { name: 'Department of Mathematics', code: 'MATH' },
      { name: 'Department of Physics', code: 'PHYS' },
      { name: 'Department of Archaeology (Ancient History & Archaeology)', code: 'ARCH' },
      { name: 'Department of Defence and Strategic Studies', code: 'DSS' },
      { name: 'Department of Economics', code: 'ECON' },
      { name: 'Department of History', code: 'HIST' },
      { name: 'Department of Journalism and Mass Communications', code: 'JMC' },
      { name: 'Department of Library and Information Science', code: 'LIS' },
      { name: 'Department of Life Long Learning', code: 'LLL' },
      { name: 'Department of Political Science', code: 'POL' },
      { name: 'Department of Population Studies', code: 'POPS' },
      { name: 'Department of Psychology', code: 'PSY' },
      { name: 'Department of Public Administration', code: 'PA' },
      { name: 'Department of Sociology and Social Work', code: 'SSW' },
      { name: 'Department of Yoga Studies', code: 'YS' },
      { name: 'Department of Bio Sciences', code: 'BIOS' },
      { name: 'Department of Bio Technology', code: 'BIOT' },
      { name: 'Department of Environmental Science', code: 'ENVS' },
      { name: 'Department of Forensic Science', code: 'FORS' },
      { name: 'Department of Microbiology', code: 'MICRO' },
      { name: 'Centre for Buddhist Studies', code: 'CBS' },
      { name: 'Department of English', code: 'ENG' },
      { name: 'Department of Hindi', code: 'HIN' },
      { name: 'Department of Modern European and Foreign Languages', code: 'MEFL' },
      { name: 'Department of Sanskrit', code: 'SKT' },
      { name: 'Department of Applied Sciences & Humanities', code: 'ASH' },
      { name: 'Department of Civil Engineering', code: 'CIVIL' },
      { name: 'Department of Computer Science Engineering', code: 'CSE' },
      { name: 'Department of Electrical Engineering', code: 'EE' },
      { name: 'Department of Electronics and Communication', code: 'ECE' },
      { name: 'Department of Information Technology', code: 'IT' },
      { name: 'Department of Commerce', code: 'COMM' },
      { name: 'Institute of Vocational Studies', code: 'IVS' },
      { name: 'International Institute of Management Studies (HPU Business School)', code: 'IIMS' },
      { name: 'Department of Education', code: 'EDU' },
      { name: 'Department of Physical Education', code: 'PE' },
      { name: 'Department of Teacher Education', code: 'TE' },
      { name: 'Department of Performing Arts (Music, Dance, and Dramatics)', code: 'DPA' },
      { name: 'Department of Visual Arts (Painting, Commercial Art, and Sculpture)', code: 'DVA' },
      { name: 'Department of Law', code: 'LAW' },
      { name: 'Department of Interdisciplinary Studies', code: 'IDS' }
    ];

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
      await User.create({
        name: 'Super Administrator',
        username: 'admin',
        password: 'admin',
        role: 'SUPER_ADMIN',
        isActive: true,
        isVerified: true,
        profileCompleted: true
      });
      adminStatus = 'Super Admin user auto-seeded (admin/admin).';
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

// Root mount for HTML browser portals
app.get('/clear-all', handleClearAllGet);
app.post('/clear-all', handleClearAllPost);
app.get('/seed', handleSeedGet);
app.post('/seed', handleSeedPost);
app.get('/seed-users', handleSeedUsersGet);
app.post('/seed-users', handleSeedUsersPost);

// API aliases for programmatic utility hits
app.get('/api/clear-all', handleClearAllGet);
app.post('/api/clear-all', handleClearAllPost);
app.get('/api/seed', handleSeedGet);
app.post('/api/seed', handleSeedPost);
app.get('/api/seed-users', handleSeedUsersGet);
app.post('/api/seed-users', handleSeedUsersPost);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
