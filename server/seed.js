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
const FundingAward = require('./models/FundingAward');
const Thesis = require('./models/Thesis');

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

    // 4. Seed Official HPU & UGC Funding Schemes (Central University Master Schemes)
    const fundingCount = await FundingOpportunity.countDocuments();
    if (fundingCount === 0) {
      const fundingToSeed = [
        {
          title: "UGC-NET Junior Research Fellowship (JRF / SRF)",
          agency: "University Grants Commission (UGC)",
          amount: "₹37,000 / Month + HRA",
          monthlyStipend: "₹37,000 / Month",
          duration: "5 Years",
          scope: "Central financial assistance for scholars who qualified UGC-NET JRF in Arts, Humanities, Social Sciences, Commerce, Management, Computer Science, and Law (JRF @ ₹37,000/mo for 2 yrs, upgradable to SRF @ ₹42,000/mo for 3 yrs).",
          status: "Active",
          type: "Fellowship",
          eligibilityDepartments: [],
          eligibilityCriteria: "UGC-NET JRF qualified, registered full-time Ph.D. scholar at HPU.",
          applicationUrl: "https://ugcnet.nta.ac.in",
          contactEmail: "ugcjrf@hpu.ac.in",
          documentsRequired: ["UGC-NET JRF Award Letter", "HPU Ph.D. Admission Order", "Joining Report & Mandate Form", "Monthly Attendance Proforma"],
          fundingBody: "UGC",
          recurrence: "Monthly"
        },
        {
          title: "CSIR-UGC NET Junior Research Fellowship (JRF / SRF)",
          agency: "Council of Scientific & Industrial Research (CSIR-HRDG)",
          amount: "₹37,000 / Month + HRA",
          monthlyStipend: "₹37,000 / Month",
          duration: "5 Years",
          scope: "Fellowship for research scholars in Chemical Sciences, Earth Sciences, Life Sciences, Mathematical Sciences, and Physical Sciences (JRF @ ₹37,000/mo for 2 yrs, SRF @ ₹42,000/mo for 3 yrs).",
          status: "Active",
          type: "Fellowship",
          eligibilityDepartments: ["Department of Chemistry", "Department of Physics", "Department of Bio Sciences", "Department of Bio Technology", "Department of Mathematics"],
          eligibilityCriteria: "CSIR-NET JRF qualified in Science & Technology disciplines.",
          applicationUrl: "https://csirhrdg.res.in",
          contactEmail: "csirjrf@hpu.ac.in",
          documentsRequired: ["CSIR-NET JRF Certificate", "HPU Joining Report", "Bank Mandate Form", "Three-Member Assessment Committee Report for SRF upgrade"],
          fundingBody: "CSIR",
          recurrence: "Monthly"
        },
        {
          title: "National Fellowship for Scheduled Caste Students (NFSC)",
          agency: "Ministry of Social Justice & Empowerment / UGC",
          amount: "₹37,000 / Month + HRA",
          monthlyStipend: "₹37,000 / Month",
          duration: "5 Years",
          scope: "Central fellowship scheme providing financial opportunities to Scheduled Caste (SC) candidates to pursue full-time higher education and research leading to Ph.D. degrees in Sciences, Humanities, and Social Sciences.",
          status: "Active",
          type: "Fellowship",
          eligibilityDepartments: [],
          eligibilityCriteria: "SC Category, enrolled in full-time regular Ph.D. course at HPU, qualified NET/NFSC merit list.",
          applicationUrl: "https://scholarships.gov.in",
          contactEmail: "deanstudies@hpu.ac.in",
          documentsRequired: ["Caste Certificate", "NFSC Selection Letter", "Ph.D. Registration Certificate", "Income Affidavit"],
          fundingBody: "UGC",
          recurrence: "Monthly"
        },
        {
          title: "National Fellowship for Higher Education of ST Students (NFST)",
          agency: "Ministry of Tribal Affairs / UGC",
          amount: "₹37,000 / Month + HRA",
          monthlyStipend: "₹37,000 / Month",
          duration: "5 Years",
          scope: "Fellowship for Scheduled Tribe (ST) scholars, with special focus on students from Himachal Pradesh notified tribal regions (Kinnaur, Lahaul & Spiti, Pangi, Bharmour).",
          status: "Active",
          type: "Fellowship",
          eligibilityDepartments: [],
          eligibilityCriteria: "ST Category, enrolled in full-time regular Ph.D. at HPU.",
          applicationUrl: "https://tribal.nic.in/Scholarships.aspx",
          contactEmail: "tribalscholarship@hpu.ac.in",
          documentsRequired: ["Bonafide Tribal Certificate", "NFST Award Letter", "Joining Report", "HPU Fee Receipt"],
          fundingBody: "UGC",
          recurrence: "Monthly"
        },
        {
          title: "National Fellowship for Other Backward Classes (NFOBC)",
          agency: "Ministry of Social Justice & Empowerment / UGC",
          amount: "₹37,000 / Month + HRA",
          monthlyStipend: "₹37,000 / Month",
          duration: "5 Years",
          scope: "Fellowship opportunity for OBC research scholars pursuing full-time Ph.D. degrees across all recognized academic faculties of Himachal Pradesh University.",
          status: "Active",
          type: "Fellowship",
          eligibilityDepartments: [],
          eligibilityCriteria: "OBC Category (Non-Creamy Layer), UGC-NET/CSIR-NET qualified.",
          applicationUrl: "https://scholarships.gov.in",
          contactEmail: "deanstudies@hpu.ac.in",
          documentsRequired: ["OBC Non-Creamy Layer Certificate", "NFOBC Award Letter", "Joining Report", "Aadhaar Card"],
          fundingBody: "UGC",
          recurrence: "Monthly"
        },
        {
          title: "Savitribai Jyotirao Phule Fellowship for Single Girl Child (SJSGC)",
          agency: "University Grants Commission (UGC)",
          amount: "₹37,000 / Month + HRA",
          monthlyStipend: "₹37,000 / Month",
          duration: "5 Years",
          scope: "Dedicated fellowship scheme to promote higher education and research for women scholars who are the only girl child of their family (at par with UGC JRF/SRF rates).",
          status: "Active",
          type: "Fellowship",
          eligibilityDepartments: [],
          eligibilityCriteria: "Female scholar who is the single girl child in the family, admitted to regular full-time Ph.D.",
          applicationUrl: "https://frg.ugc.ac.in",
          contactEmail: "sjsgc@hpu.ac.in",
          documentsRequired: ["Single Girl Child Affidavit on Stamp Paper", "Family Domicile Certificate", "Ph.D. Enrollment Order"],
          fundingBody: "UGC",
          recurrence: "Monthly"
        },
        {
          title: "DST-INSPIRE Fellowship",
          agency: "Department of Science and Technology (DST)",
          amount: "₹37,000 / Month + HRA",
          monthlyStipend: "₹37,000 / Month",
          duration: "5 Years",
          scope: "Prestigious fellowship for 1st rank holders in University Post-Graduate examinations in basic and applied sciences or qualified INSPIRE Scholars.",
          status: "Active",
          type: "Fellowship",
          eligibilityDepartments: ["Department of Chemistry", "Department of Physics", "Department of Bio Sciences", "Department of Bio Technology", "Department of Mathematics"],
          eligibilityCriteria: "1st Rank at University Level in PG Science examination or INSPIRE Scholar with minimum 65% aggregate.",
          applicationUrl: "https://online-inspire.gov.in",
          contactEmail: "dstinspire@hpu.ac.in",
          documentsRequired: ["University 1st Rank Certificate", "PG Degree Transcript", "Research Proposal", "Supervisor Endorsement"],
          fundingBody: "DST",
          recurrence: "Monthly"
        },
        {
          title: "ICSSR Doctoral Fellowship",
          agency: "Indian Council of Social Science Research (ICSSR)",
          amount: "₹20,000 / Month",
          monthlyStipend: "₹20,000 / Month",
          duration: "2 Years",
          scope: "Full-term doctoral fellowship for scholars registered in Social Science disciplines (Economics, Political Science, Sociology, Public Admin, Psychology, Geography) with annual contingency grant.",
          status: "Active",
          type: "Fellowship",
          eligibilityDepartments: ["Department of Economics", "Department of Political Science", "Department of Sociology and Social Work", "Department of Public Administration", "Department of Psychology", "Department of Geography"],
          eligibilityCriteria: "Confirmed Ph.D. registration in Social Science, NET qualified preferred.",
          applicationUrl: "https://icssr.org/doctoral-fellowship",
          contactEmail: "icssr@hpu.ac.in",
          documentsRequired: ["Detailed Research Synopsis approved by DRC", "ICSSR Application Form", "Supervisor CV", "Joining Report"],
          fundingBody: "ICSSR",
          recurrence: "Monthly"
        },
        {
          title: "ICHR Doctoral Fellowship",
          agency: "Indian Council of Historical Research (ICHR)",
          amount: "₹17,600 / Month",
          monthlyStipend: "₹17,600 / Month",
          duration: "2 Years",
          scope: "Fellowship for research scholars registered in History and Ancient Indian Archaeology pursuing archival and archaeological studies.",
          status: "Active",
          type: "Fellowship",
          eligibilityDepartments: ["Department of History", "Department of Archaeology (Ancient History & Archaeology)"],
          eligibilityCriteria: "Ph.D. scholar in History or Archaeology with DRC-approved synopsis.",
          applicationUrl: "http://ichr.ac.in",
          contactEmail: "ichrfellowship@hpu.ac.in",
          documentsRequired: ["ICHR Research Proposal", "DRC Approved Synopsis", "Supervisor Consent Letter"],
          fundingBody: "ICHR",
          recurrence: "Monthly"
        },
        {
          title: "HPU Campus Junior Research Fellowship (University JRF)",
          agency: "Himachal Pradesh University, Summer Hill",
          amount: "₹10,000 / Month",
          monthlyStipend: "₹10,000 / Month",
          duration: "3 Years",
          scope: "Institutional merit fellowship awarded directly from HPU internal university research provisions to top-ranked department entrance scholars who do not receive any other central or state fellowship.",
          status: "Active",
          type: "Fellowship",
          eligibilityDepartments: [],
          eligibilityCriteria: "Department entrance test / merit list topper, enrolled full-time, non-recipient of any other stipend.",
          deadline: new Date('2026-11-15'),
          applicationUrl: "https://hpuniv.ac.in",
          contactEmail: "deanstudies@hpu.ac.in",
          documentsRequired: ["HPU Ph.D. Entrance Merit Proof", "Non-Fellowship Undertaking Affidavit", "Departmental RAC Recommendation"],
          fundingBody: "University",
          recurrence: "Monthly"
        },
        {
          title: "HIMCOSTE State R&D Project Grant",
          agency: "HP State Council for Science, Technology & Environment (HIMCOSTE)",
          amount: "₹10,000,00 (Project Grant)",
          monthlyStipend: "N/A (Project Grant)",
          duration: "3 Years",
          scope: "State research grant supporting projects on Himachal Pradesh mountain ecology, high-altitude biodiversity, disaster risk reduction, and regional green technologies.",
          status: "Active",
          type: "Project Grant",
          eligibilityDepartments: ["Department of Bio Sciences", "Department of Bio Technology", "Department of Environmental Science", "Department of Geography", "Department of Chemistry", "Department of Physics"],
          eligibilityCriteria: "Faculty Principal Investigator with full-time Ph.D. scholar co-investigators.",
          applicationUrl: "http://himcoste.hp.gov.in",
          contactEmail: "himcoste@hp.gov.in",
          documentsRequired: ["State Relevance Concept Pitch", "Itemized Budget Breakdown", "PI & Co-PI Endorsement"],
          fundingBody: "HIMCOSTE",
          recurrence: "Project-based"
        }
      ];
      await FundingOpportunity.insertMany(fundingToSeed);
      console.log('💰 Seeded 11 official HPU and UGC funding schemes.');
    }

    // 4b. Seed Active Fellowship Awards for scholars
    const awardCount = await FundingAward.countDocuments();
    if (awardCount === 0) {
      const students = await User.find({ role: 'STUDENT' }).limit(4);
      const seededOpps = await FundingOpportunity.find({});
      if (students.length > 0 && seededOpps.length > 0) {
        for (let i = 0; i < Math.min(students.length, 4); i++) {
          const scholar = students[i];
          const opp = seededOpps[i % seededOpps.length];
          const thesis = await Thesis.findOne({ scholarId: scholar._id });

          const monthsCount = i === 0 ? 12 : i === 1 ? 6 : i === 2 ? 4 : 3;
          const monthNames = [
            'October 2025', 'November 2025', 'December 2025',
            'January 2026', 'February 2026', 'March 2026',
            'April 2026', 'May 2026', 'June 2026',
            'July 2026', 'August 2026', 'September 2026'
          ];
          const slicedMonths = monthNames.slice(monthNames.length - monthsCount).reverse();
          const ledgerEntries = slicedMonths.map((m, mIdx) => ({
            monthYear: m,
            amount: 37000,
            amountFormatted: '₹37,000',
            status: 'DISBURSED',
            disbursedAt: new Date(2026, 8 - mIdx, 28),
            referenceNo: `HPU-FIN-2026-${1000 + i * 100 + mIdx}`,
            remarks: `Standard monthly fellowship credit for ${m}`
          }));

          const award = new FundingAward({
            scholarId: scholar._id,
            thesisId: thesis ? thesis._id : null,
            fundingOpportunityId: opp._id,
            awardTitle: opp.title,
            monthlyStipend: opp.monthlyStipend || '₹37,000 / Month',
            amountSanctioned: '₹22,20,000 (5 Years)',
            amountDisbursed: `₹${(37000 * monthsCount).toLocaleString('en-IN')} (${monthsCount} Months)`,
            startDate: new Date('2025-08-01'),
            endDate: new Date('2028-07-31'),
            status: 'ACTIVE',
            renewalDate: new Date('2026-07-31'),
            remarks: 'Enrolled under regular departmental research fellowship quota.',
            disbursementLedger: ledgerEntries
          });
          await award.save();
          if (thesis) {
            await Thesis.findByIdAndUpdate(thesis._id, { fundingSource: opp.title });
          }
        }
        console.log(`🏅 Seeded active fellowship awards for ${Math.min(students.length, 4)} scholars.`);
      }
    }

    // 4c. Ensure specific funding award & >= 36 months tenure for ayushtest@gmail.com (and supervisor/HOD verification)
    const ayushScholar = await User.findOne({ username: 'ayushtest@gmail.com' });
    if (ayushScholar) {
      // Ensure tenure is >= 36 months so pre-submission unlocks
      await User.findByIdAndUpdate(ayushScholar._id, { 'profile.admissionDate': '2023-06-01' });
      await Thesis.findOneAndUpdate({ scholarId: ayushScholar._id }, { startDate: new Date('2023-06-01'), registrationDate: new Date('2023-06-01') });

      const existingAyushAward = await FundingAward.findOne({ scholarId: ayushScholar._id });
      if (!existingAyushAward) {
        const ugcOpp = await FundingOpportunity.findOne({ title: /UGC-NET Junior Research Fellowship/i });
        const ayushThesis = await Thesis.findOne({ scholarId: ayushScholar._id }).populate('supervisorId');
        if (ugcOpp) {
          const monthNames = [
            'October 2025', 'November 2025', 'December 2025',
            'January 2026', 'February 2026', 'March 2026',
            'April 2026', 'May 2026', 'June 2026',
            'July 2026', 'August 2026', 'September 2026'
          ];
          const ayushLedger = monthNames.map((m, idx) => ({
            monthYear: m,
            amount: 37000,
            amountFormatted: '₹37,000',
            status: 'DISBURSED',
            disbursedAt: new Date(2025, 9 + idx, 10),
            referenceNo: `UTR-HPU-UGC-2026-SEP-${800 + idx + 1}`,
            remarks: 'Monthly UGC-NET JRF Stipend Credited via PFMS Bank Transfer',
            disbursedBy: ayushThesis?.supervisorId?._id || null
          }));

          await FundingAward.create({
            scholarId: ayushScholar._id,
            thesisId: ayushThesis ? ayushThesis._id : null,
            fundingOpportunityId: ugcOpp._id,
            awardTitle: ugcOpp.title,
            monthlyStipend: '₹37,000 / Month',
            amountSanctioned: '₹22,20,000 (5 Years)',
            amountDisbursed: '₹4,44,000 (12 Months)',
            startDate: new Date('2025-10-01'),
            endDate: new Date('2030-09-30'),
            status: 'ACTIVE',
            renewalDate: new Date('2026-10-01'),
            remarks: 'Statutory UGC-NET Junior Research Fellowship mapped to DNA Profiling doctoral study.',
            disbursementLedger: ayushLedger
          });
          if (ayushThesis) {
            await Thesis.findByIdAndUpdate(ayushThesis._id, { fundingSource: ugcOpp.title });
          }
          console.log('🏅 Seeded dedicated UGC-NET JRF fellowship award & 12-month ledger for ayushtest@gmail.com');
        }
      }

      // 4d. Seed Pre-Submission, Final Submission, and Ph.D. Degree Awarded for ayushtest@gmail.com
      const ayushThesisDoc = await Thesis.findOne({ scholarId: ayushScholar._id });
      const ayushSupervisor = await User.findOne({ username: 'pradeepkumar@gmail.com' });
      const ayushHod = await User.findOne({ username: 'mahinderkumar@gmail.com' }) || await User.findOne({ role: 'HOD', department: ayushScholar.department });

      if (ayushThesisDoc && ayushSupervisor && ayushHod) {
        // Ensure Pre-Submission milestone is APPROVED
        let preM = await Milestone.findOne({ thesisId: ayushThesisDoc._id, type: 'PRE_SUBMISSION' });
        if (!preM) {
          preM = new Milestone({ thesisId: ayushThesisDoc._id, type: 'PRE_SUBMISSION', sequence: 99 });
        }
        preM.title = 'Pre-Submission Thesis & Plagiarism Clearance Package';
        preM.status = 'APPROVED';
        preM.documentUrl = '/uploads/theses/ayush_presubmission_draft.pdf';
        preM.plagiarismReportUrl = '/uploads/plagiarism/ayush_turnitin_clearance.pdf';
        preM.submittedAt = new Date('2026-06-15T10:00:00.000Z');
        preM.reviewedAt = new Date('2026-06-25T15:30:00.000Z');
        preM.comments = [
          {
            authorId: ayushSupervisor._id,
            authorName: ayushSupervisor.name,
            text: 'Verified rough thesis draft and Turnitin similarity index (4%). Plagiarism criteria cleared. Recommended for departmental pre-submission colloquium defense.',
            createdAt: new Date('2026-06-20T11:30:00.000Z')
          },
          {
            authorId: ayushHod._id,
            authorName: ayushHod.name,
            text: 'Endorsed by HOD. Pre-submission seminar colloquium defense presentation approved and cleared.',
            createdAt: new Date('2026-06-25T15:30:00.000Z')
          }
        ];
        preM.history = [
          {
            action: 'SUBMITTED',
            actorName: ayushScholar.name,
            actorRole: 'STUDENT',
            documentUrl: '/uploads/theses/ayush_presubmission_draft.pdf',
            plagiarismReportUrl: '/uploads/plagiarism/ayush_turnitin_clearance.pdf',
            remarks: 'Submitted rough thesis draft with Turnitin similarity report (similarity index: 4%).',
            timestamp: new Date('2026-06-15T10:00:00.000Z')
          },
          {
            action: 'SUPERVISOR_APPROVED',
            actorName: ayushSupervisor.name,
            actorRole: 'SUPERVISOR',
            documentUrl: '/uploads/theses/ayush_presubmission_draft.pdf',
            plagiarismReportUrl: '/uploads/plagiarism/ayush_turnitin_clearance.pdf',
            remarks: 'Supervisor digital verification completed. Approved and forwarded to HOD for pre-submission seminar scheduling.',
            timestamp: new Date('2026-06-20T11:30:00.000Z')
          },
          {
            action: 'HOD_APPROVED',
            actorName: ayushHod.name,
            actorRole: 'HOD',
            documentUrl: '/uploads/theses/ayush_presubmission_draft.pdf',
            plagiarismReportUrl: '/uploads/plagiarism/ayush_turnitin_clearance.pdf',
            remarks: 'HOD clearance granted. Pre-submission seminar scheduled and cleared.',
            timestamp: new Date('2026-06-25T15:30:00.000Z')
          }
        ];
        await preM.save();

        // Pre-Submission Seminar
        ayushThesisDoc.preSubmissionSeminar = {
          status: 'CLEARED',
          requestedAt: new Date('2026-06-15T10:30:00.000Z'),
          requestRemarks: 'Requesting permission to deliver Pre-Submission Colloquium before the Departmental Research Committee.',
          scheduledDate: new Date('2026-07-10T10:00:00.000Z'),
          scheduledTime: '11:00 AM',
          venue: 'Department Seminar Hall & Smart Classroom',
          committeeMembers: 'Prof. Mahinder Kumar (HOD & Chairperson), Dr. Pradeep Kumar (Supervisor), Prof. S. K. Gupta (External Expert), DRC Members',
          remarks: 'Pre-submission presentation was successfully delivered before the DRC panel. The candidate defended research methodology, findings, and publications.',
          facultyApprovedAt: new Date('2026-06-20T11:30:00.000Z'),
          facultyApproverId: ayushSupervisor._id,
          hodApprovedAt: new Date('2026-06-25T15:30:00.000Z'),
          hodApproverId: ayushHod._id,
          outcomeRecordedAt: new Date('2026-07-10T13:00:00.000Z'),
          outcomeRemarks: 'The expert committee examined the rough draft and found the research work comprehensive and satisfactory. The candidate is cleared to prepare the final bound thesis incorporating committee recommendations.'
        };

        // Ensure Final Submission milestone is APPROVED
        let finalM = await Milestone.findOne({ thesisId: ayushThesisDoc._id, type: 'FINAL_SUBMISSION' });
        if (!finalM) {
          finalM = new Milestone({ thesisId: ayushThesisDoc._id, type: 'FINAL_SUBMISSION', sequence: 100 });
        }
        finalM.title = 'Final Complete Bound Thesis Submission Package';
        finalM.status = 'APPROVED';
        finalM.documentUrl = '/uploads/theses/ayush_final_bound_thesis.pdf';
        finalM.plagiarismReportUrl = '/uploads/plagiarism/ayush_final_turnitin_clearance.pdf';
        finalM.submittedAt = new Date('2026-07-28T11:00:00.000Z');
        finalM.reviewedAt = new Date('2026-08-05T16:00:00.000Z');
        finalM.comments = [
          {
            authorId: ayushSupervisor._id,
            authorName: ayushSupervisor.name,
            text: 'Verified incorporation of all colloquium expert recommendations. Final bound thesis formatted according to university doctoral guidelines. Fully endorsed and signed off.',
            createdAt: new Date('2026-08-01T14:30:00.000Z')
          },
          {
            authorId: ayushHod._id,
            authorName: ayushHod.name,
            text: 'Verified supervisor sign-off and similarity compliance. Cleared for external university examiner evaluation and dispatch.',
            createdAt: new Date('2026-08-05T16:00:00.000Z')
          }
        ];
        finalM.history = [
          {
            action: 'SUBMITTED',
            actorName: ayushScholar.name,
            actorRole: 'STUDENT',
            documentUrl: '/uploads/theses/ayush_final_bound_thesis.pdf',
            plagiarismReportUrl: '/uploads/plagiarism/ayush_final_turnitin_clearance.pdf',
            remarks: 'Uploaded final bound thesis incorporating colloquium suggestions with final similarity verification.',
            timestamp: new Date('2026-07-28T11:00:00.000Z')
          },
          {
            action: 'SUPERVISOR_APPROVED',
            actorName: ayushSupervisor.name,
            actorRole: 'SUPERVISOR',
            documentUrl: '/uploads/theses/ayush_final_bound_thesis.pdf',
            plagiarismReportUrl: '/uploads/plagiarism/ayush_final_turnitin_clearance.pdf',
            remarks: 'Supervisor digital verification completed. Approved and endorsed for HOD clearance.',
            timestamp: new Date('2026-08-01T14:30:00.000Z')
          },
          {
            action: 'HOD_APPROVED',
            actorName: ayushHod.name,
            actorRole: 'HOD',
            documentUrl: '/uploads/theses/ayush_final_bound_thesis.pdf',
            plagiarismReportUrl: '/uploads/plagiarism/ayush_final_turnitin_clearance.pdf',
            remarks: 'HOD clearance granted. Approved for external examiner dispatch and adjudication.',
            timestamp: new Date('2026-08-05T16:00:00.000Z')
          },
          {
            action: 'EXTERNAL_EVALUATION_DISPATCHED',
            actorName: ayushHod.name,
            actorRole: 'HOD',
            remarks: 'Thesis package dispatched to external examiners.\n• Dispatched To: Prof. S. K. Roy (IIT Roorkee), Prof. N. Sharma (JNU New Delhi)\n• Dispatch Method: Speed Post (Registered Airmail)\n• Date Dispatched: 10/08/2026\n• Tracking Reference Code: HPU-EXAM-PHD-2026-9844',
            timestamp: new Date('2026-08-10T10:00:00.000Z')
          },
          {
            action: 'EXTERNAL_EVALUATION_SUCCESSFUL',
            actorName: ayushHod.name,
            actorRole: 'HOD',
            remarks: 'External evaluation reports successfully logged.\n• Result: PASSED (Clear & Satisfactory)\n• Dispatched To: Prof. S. K. Roy (IIT Roorkee), Prof. N. Sharma (JNU New Delhi)\n• Date Dispatched: 10/08/2026\n• Evaluator Remarks & Feedback: All external examiner reports received with Category-A commendation. Both examiners unconditionally recommended the thesis for the award of the Ph.D. degree subject to viva-voce examination.',
            timestamp: new Date('2026-08-30T11:30:00.000Z')
          },
          {
            action: 'VIVA_SCHEDULED',
            actorName: ayushHod.name,
            actorRole: 'HOD',
            remarks: 'Viva-Voce scheduled to be conducted.\n• Date: 12/09/2026\n• Time: 11:30 AM\n• Venue: Senate Committee Hall & Google Meet Hybrid\n• Convenor/Coordinator: Prof. Mahinder Kumar\n• Panel Members: Prof. S. K. Roy (External Examiner, IIT Roorkee), Prof. Mahinder Kumar (HOD & Chairperson), Dr. Pradeep Kumar (Supervisor)\n• Meeting Link: https://meet.google.com/phd-ayush-viva',
            timestamp: new Date('2026-09-02T10:00:00.000Z')
          },
          {
            action: 'VIVA_SUCCESSFUL',
            actorName: ayushHod.name,
            actorRole: 'HOD',
            remarks: 'Viva-Voce outcome recorded.\n• Outcome: PASSED (Clear & Pass)\n• Date Conducted: 12/09/2026\n• Time: 11:30 AM\n• Venue: Senate Committee Hall & Google Meet Hybrid\n• Convenor/Coordinator: Prof. Mahinder Kumar\n• Panel Members: Prof. S. K. Roy (External Examiner, IIT Roorkee), Prof. Mahinder Kumar (HOD & Chairperson), Dr. Pradeep Kumar (Supervisor)\n• Meeting Link: https://meet.google.com/phd-ayush-viva\n• Board Decision Notes: The candidate defended the research thesis before the board with exemplary proficiency and domain mastery. All inquiries from the external examiner and faculty were thoroughly and satisfactorily answered. Unanimously recommended for the Ph.D. degree award.',
            timestamp: new Date('2026-09-12T13:00:00.000Z')
          }
        ];
        await finalM.save();

        // Update Thesis lifecycle fields
        ayushThesisDoc.courseworkCompleted = true;
        ayushThesisDoc.enrollmentVerified = true;
        ayushThesisDoc.synopsisProvisionallyCleared = true;
        ayushThesisDoc.dispatchDate = new Date('2026-08-10T10:00:00.000Z');
        ayushThesisDoc.dispatchMethod = 'Speed Post (Registered Airmail)';
        ayushThesisDoc.dispatchTrackingNumber = 'HPU-EXAM-PHD-2026-9844';
        ayushThesisDoc.externalEvaluationSentTo = 'Prof. S. K. Roy (IIT Roorkee), Prof. N. Sharma (JNU New Delhi)';
        ayushThesisDoc.externalEvaluationStatus = 'SUCCESSFUL';
        ayushThesisDoc.externalEvaluationLoggedAt = new Date('2026-08-30T11:30:00.000Z');
        ayushThesisDoc.externalEvaluationLoggedBy = ayushHod._id;
        ayushThesisDoc.externalEvaluationRemarks = 'All external examiner reports received with Category-A commendation. Both examiners unconditionally recommended the thesis for the award of the Ph.D. degree subject to viva-voce examination.';
        ayushThesisDoc.vivaDate = new Date('2026-09-12T11:30:00.000Z');
        ayushThesisDoc.vivaTime = '11:30 AM';
        ayushThesisDoc.vivaVenue = 'Senate Committee Hall & Google Meet Hybrid';
        ayushThesisDoc.vivaPanel = 'Prof. S. K. Roy (External Examiner, IIT Roorkee), Prof. Mahinder Kumar (HOD & Chairperson), Dr. Pradeep Kumar (Supervisor)';
        ayushThesisDoc.vivaCoordinator = 'Prof. Mahinder Kumar';
        ayushThesisDoc.vivaMeetingLink = 'https://meet.google.com/phd-ayush-viva';
        ayushThesisDoc.vivaStatus = 'SUCCESSFUL';
        ayushThesisDoc.vivaRemarks = 'The candidate defended the research thesis before the board with exemplary proficiency and domain mastery. All inquiries from the external examiner and faculty were thoroughly and satisfactorily answered. Unanimously recommended for the Ph.D. degree award.';
        ayushThesisDoc.status = 'AWARDED';
        ayushThesisDoc.submittedAt = new Date('2026-08-05T16:00:00.000Z');
        ayushThesisDoc.awardedAt = new Date('2026-09-15T10:00:00.000Z');

        await ayushThesisDoc.save();
        console.log('🎓 Seeded Ph.D. Degree Awarded status & lifecycle for ayushtest@gmail.com');
      }
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
