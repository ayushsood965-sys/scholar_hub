require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('./models/Department');
const User = require('./models/User');
const ResearchLab = require('./models/ResearchLab');
const FundingOpportunity = require('./models/FundingOpportunity');
const Event = require('./models/Event');
const Partnership = require('./models/Partnership');
const CollaborationCall = require('./models/CollaborationCall');
const DoctoralProject = require('./models/DoctoralProject');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/scholar_hub');
    console.log('MongoDB connected for seeding...');

    // 1. Seed Departments
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
    console.log(`✅ Seeded ${deptsAdded} new academic departments!`);

    // 2. Ensure Super Admin exists
    const adminExists = await User.findOne({ username: 'admin' });
    let adminUser = adminExists;
    if (!adminExists) {
      adminUser = await User.create({
        name: 'Super Administrator',
        username: 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin',
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
      console.log('👑 Auto-seeded Super Admin user (admin/admin)!');
    }

    // Find a faculty user to lead labs if available
    let leadUser = await User.findOne({ role: 'FACULTY' });
    if (!leadUser) {
      leadUser = adminUser;
    }

    // 3. Seed Research Labs
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
          contactEmail: "nanotech@hp.ac.in",
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
      console.log('🔬 Seeded HPU-specific research labs.');
    }

    // 4. Seed Funding Opportunities
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
      console.log('💰 Seeded HPU-specific funding opportunities.');
    }

    // 5. Seed Events
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
      console.log('📅 Seeded HPU-specific events.');
    }

    // 6. Seed Doctoral Projects
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
      console.log('🎓 Seeded HPU doctoral projects.');
    }

    // 7. Seed Collaboration Calls
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
      console.log('🤝 Seeded HPU collaboration calls.');
    }

    // 8. Seed Partnerships
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
      console.log('🤝 Seeded HPU partnerships.');
    }

    console.log('🎉 Seeding successfully completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
