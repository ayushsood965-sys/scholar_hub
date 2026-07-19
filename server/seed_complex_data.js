const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Pre-compute hashes to speed up the loop by 100x
const passHash = bcrypt.hashSync('password123', 10);
const adminHash = bcrypt.hashSync('admin', 10);

bcrypt.genSalt = async () => 'dummy';
bcrypt.hash = async (password, salt) => {
  if (password === 'password123' || password === passHash) return passHash;
  if (password === 'admin' || password === adminHash) return adminHash;
  return bcrypt.hashSync(password, 10);
};

const User = require('./models/User');
const Department = require('./models/Department');
const FacultyMaster = require('./models/FacultyMaster');
const AcademicSessionMaster = require('./models/attendance/AcademicSessionMaster');
const DegreeTypeMaster = require('./models/attendance/DegreeTypeMaster');
const DegreeNameMaster = require('./models/attendance/DegreeNameMaster');
const SemesterMaster = require('./models/attendance/SemesterMaster');
const SemesterDegreeMapping = require('./models/attendance/SemesterDegreeMapping');
const StudentSemesterMapping = require('./models/attendance/StudentSemesterMapping');
const TimetableMaster = require('./models/attendance/TimetableMaster');
const AttendanceRecord = require('./models/attendance/AttendanceRecord');
const LeaveTypeMaster = require('./models/attendance/LeaveTypeMaster');
const LeaveRequest = require('./models/LeaveRequest');
const Thesis = require('./models/Thesis');
const Milestone = require('./models/Milestone');
const DRCMeeting = require('./models/DRCMeeting');
const Publication = require('./models/Publication');
const RACReview = require('./models/RACReview');

const uri = 'mongodb://root:Ayush1994*@169.58.12.127:27017/scholar_hub?authSource=admin&directConnection=true';

const dummyPdf = '/uploads/dummy_certificate.pdf';

const qualificationsTemplate = {
  class10: {
    rollNo: '1029384',
    board: 'CBSE',
    school: 'DAV Public School',
    marksObtained: 450,
    totalMarks: 500,
    percentage: 90,
    yearOfPassing: '2016',
    certificateUrl: dummyPdf
  },
  class12: {
    rollNo: '1283749',
    board: 'HPBOSE',
    school: 'Govt Sen Sec School',
    marksObtained: 470,
    totalMarks: 500,
    percentage: 94,
    yearOfPassing: '2018',
    certificateUrl: dummyPdf
  },
  graduation: {
    rollNo: 'GRAD-9988',
    degree: 'B.Sc. Biosciences',
    college: 'Govt College Shimla',
    university: 'HPU Shimla',
    marksObtained: 1800,
    totalMarks: 2000,
    percentage: 90,
    yearOfPassing: '2021',
    certificateUrl: dummyPdf
  },
  postGraduation: {
    rollNo: 'PG-7766',
    degree: 'M.Sc. Biosciences',
    college: 'HPU Department of BioSciences',
    university: 'Himachal Pradesh University',
    marksObtained: 920,
    totalMarks: 1000,
    percentage: 92,
    yearOfPassing: '2023',
    certificateUrl: dummyPdf
  },
  netJrf: {
    qualified: true,
    examType: 'NET-JRF',
    certNumber: 'JRF-2023-8822',
    rollNo: 'HP010293',
    rank: '35',
    score: '210',
    issueDate: '2023-11-15T00:00:00.000Z',
    certificateUrl: dummyPdf
  },
  fellowships: [
    {
      name: 'UGC Junior Research Fellowship (JRF)',
      fundingAgency: 'University Grants Commission (UGC)',
      amount: '37000',
      startDate: '2024-01-01',
      endDate: '2026-12-31',
      certificateUrl: dummyPdf
    }
  ],
  otherQuals: [
    {
      degree: 'Post Graduate Diploma in Bioinformatics',
      board: 'HPU',
      school: 'Computer Science Department',
      percentage: 85,
      yearOfPassing: '2024',
      certificateUrl: dummyPdf
    }
  ]
};

const experienceTemplate = [
  {
    organization: 'HPU Bio-IT Center',
    designation: 'Research Assistant',
    fromDate: '2023-08-01',
    toDate: '2023-12-31',
    description: 'Assisted in genome sequencing projects.'
  }
];

const awardsTemplate = [
  {
    title: 'Best Research Poster Award',
    awardingBody: 'Himachal Science Congress',
    year: '2025',
    description: 'Awarded for outstanding poster presentation on biodiversity.'
  }
];

const professionalBodiesTemplate = [
  {
    bodyName: 'Indian Science Congress Association',
    membershipType: 'Life Member',
    membershipNumber: 'L-39284',
    yearOfJoining: '2024'
  }
];

(async () => {
  console.log('Connecting to database...');
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB.');

  // Clear existing users and Ph.D./ScholarTrack workflows to avoid duplicates or index conflicts
  console.log('Clearing old user and workflow collections (excluding super admin)...');
  await User.deleteMany({ role: { $ne: 'SUPER_ADMIN' } });
  await Thesis.deleteMany({});
  await Milestone.deleteMany({});
  await DRCMeeting.deleteMany({});
  await Publication.deleteMany({});
  await RACReview.deleteMany({});
  await StudentSemesterMapping.deleteMany({});
  await TimetableMaster.deleteMany({});
  await AttendanceRecord.deleteMany({});
  await LeaveRequest.deleteMany({});

  // Ensure default super admin exists
  console.log('Ensuring default super admin...');
  const adminPasswordHash = await bcrypt.hash('admin', 10);
  await User.findOneAndUpdate(
    { username: 'admin' },
    {
      name: 'Super Admin',
      username: 'admin',
      password: adminPasswordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true,
      isEmailVerified: true
    },
    { upsert: true, new: true }
  );

  // Fetch essential masters
  const currentSession = await AcademicSessionMaster.findOne({ isCurrent: true });
  if (!currentSession) {
    throw new Error('Current academic session not found. Please run seedAllMasters first.');
  }
  const phdType = await DegreeTypeMaster.findOne({ code: 'PHD' });
  const mscType = await DegreeTypeMaster.findOne({ code: 'PG' });
  const certType = await DegreeTypeMaster.findOne({ code: 'CERT' });

  const allDepts = await Department.find({});
  console.log(`Loaded ${allDepts.length} departments from master.`);

  // We will loop through each department and seed:
  // - 1 HOD user
  // - 5 Supervisors
  // - 5 Ph.D. Students (2 awarded, 2 synopsis review, 1 active research)
  console.log('Seeding departments, HODs, Supervisors and Students...');

  for (const dept of allDepts) {
    const deptCode = dept.code;
    const deptName = dept.name;

    // Seed 1 HOD
    const hodPass = await bcrypt.hash('password123', 10);
    const hod = await User.create({
      name: `HOD ${deptCode}`,
      username: `hod_${deptCode.toLowerCase()}@gmail.com`,
      password: hodPass,
      role: 'HOD',
      subRole: 'HOD',
      department: deptName,
      isActive: true,
      isVerified: true,
      isEmailVerified: true,
      profileCompleted: true,
      profile: {
        email: `hod_${deptCode.toLowerCase()}@gmail.com`,
        phoneNumber: '9876543210',
        dob: '1975-05-15',
        gender: 'Male',
        category: 'General',
        fatherName: 'Late Sh. Ram Lal',
        motherName: 'Smt. Shanti Devi',
        nationality: 'Indian',
        address: 'HPU Campus Shimla',
        designation: 'Professor & Head',
        specialization: deptName,
        officeRoom: 'HOD-Room 101',
        yearsOfService: 15
      }
    });

    // Seed 5 Supervisors
    const supervisors = [];
    for (let i = 1; i <= 5; i++) {
      const sup = await User.create({
        name: `Dr. Supervisor ${deptCode} ${i}`,
        username: `supervisor_${deptCode.toLowerCase()}_${i}@gmail.com`,
        password: hodPass,
        role: 'FACULTY',
        subRole: 'SUPERVISOR',
        department: deptName,
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
        profileCompleted: true,
        profile: {
          email: `supervisor_${deptCode.toLowerCase()}_${i}@gmail.com`,
          phoneNumber: `987654320${i}`,
          dob: '1980-08-20',
          gender: i % 2 === 0 ? 'Female' : 'Male',
          category: 'General',
          fatherName: 'Sh. Kishori Lal',
          motherName: 'Smt. Kanta Devi',
          nationality: 'Indian',
          address: `HPU Faculty Housing ${i}`,
          designation: i === 1 ? 'Professor' : i <= 3 ? 'Associate Professor' : 'Assistant Professor',
          specialization: `${deptName} Research`,
          officeRoom: `Lab-${100 + i}`,
          yearsOfService: 10 - i,
          experience: experienceTemplate,
          awards: awardsTemplate,
          professionalBodies: professionalBodiesTemplate
        }
      });
      supervisors.push(sup);
    }

    // Fetch PHD degree name for this department
    const phdName = await DegreeNameMaster.findOne({ departmentId: dept._id, degreeTypeId: phdType._id });
    if (!phdName) {
      // Some departments might not have a PhD name seeded, skip student seeding for them
      console.log(`⚠️ Skip student seeding for ${deptCode} - No Ph.D. degree name mapping found.`);
      continue;
    }

    // Seed 5 PhD Students
    for (let i = 1; i <= 5; i++) {
      // Map to supervisor (1-to-1 matching: student i -> supervisor i-1)
      const supervisor = supervisors[i - 1];

      const student = await User.create({
        name: `Scholar ${deptCode} ${i}`,
        username: `student_${deptCode.toLowerCase()}_${i}@gmail.com`,
        password: hodPass,
        role: 'STUDENT',
        department: deptName,
        isActive: true,
        isVerified: true,
        isEmailVerified: true,
        profileCompleted: true,
        profile: {
          email: `student_${deptCode.toLowerCase()}_${i}@gmail.com`,
          phoneNumber: `889977660${i}`,
          dob: '1998-04-12',
          gender: i % 2 === 0 ? 'Female' : 'Male',
          category: 'SC',
          fatherName: 'Sh. Mohinder Singh',
          motherName: 'Smt. Preeti Devi',
          nationality: 'Indian',
          address: `HPU Student Hostel Room ${20 + i}`,
          enrollmentNumber: `ENROLL-${deptCode}-${1000 + i}`,
          admissionDate: '2024-08-01',
          phdMode: 'Full-Time',
          academicSession: currentSession.sessionName,
          degreeTypeId: phdType._id.toString(),
          degreeNameId: phdName._id.toString(),
          degreeType: phdType.name,
          degreeName: phdName.name,
          subject: deptName,
          isPhD: true,
          thesisTitle: `Research Study on ${deptName} Development Part ${i}`,
          thesisSummary: `This study explores new paradigms in ${deptName} with various experimental validations.`,
          thesisKeywords: `${deptName}, Research, Innovation`,
          preferredGuideId: supervisor._id.toString(),
          qualifications: qualificationsTemplate,
          experience: experienceTemplate,
          awards: awardsTemplate,
          professionalBodies: professionalBodiesTemplate
        }
      });

      // Create Thesis
      const thesis = await Thesis.create({
        scholarId: student._id,
        supervisorId: supervisor._id,
        department: deptName,
        title: student.profile.thesisTitle,
        enrollmentNumber: student.profile.enrollmentNumber,
        abstract: student.profile.thesisSummary,
        keywords: student.profile.thesisKeywords,
        courseworkCompleted: true,
        courseworkStatus: 'APPROVED',
        courseworkApprovals: {
          facultyApproved: true,
          facultyApproverId: supervisor._id,
          facultyApprovedAt: new Date(),
          hodApproved: true,
          hodApproverId: hod._id,
          hodApprovedAt: new Date()
        },
        enrollmentVerified: true,
        startDate: new Date('2024-08-01')
      });

      // Distribute Milestones
      if (i === 1 || i === 2) {
        // Degree Awarded stage
        // Synopsis milestone
        const synMilestone = await Milestone.create({
          thesisId: thesis._id,
          type: 'SYNOPSIS',
          title: 'Doctoral Synopsis Proposal',
          status: 'APPROVED',
          documentUrl: dummyPdf,
          plagiarismReportUrl: dummyPdf,
          submittedAt: new Date('2024-12-01'),
          reviewedAt: new Date('2024-12-15')
        });

        // DRC Meeting synopsis approval
        await DRCMeeting.create({
          scholarId: student._id,
          thesisId: thesis._id,
          scheduledDate: new Date('2024-12-10'),
          scheduledTime: '11:00 AM',
          venue: 'Department Seminar Room',
          committeeMembers: 'HOD, Supervisor, External Expert',
          isSynopsisApproval: true,
          status: 'APPROVED',
          remarks: 'Synopsis approved without revisions.'
        });

        // Seed 6 progress reports
        for (let r = 1; r <= 6; r++) {
          await Milestone.create({
            thesisId: thesis._id,
            type: '6_MONTH_REPORT',
            title: `6-Month Progress Report ${r}`,
            sequence: r,
            status: 'VERIFIED',
            documentUrl: dummyPdf,
            plagiarismReportUrl: dummyPdf,
            submittedAt: new Date(2025, r * 2, 1),
            reviewedAt: new Date(2025, r * 2, 10)
          });
        }

        // Publications (2 journals, 2 conferences)
        for (let p = 1; p <= 2; p++) {
          await Publication.create({
            scholarId: student._id,
            thesisId: thesis._id,
            type: 'JOURNAL',
            title: `Scientific Journal Publication ${p} in ${deptCode}`,
            journalName: `International Journal of ${deptCode}`,
            volume: `Vol ${p}`,
            issue: `Issue 2`,
            pages: '120-135',
            doiUrl: 'https://doi.org/10.1000/xyz123',
            documentUrl: dummyPdf,
            status: 'VERIFIED'
          });
          await Publication.create({
            scholarId: student._id,
            thesisId: thesis._id,
            type: 'CONFERENCE',
            title: `Conference Proceedings Paper ${p} in ${deptCode}`,
            journalName: `IEEE Conference on ${deptCode}`,
            doiUrl: 'https://doi.org/10.1000/conf456',
            documentUrl: dummyPdf,
            status: 'VERIFIED'
          });
        }

        // Final Thesis submission milestone
        const finalMilestone = await Milestone.create({
          thesisId: thesis._id,
          type: 'FINAL_SUBMISSION',
          title: 'Final Ph.D. Bound Thesis',
          status: 'APPROVED',
          documentUrl: dummyPdf,
          plagiarismReportUrl: dummyPdf,
          submittedAt: new Date('2026-03-01'),
          reviewedAt: new Date('2026-03-15')
        });

        // Update Thesis details to AWARDED
        thesis.preSubmissionSeminar = {
          status: 'CLEARED',
          requestedAt: new Date('2026-02-15'),
          scheduledDate: new Date('2026-02-25'),
          scheduledTime: '2:30 PM',
          venue: 'Department Lab',
          committeeMembers: 'HOD, Supervisor, External Evaluator',
          outcomeRecordedAt: new Date('2026-02-25'),
          outcomeRemarks: 'Cleared'
        };
        thesis.submittedAt = new Date('2026-03-01');
        thesis.status = 'AWARDED';
        thesis.externalEvaluationSentTo = 'Prof. Ram Kumar, IIT Delhi';
        thesis.externalEvaluationStatus = 'SUCCESSFUL';
        thesis.vivaDate = new Date('2026-05-10');
        thesis.vivaTime = '11:00 AM';
        thesis.vivaVenue = 'Committee Room';
        thesis.vivaPanel = 'External Evaluator, Dean, HOD, Supervisor';
        thesis.vivaStatus = 'SUCCESSFUL';
        thesis.awardedAt = new Date('2026-05-15');
        thesis.auditLog.push({
          action: 'DEGREE_AWARDED',
          note: 'Degree awarded after successfully clearing all Ph.D. lifecycle evaluation criteria.'
        });
        await thesis.save();

      } else if (i === 3 || i === 4) {
        // Synopsis review stage
        const synMilestone = await Milestone.create({
          thesisId: thesis._id,
          type: 'SYNOPSIS',
          title: 'Doctoral Synopsis Proposal',
          status: 'UNDER_REVIEW_HOD',
          documentUrl: dummyPdf,
          plagiarismReportUrl: dummyPdf,
          submittedAt: new Date(),
          forwardedRole: 'HOD',
          forwardedTo: hod._id
        });
        thesis.status = 'SYNOPSIS_PENDING';
        await thesis.save();

      } else {
        // Active Research stage
        // Synopsis milestone approved
        const synMilestone = await Milestone.create({
          thesisId: thesis._id,
          type: 'SYNOPSIS',
          title: 'Doctoral Synopsis Proposal',
          status: 'APPROVED',
          documentUrl: dummyPdf,
          plagiarismReportUrl: dummyPdf,
          submittedAt: new Date('2025-01-01'),
          reviewedAt: new Date('2025-01-15')
        });

        // DRC synopsis approval
        await DRCMeeting.create({
          scholarId: student._id,
          thesisId: thesis._id,
          scheduledDate: new Date('2025-01-10'),
          scheduledTime: '11:00 AM',
          venue: 'Department Seminar Room',
          isSynopsisApproval: true,
          status: 'APPROVED',
          remarks: 'Approved'
        });

        // Seed 1 progress report
        await Milestone.create({
          thesisId: thesis._id,
          type: '6_MONTH_REPORT',
          title: 'First 6-Month Progress Report',
          sequence: 1,
          status: 'VERIFIED',
          documentUrl: dummyPdf,
          plagiarismReportUrl: dummyPdf,
          submittedAt: new Date('2025-07-01'),
          reviewedAt: new Date('2025-07-10')
        });

        thesis.status = 'ACTIVE_RESEARCH';
        await thesis.save();
      }
    }
  }

  console.log('✅ Standard HOD, Supervisor, and PhD student seeding complete.');

  // ==========================================
  // CUSTOM FORENSIC SCIENCE DEPARTMENT SEEDING
  // ==========================================
  console.log('\nStarting Forensic Science Department special seeding...');
  const forensicDept = await Department.findOne({ code: 'FORENSIC' });
  const forensicPhdName = await DegreeNameMaster.findOne({ departmentId: forensicDept._id, degreeTypeId: phdType._id });

  // 1. Seed special HOD (mahinderkumar@gmail.com)
  const specialHodPass = await bcrypt.hash('password123', 10);
  const fHod = await User.create({
    name: 'Prof. Mahinder Kumar',
    username: 'mahinderkumar@gmail.com',
    password: specialHodPass,
    role: 'HOD',
    subRole: 'HOD',
    department: forensicDept.name,
    isActive: true,
    isVerified: true,
    isEmailVerified: true,
    profileCompleted: true,
    profile: {
      email: 'mahinderkumar@gmail.com',
      phoneNumber: '9876540000',
      dob: '1970-02-10',
      gender: 'Male',
      category: 'General',
      fatherName: 'Sh. Ram Lal Kumar',
      motherName: 'Smt. Shakuntala Devi',
      nationality: 'Indian',
      address: 'Forensic Science Department, HPU Shimla',
      designation: 'Professor & Head',
      specialization: 'Forensic Toxicology',
      officeRoom: 'FS-HOD-Room 1',
      yearsOfService: 20
    }
  });
  console.log('✅ Special HOD created: mahinderkumar@gmail.com');

  // 2. Seed special Supervisor (pradeepkumar@gmail.com)
  const fSupervisor = await User.create({
    name: 'Dr. Pradeep Kumar',
    username: 'pradeepkumar@gmail.com',
    password: specialHodPass,
    role: 'FACULTY',
    subRole: 'SUPERVISOR',
    department: forensicDept.name,
    isActive: true,
    isVerified: true,
    isEmailVerified: true,
    profileCompleted: true,
    profile: {
      email: 'pradeepkumar@gmail.com',
      phoneNumber: '9876541111',
      dob: '1978-11-04',
      gender: 'Male',
      category: 'General',
      fatherName: 'Sh. Gian Chand',
      motherName: 'Smt. Nirmala Devi',
      nationality: 'Indian',
      address: 'Faculty Block 4, HPU Shimla',
      designation: 'Associate Professor',
      specialization: 'Forensic DNA Profiling',
      officeRoom: 'FS-Lab 2',
      yearsOfService: 12,
      experience: experienceTemplate,
      awards: awardsTemplate,
      professionalBodies: professionalBodiesTemplate
    }
  });
  console.log('✅ Special Supervisor created: pradeepkumar@gmail.com');

  // 3. Seed special student (ayushtest@gmail.com) at Degree Awarded stage
  const ayushScholar = await User.create({
    name: 'Ayush Sood',
    username: 'ayushtest@gmail.com',
    password: specialHodPass,
    role: 'STUDENT',
    department: forensicDept.name,
    isActive: true,
    isVerified: true,
    isEmailVerified: true,
    profileCompleted: true,
    profile: {
      email: 'ayushtest@gmail.com',
      phoneNumber: '9418296766',
      dob: '1995-10-18',
      gender: 'Male',
      category: 'General',
      fatherName: 'Sh. Satish Sood',
      motherName: 'Smt. Seema Sood',
      nationality: 'Indian',
      address: 'Sood Cottage, Shimla',
      enrollmentNumber: 'ENROLL-FS-2024-001',
      admissionDate: '2024-08-01',
      phdMode: 'Full-Time',
      academicSession: currentSession.sessionName,
      degreeTypeId: phdType._id.toString(),
      degreeNameId: forensicPhdName._id.toString(),
      degreeType: phdType.name,
      degreeName: forensicPhdName.name,
      subject: forensicDept.name,
      isPhD: true,
      thesisTitle: 'Advanced Computational DNA Profiling in Criminal Investigations',
      thesisSummary: 'This research centers on creating high-throughput algorithms for Forensic DNA Analysis.',
      thesisKeywords: 'Forensic DNA, Computational Genomics, Criminal Investigations',
      preferredGuideId: fSupervisor._id.toString(),
      qualifications: qualificationsTemplate,
      experience: experienceTemplate,
      awards: awardsTemplate,
      professionalBodies: professionalBodiesTemplate
    }
  });
  console.log('✅ Special Student created: ayushtest@gmail.com');

  // Create Thesis for Ayush
  const ayushThesis = await Thesis.create({
    scholarId: ayushScholar._id,
    supervisorId: fSupervisor._id,
    department: forensicDept.name,
    title: ayushScholar.profile.thesisTitle,
    enrollmentNumber: ayushScholar.profile.enrollmentNumber,
    abstract: ayushScholar.profile.thesisSummary,
    keywords: ayushScholar.profile.thesisKeywords,
    courseworkCompleted: true,
    courseworkStatus: 'APPROVED',
    courseworkApprovals: {
      facultyApproved: true,
      facultyApproverId: fSupervisor._id,
      facultyApprovedAt: new Date(),
      hodApproved: true,
      hodApproverId: fHod._id,
      hodApprovedAt: new Date()
    },
    enrollmentVerified: true,
    startDate: new Date('2024-08-01')
  });

  // Synopsis Milestone for Ayush
  await Milestone.create({
    thesisId: ayushThesis._id,
    type: 'SYNOPSIS',
    title: 'Computational DNA Synopsis Proposal',
    status: 'APPROVED',
    documentUrl: dummyPdf,
    plagiarismReportUrl: dummyPdf,
    submittedAt: new Date('2024-12-01'),
    reviewedAt: new Date('2024-12-15')
  });

  // DRC synopsis approval for Ayush
  await DRCMeeting.create({
    scholarId: ayushScholar._id,
    thesisId: ayushThesis._id,
    scheduledDate: new Date('2024-12-10'),
    scheduledTime: '11:00 AM',
    venue: 'FS Seminar Room',
    isSynopsisApproval: true,
    status: 'APPROVED',
    remarks: 'Approved'
  });

  // 6 progress reports for Ayush
  for (let r = 1; r <= 6; r++) {
    await Milestone.create({
      thesisId: ayushThesis._id,
      type: '6_MONTH_REPORT',
      title: `Progress Report ${r} - DNA Profiling`,
      sequence: r,
      status: 'VERIFIED',
      documentUrl: dummyPdf,
      plagiarismReportUrl: dummyPdf,
      submittedAt: new Date(2025, r * 2, 1),
      reviewedAt: new Date(2025, r * 2, 10)
    });
  }

  // 2 Journals and 2 Conferences for Ayush
  for (let p = 1; p <= 2; p++) {
    await Publication.create({
      scholarId: ayushScholar._id,
      thesisId: ayushThesis._id,
      type: 'JOURNAL',
      title: `Computational DNA Analysis Journal Paper ${p}`,
      journalName: `International Journal of Forensic Genomics`,
      volume: `Vol ${p}`,
      issue: `Issue 1`,
      pages: '10-25',
      doiUrl: `https://doi.org/10.1000/fsjg.${p}`,
      documentUrl: dummyPdf,
      status: 'VERIFIED'
    });
    await Publication.create({
      scholarId: ayushScholar._id,
      thesisId: ayushThesis._id,
      type: 'CONFERENCE',
      title: `Computational DNA Analysis Conference Proceedings ${p}`,
      journalName: `Annual Forensic Science Conference`,
      doiUrl: `https://doi.org/10.1000/fsconf.${p}`,
      documentUrl: dummyPdf,
      status: 'VERIFIED'
    });
  }

  // Final Thesis submission for Ayush
  await Milestone.create({
    thesisId: ayushThesis._id,
    type: 'FINAL_SUBMISSION',
    title: 'DNA Profiling Computational Thesis',
    status: 'APPROVED',
    documentUrl: dummyPdf,
    plagiarismReportUrl: dummyPdf,
    submittedAt: new Date('2026-03-01'),
    reviewedAt: new Date('2026-03-15')
  });

  ayushThesis.preSubmissionSeminar = {
    status: 'CLEARED',
    requestedAt: new Date('2026-02-15'),
    scheduledDate: new Date('2026-02-25'),
    scheduledTime: '2:30 PM',
    venue: 'Forensic Lab',
    committeeMembers: 'HOD, Supervisor, External Evaluator',
    outcomeRecordedAt: new Date('2026-02-25'),
    outcomeRemarks: 'Cleared'
  };
  ayushThesis.submittedAt = new Date('2026-03-01');
  ayushThesis.status = 'AWARDED';
  ayushThesis.externalEvaluationSentTo = 'Prof. Shashi Kant, Panjab University';
  ayushThesis.externalEvaluationStatus = 'SUCCESSFUL';
  ayushThesis.vivaDate = new Date('2026-05-10');
  ayushThesis.vivaTime = '11:00 AM';
  ayushThesis.vivaVenue = 'FS Seminar Hall';
  ayushThesis.vivaPanel = 'External Evaluator, Dean, HOD, Supervisor';
  ayushThesis.vivaStatus = 'SUCCESSFUL';
  ayushThesis.awardedAt = new Date('2026-05-15');
  ayushThesis.auditLog.push({
    action: 'DEGREE_AWARDED',
    note: 'Degree awarded after successfully clearing all Ph.D. lifecycle evaluation criteria.'
  });
  await ayushThesis.save();
  console.log('✅ Ayush Sood thesis seeded and marked as AWARDED.');

  // Now seed the remaining 19 students in Forensic Science
  // Total distribution required:
  // - 5 Degree Awarded (including Ayush) -> Need 4 more.
  // - 5 Synopsis Stage -> Need 5.
  // - 5 Active Research -> Need 5.
  // - 2 Profile Verification Pending -> Need 2.
  // - 3 Final Submission stage -> Need 3.
  // Total = 4 + 5 + 5 + 2 + 3 = 19 students.
  // 10 students should be supervised by pradeepkumar@gmail.com (including Ayush).
  // So out of the 19 new ones, at least 9 should be supervised by pradeepkumar@gmail.com.
  // Let's seed 10 of them supervised by pradeepkumar@gmail.com, and the remaining 9 supervised by other FS supervisors (we will create 4 additional supervisors for FS).

  console.log('Seeding other Forensic Science supervisors...');
  const fsSupervisors = [fSupervisor];
  for (let i = 1; i <= 4; i++) {
    const fsSup = await User.create({
      name: `Dr. FS Supervisor ${i}`,
      username: `fssupervisor_${i}@gmail.com`,
      password: specialHodPass,
      role: 'FACULTY',
      subRole: 'SUPERVISOR',
      department: forensicDept.name,
      isActive: true,
      isVerified: true,
      isEmailVerified: true,
      profileCompleted: true,
      profile: {
        email: `fssupervisor_${i}@gmail.com`,
        phoneNumber: `987654222${i}`,
        dob: '1981-05-12',
        gender: i % 2 === 0 ? 'Female' : 'Male',
        category: 'General',
        fatherName: 'Sh. Gian Singh',
        motherName: 'Smt. Shanti Devi',
        nationality: 'Indian',
        address: 'HPU Shimla',
        designation: 'Assistant Professor',
        specialization: 'Forensic Science',
        officeRoom: `FS-Lab ${i + 2}`,
        yearsOfService: 8
      }
    });
    fsSupervisors.push(fsSup);
  }

  // Seeding Forensic Science Ph.D. scholars:
  const fsStudentsToSeed = [
    // 4 more Degree Awarded:
    { stage: 'AWARDED', supervisedByPradeep: true },
    { stage: 'AWARDED', supervisedByPradeep: true },
    { stage: 'AWARDED', supervisedByPradeep: false },
    { stage: 'AWARDED', supervisedByPradeep: false },

    // 5 Synopsis Stage:
    { stage: 'SYNOPSIS', supervisedByPradeep: true },
    { stage: 'SYNOPSIS', supervisedByPradeep: true },
    { stage: 'SYNOPSIS', supervisedByPradeep: true },
    { stage: 'SYNOPSIS', supervisedByPradeep: false },
    { stage: 'SYNOPSIS', supervisedByPradeep: false },

    // 5 Active Research Stage:
    { stage: 'ACTIVE_RESEARCH', supervisedByPradeep: true },
    { stage: 'ACTIVE_RESEARCH', supervisedByPradeep: true },
    { stage: 'ACTIVE_RESEARCH', supervisedByPradeep: false },
    { stage: 'ACTIVE_RESEARCH', supervisedByPradeep: false },
    { stage: 'ACTIVE_RESEARCH', supervisedByPradeep: false },

    // 2 Profile Verification Pending:
    { stage: 'PENDING_VERIFICATION', supervisedByPradeep: false },
    { stage: 'PENDING_VERIFICATION', supervisedByPradeep: false },

    // 3 Final Submission Stage:
    { stage: 'FINAL_SUBMISSION', supervisedByPradeep: true },
    { stage: 'FINAL_SUBMISSION', supervisedByPradeep: true },
    { stage: 'FINAL_SUBMISSION', supervisedByPradeep: false }
  ];

  let fsIdx = 0;
  for (const item of fsStudentsToSeed) {
    fsIdx++;
    // select supervisor
    const supervisorObj = item.supervisedByPradeep ? fSupervisor : fsSupervisors[1 + (fsIdx % 4)];
    const isPending = item.stage === 'PENDING_VERIFICATION';

    const stud = await User.create({
      name: `FS Scholar ${fsIdx}`,
      username: `fsscholar_${fsIdx}@gmail.com`,
      password: specialHodPass,
      role: 'STUDENT',
      department: forensicDept.name,
      isActive: true,
      isVerified: !isPending,
      isEmailVerified: true,
      profileCompleted: true,
      profile: {
        email: `fsscholar_${fsIdx}@gmail.com`,
        phoneNumber: `980077110${fsIdx}`,
        dob: '1997-09-09',
        gender: fsIdx % 2 === 0 ? 'Female' : 'Male',
        category: 'General',
        fatherName: `Sh. Father FS ${fsIdx}`,
        motherName: `Smt. Mother FS ${fsIdx}`,
        nationality: 'Indian',
        address: 'HPU Shimla',
        enrollmentNumber: `ENROLL-FS-2024-${100 + fsIdx}`,
        admissionDate: '2024-08-01',
        phdMode: 'Full-Time',
        academicSession: currentSession.sessionName,
        degreeTypeId: phdType._id.toString(),
        degreeNameId: forensicPhdName._id.toString(),
        degreeType: phdType.name,
        degreeName: forensicPhdName.name,
        subject: forensicDept.name,
        isPhD: true,
        thesisTitle: `Forensic Science Investigation Research Study Part ${fsIdx}`,
        thesisSummary: `This project targets Forensic Science breakthroughs with computational methodologies.`,
        thesisKeywords: 'Forensic, DNA, Crime Investigation',
        preferredGuideId: supervisorObj._id.toString(),
        qualifications: qualificationsTemplate,
        experience: experienceTemplate,
        awards: awardsTemplate,
        professionalBodies: professionalBodiesTemplate
      }
    });

    if (isPending) {
      console.log(`- Seeded FS pending-verification scholar: ${stud.username}`);
      continue; // profile complete but not verified by HOD, no thesis seeded yet
    }

    // Create Thesis
    const thesis = await Thesis.create({
      scholarId: stud._id,
      supervisorId: supervisorObj._id,
      department: forensicDept.name,
      title: stud.profile.thesisTitle,
      enrollmentNumber: stud.profile.enrollmentNumber,
      abstract: stud.profile.thesisSummary,
      keywords: stud.profile.thesisKeywords,
      courseworkCompleted: true,
      courseworkStatus: 'APPROVED',
      courseworkApprovals: {
        facultyApproved: true,
        facultyApproverId: supervisorObj._id,
        facultyApprovedAt: new Date(),
        hodApproved: true,
        hodApproverId: fHod._id,
        hodApprovedAt: new Date()
      },
      enrollmentVerified: true,
      startDate: new Date('2024-08-01')
    });

    // Milestone setup
    if (item.stage === 'AWARDED') {
      // Synopsis approved
      await Milestone.create({
        thesisId: thesis._id,
        type: 'SYNOPSIS',
        title: 'DRC Approved Synopsis',
        status: 'APPROVED',
        documentUrl: dummyPdf,
        plagiarismReportUrl: dummyPdf,
        submittedAt: new Date('2024-12-01'),
        reviewedAt: new Date('2024-12-15')
      });
      // DRC Approved
      await DRCMeeting.create({
        scholarId: stud._id,
        thesisId: thesis._id,
        scheduledDate: new Date('2024-12-10'),
        scheduledTime: '11:00 AM',
        venue: 'Forensic Seminar Room',
        isSynopsisApproval: true,
        status: 'APPROVED'
      });
      // 6 progress reports
      for (let r = 1; r <= 6; r++) {
        await Milestone.create({
          thesisId: thesis._id,
          type: '6_MONTH_REPORT',
          title: `Progress Report ${r}`,
          sequence: r,
          status: 'VERIFIED',
          documentUrl: dummyPdf,
          plagiarismReportUrl: dummyPdf
        });
      }
      // publications
      for (let p = 1; p <= 2; p++) {
        await Publication.create({
          scholarId: stud._id,
          thesisId: thesis._id,
          type: 'JOURNAL',
          title: `Forensic Science Journal ${p}`,
          journalName: 'Forensic Science Journal',
          documentUrl: dummyPdf,
          status: 'VERIFIED'
        });
        await Publication.create({
          scholarId: stud._id,
          thesisId: thesis._id,
          type: 'CONFERENCE',
          title: `Forensic Science Conference ${p}`,
          journalName: 'Forensic Science International Conference',
          documentUrl: dummyPdf,
          status: 'VERIFIED'
        });
      }
      // Final submission approved
      await Milestone.create({
        thesisId: thesis._id,
        type: 'FINAL_SUBMISSION',
        title: 'Bound Thesis Document',
        status: 'APPROVED',
        documentUrl: dummyPdf,
        plagiarismReportUrl: dummyPdf
      });

      thesis.preSubmissionSeminar = {
        status: 'CLEARED',
        requestedAt: new Date('2026-02-15'),
        scheduledDate: new Date('2026-02-25'),
        outcomeRecordedAt: new Date('2026-02-25'),
        outcomeRemarks: 'Cleared'
      };
      thesis.submittedAt = new Date('2026-03-01');
      thesis.status = 'AWARDED';
      thesis.externalEvaluationStatus = 'SUCCESSFUL';
      thesis.vivaStatus = 'SUCCESSFUL';
      thesis.awardedAt = new Date('2026-05-15');
      await thesis.save();

    } else if (item.stage === 'SYNOPSIS') {
      await Milestone.create({
        thesisId: thesis._id,
        type: 'SYNOPSIS',
        title: 'Computational DNA Synopsis',
        status: 'UNDER_REVIEW_HOD',
        documentUrl: dummyPdf,
        plagiarismReportUrl: dummyPdf,
        submittedAt: new Date(),
        forwardedRole: 'HOD',
        forwardedTo: fHod._id
      });
      thesis.status = 'SYNOPSIS_PENDING';
      await thesis.save();

    } else if (item.stage === 'ACTIVE_RESEARCH') {
      await Milestone.create({
        thesisId: thesis._id,
        type: 'SYNOPSIS',
        title: 'Forensic Proposal Synopsis',
        status: 'APPROVED',
        documentUrl: dummyPdf,
        plagiarismReportUrl: dummyPdf,
        submittedAt: new Date('2025-01-01'),
        reviewedAt: new Date('2025-01-15')
      });
      await DRCMeeting.create({
        scholarId: stud._id,
        thesisId: thesis._id,
        scheduledDate: new Date('2025-01-10'),
        scheduledTime: '11:00 AM',
        venue: 'Seminar Room',
        isSynopsisApproval: true,
        status: 'APPROVED'
      });
      await Milestone.create({
        thesisId: thesis._id,
        type: '6_MONTH_REPORT',
        title: 'First Progress Report',
        sequence: 1,
        status: 'VERIFIED',
        documentUrl: dummyPdf,
        plagiarismReportUrl: dummyPdf
      });
      thesis.status = 'ACTIVE_RESEARCH';
      await thesis.save();

    } else if (item.stage === 'FINAL_SUBMISSION') {
      // Active Research conditions cleared:
      await Milestone.create({
        thesisId: thesis._id,
        type: 'SYNOPSIS',
        title: 'Forensic Proposal Synopsis',
        status: 'APPROVED',
        documentUrl: dummyPdf
      });
      await DRCMeeting.create({
        scholarId: stud._id,
        thesisId: thesis._id,
        scheduledDate: new Date('2025-01-10'),
        scheduledTime: '11:00 AM',
        venue: 'Seminar Room',
        isSynopsisApproval: true,
        status: 'APPROVED'
      });
      for (let r = 1; r <= 6; r++) {
        await Milestone.create({
          thesisId: thesis._id,
          type: '6_MONTH_REPORT',
          title: `Progress Report ${r}`,
          sequence: r,
          status: 'VERIFIED',
          documentUrl: dummyPdf
        });
      }
      for (let p = 1; p <= 2; p++) {
        await Publication.create({
          scholarId: stud._id,
          thesisId: thesis._id,
          type: 'JOURNAL',
          title: `Forensic Science Journal ${p}`,
          journalName: 'Forensic Science Journal',
          documentUrl: dummyPdf,
          status: 'VERIFIED'
        });
        await Publication.create({
          scholarId: stud._id,
          thesisId: thesis._id,
          type: 'CONFERENCE',
          title: `Forensic Science Conference ${p}`,
          journalName: 'Forensic Science International Conference',
          documentUrl: dummyPdf,
          status: 'VERIFIED'
        });
      }
      thesis.preSubmissionSeminar = {
        status: 'CLEARED',
        requestedAt: new Date('2026-02-15'),
        scheduledDate: new Date('2026-02-25'),
        outcomeRecordedAt: new Date('2026-02-25'),
        outcomeRemarks: 'Cleared'
      };

      // Milestone FINAL_SUBMISSION pending
      await Milestone.create({
        thesisId: thesis._id,
        type: 'FINAL_SUBMISSION',
        title: 'Bound Thesis Document',
        status: 'PENDING_HOD',
        documentUrl: dummyPdf,
        plagiarismReportUrl: dummyPdf,
        submittedAt: new Date(),
        forwardedRole: 'HOD',
        forwardedTo: fHod._id
      });
      thesis.status = 'PRE_SUBMISSION';
      await thesis.save();
    }
  }

  console.log(`✅ Seeding of 20 Ph.D. scholars in Forensic Science Complete. Mapped to pradeepkumar@gmail.com.`);

  // ==========================================
  // SCHOLARTRACK DATA SEEDING (FORENSIC SCIENCE)
  // ==========================================
  console.log('\nSeeding ScholarTrack course students & timetable mapping for Forensic Science...');

  const mscFS = await DegreeNameMaster.findOne({ code: 'MSC-FORENSIC' });
  const certFS = await DegreeNameMaster.findOne({ code: 'CERT-FORENSIC' });
  const firstSemester = await SemesterMaster.findOne({ number: 1 });

  if (!mscFS || !certFS || !firstSemester) {
    throw new Error('M.Sc. FS, Certificate FS, or Semester 1 not found. Please run seedAllMasters first.');
  }

  // 1. Seed 20 Students in M.Sc. Forensic Science
  console.log('Seeding 20 students in M.Sc. Forensic Science...');
  const mscStudents = [];
  for (let i = 1; i <= 20; i++) {
    const s = await User.create({
      name: `MSc FS Student ${i}`,
      username: `mscfs_student_${i}@gmail.com`,
      password: specialHodPass,
      role: 'STUDENT',
      department: forensicDept.name,
      isActive: true,
      isVerified: true,
      isEmailVerified: true,
      profileCompleted: true,
      profile: {
        email: `mscfs_student_${i}@gmail.com`,
        phoneNumber: `97008811${i < 10 ? '0' + i : i}`,
        dob: '2002-05-15',
        gender: i % 2 === 0 ? 'Female' : 'Male',
        category: 'General',
        fatherName: `Sh. Father MSc ${i}`,
        motherName: `Smt. Mother MSc ${i}`,
        nationality: 'Indian',
        address: 'HPU Shimla',
        enrollmentNumber: `ENROLL-MSC-FS-2026-${100 + i}`,
        admissionDate: '2026-04-10',
        academicSession: currentSession.sessionName,
        degreeTypeId: mscType._id.toString(),
        degreeNameId: mscFS._id.toString(),
        semesterId: firstSemester._id.toString(),
        degreeType: mscType.name,
        degreeName: mscFS.name,
        subject: forensicDept.name,
        isPhD: false,
        qualifications: qualificationsTemplate
      }
    });
    mscStudents.push(s);
  }

  // 2. Seed 20 Students in Certificate in Forensic Science
  console.log('Seeding 20 students in Certificate in Forensic Science...');
  const certStudents = [];
  for (let i = 1; i <= 20; i++) {
    const s = await User.create({
      name: `Cert FS Student ${i}`,
      username: `certfs_student_${i}@gmail.com`,
      password: specialHodPass,
      role: 'STUDENT',
      department: forensicDept.name,
      isActive: true,
      isVerified: true,
      isEmailVerified: true,
      profileCompleted: true,
      profile: {
        email: `certfs_student_${i}@gmail.com`,
        phoneNumber: `96008811${i < 10 ? '0' + i : i}`,
        dob: '2003-08-22',
        gender: i % 2 === 0 ? 'Female' : 'Male',
        category: 'OBC',
        fatherName: `Sh. Father Cert ${i}`,
        motherName: `Smt. Mother Cert ${i}`,
        nationality: 'Indian',
        address: 'HPU Shimla',
        enrollmentNumber: `ENROLL-CERT-FS-2026-${100 + i}`,
        admissionDate: '2026-04-10',
        academicSession: currentSession.sessionName,
        degreeTypeId: certType._id.toString(),
        degreeNameId: certFS._id.toString(),
        semesterId: firstSemester._id.toString(),
        degreeType: certType.name,
        degreeName: certFS.name,
        subject: forensicDept.name,
        isPhD: false,
        qualifications: qualificationsTemplate
      }
    });
    certStudents.push(s);
  }

  // 3. Create Timetable
  // We need to create subject slots for these two courses (M.Sc. FS and Certificate in FS) for all days of the week.
  // We will map at least one subject/slot to pradeepkumar@gmail.com on each day.
  console.log('Creating Timetable slots and mapping subjects to pradeepkumar@gmail.com...');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const mscSlots = [];
  const certSlots = [];

  for (const day of days) {
    // MSc FS Timetable Slot taught by Pradeep Kumar
    const mscSlot = await TimetableMaster.create({
      departmentId: forensicDept._id,
      sessionId: currentSession._id,
      degreeTypeId: mscType._id,
      degreeNameId: mscFS._id,
      semesterId: firstSemester._id,
      subjectCode: 'FS-501',
      subjectName: 'Forensic DNA Profiling & Analysis',
      facultyId: fSupervisor._id,
      dayOfWeek: day,
      startTime: '10:00',
      endTime: '11:00',
      totalClassesInSemester: 90
    });
    mscSlots.push(mscSlot);

    // Certificate FS Timetable Slot taught by Pradeep Kumar
    const certSlot = await TimetableMaster.create({
      departmentId: forensicDept._id,
      sessionId: currentSession._id,
      degreeTypeId: certType._id,
      degreeNameId: certFS._id,
      semesterId: firstSemester._id,
      subjectCode: 'CFS-101',
      subjectName: 'Introduction to Crime Scene Management',
      facultyId: fSupervisor._id,
      dayOfWeek: day,
      startTime: '11:30',
      endTime: '12:30',
      totalClassesInSemester: 45
    });
    certSlots.push(certSlot);
  }

  // 4. Create Student Semester Mappings
  // Map at least 10 students of MSc and 10 of Certificate to the slots taught by pradeepkumar@gmail.com
  console.log('Mapping students to semesters and subjects...');
  
  // MSc: Map students 1 to 12 (12 students, which satisfies at least 10!)
  for (let i = 0; i < 12; i++) {
    const student = mscStudents[i];
    await StudentSemesterMapping.create({
      studentId: student._id,
      facultyId: fSupervisor._id,
      sessionId: currentSession._id,
      degreeTypeId: mscType._id,
      degreeNameId: mscFS._id,
      semesterId: firstSemester._id,
      departmentId: forensicDept._id,
      mappedSubjects: mscSlots.map(slot => ({
        timetableSlotId: slot._id,
        subjectCode: slot.subjectCode,
        subjectName: slot.subjectName
      })),
      mappedBy: fHod._id
    });
  }

  // Cert: Map students 1 to 12
  for (let i = 0; i < 12; i++) {
    const student = certStudents[i];
    await StudentSemesterMapping.create({
      studentId: student._id,
      facultyId: fSupervisor._id,
      sessionId: currentSession._id,
      degreeTypeId: certType._id,
      degreeNameId: certFS._id,
      semesterId: firstSemester._id,
      departmentId: forensicDept._id,
      mappedSubjects: certSlots.map(slot => ({
        timetableSlotId: slot._id,
        subjectCode: slot.subjectCode,
        subjectName: slot.subjectName
      })),
      mappedBy: fHod._id
    });
  }

  // ==========================================
  // ATTENDANCE & LEAVE SEEDING
  // ==========================================
  console.log('\nSeeding daily attendance records for May, June, July 2026...');

  // Build a helper list of days in May, June, July 2026
  const getDates = (start, end) => {
    const arr = [];
    let dt = new Date(start);
    while (dt <= end) {
      arr.push(new Date(dt));
      dt.setDate(dt.getDate() + 1);
    }
    return arr;
  };
  const dates = getDates(new Date('2026-05-01'), new Date('2026-07-31'));
  console.log(`Generated ${dates.length} calendar dates.`);

  // Load LeaveTypeMaster CL and ML
  const clType = await LeaveTypeMaster.findOne({ leaveCode: 'CL' });
  const mlType = await LeaveTypeMaster.findOne({ leaveCode: 'ML' });

  // Map of day numbers to day strings
  const dayNameMap = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
  };

  let recordsAdded = 0;
  let leaveRequestsAdded = 0;

  // Let's seed attendance for MSc mapped students (students 0 to 11)
  // And Certificate mapped students (students 0 to 11)
  const mappedMscStuds = mscStudents.slice(0, 12);
  const mappedCertStuds = certStudents.slice(0, 12);

  for (const dateObj of dates) {
    const dayOfWeekNum = dateObj.getDay();
    if (dayOfWeekNum === 0) continue; // Skip Sunday

    const dayName = dayNameMap[dayOfWeekNum];

    // Find the slot for this day
    const mscSlot = mscSlots.find(s => s.dayOfWeek === dayName);
    const certSlot = certSlots.find(s => s.dayOfWeek === dayName);

    // 1. Process MSc students
    for (const stud of mappedMscStuds) {
      // Determine status: 80% Present, 10% Absent, 10% On Leave
      const rand = Math.random();
      let status = 'PRESENT';
      let leaveReqId = null;
      let leaveTypeName = '';

      if (rand < 0.1) {
        status = 'ABSENT';
      } else if (rand < 0.2) {
        status = 'ON_LEAVE';
        leaveTypeName = Math.random() < 0.5 ? 'CL' : 'ML';
        // Create an approved leave request
        const leave = await LeaveRequest.create({
          studentId: stud._id,
          department: forensicDept.name,
          departmentId: forensicDept._id,
          leaveType: leaveTypeName,
          leaveTypeId: leaveTypeName === 'CL' ? clType?._id : mlType?._id,
          startDate: dateObj,
          endDate: dateObj,
          totalDays: 1,
          reason: 'Fever / Personal work',
          status: 'APPROVED',
          currentAssigneeId: fHod._id,
          auditLog: [
            { action: 'SUBMITTED', actorId: stud._id, actorName: stud.name, remarks: 'Applying' },
            { action: 'SUPERVISOR_APPROVED', actorId: fSupervisor._id, actorName: fSupervisor.name, remarks: 'Recommended' },
            { action: 'APPROVED', actorId: fHod._id, actorName: fHod.name, remarks: 'Approved' }
          ]
        });
        leaveReqId = leave._id;
        leaveRequestsAdded++;
      }

      await AttendanceRecord.create({
        studentId: stud._id,
        sessionId: currentSession._id,
        timetableId: mscSlot._id,
        degreeTypeId: mscType._id,
        degreeNameId: mscFS._id,
        semesterId: firstSemester._id,
        courseCode: mscSlot.subjectCode,
        courseName: mscSlot.subjectName,
        classes: [{ timetableSlotId: mscSlot._id, subjectName: mscSlot.subjectName, selected: true }],
        facultyId: fSupervisor._id,
        departmentId: forensicDept._id,
        date: dateObj,
        status: status,
        leaveRequestId: leaveReqId,
        leaveType: leaveTypeName,
        markedBy: fSupervisor._id,
        isLeaveOverride: status === 'ON_LEAVE',
        approvalStatus: 'APPROVED'
      });
      recordsAdded++;
    }

    // 2. Process Certificate students
    for (const stud of mappedCertStuds) {
      const rand = Math.random();
      let status = 'PRESENT';
      let leaveReqId = null;
      let leaveTypeName = '';

      if (rand < 0.1) {
        status = 'ABSENT';
      } else if (rand < 0.2) {
        status = 'ON_LEAVE';
        leaveTypeName = Math.random() < 0.5 ? 'CL' : 'ML';
        const leave = await LeaveRequest.create({
          studentId: stud._id,
          department: forensicDept.name,
          departmentId: forensicDept._id,
          leaveType: leaveTypeName,
          leaveTypeId: leaveTypeName === 'CL' ? clType?._id : mlType?._id,
          startDate: dateObj,
          endDate: dateObj,
          totalDays: 1,
          reason: 'Urgent family issue',
          status: 'APPROVED',
          currentAssigneeId: fHod._id,
          auditLog: [
            { action: 'SUBMITTED', actorId: stud._id, actorName: stud.name, remarks: 'Applying' },
            { action: 'SUPERVISOR_APPROVED', actorId: fSupervisor._id, actorName: fSupervisor.name, remarks: 'Recommended' },
            { action: 'APPROVED', actorId: fHod._id, actorName: fHod.name, remarks: 'Approved' }
          ]
        });
        leaveReqId = leave._id;
        leaveRequestsAdded++;
      }

      await AttendanceRecord.create({
        studentId: stud._id,
        sessionId: currentSession._id,
        timetableId: certSlot._id,
        degreeTypeId: certType._id,
        degreeNameId: certFS._id,
        semesterId: firstSemester._id,
        courseCode: certSlot.subjectCode,
        courseName: certSlot.subjectName,
        classes: [{ timetableSlotId: certSlot._id, subjectName: certSlot.subjectName, selected: true }],
        facultyId: fSupervisor._id,
        departmentId: forensicDept._id,
        date: dateObj,
        status: status,
        leaveRequestId: leaveReqId,
        leaveType: leaveTypeName,
        markedBy: fSupervisor._id,
        isLeaveOverride: status === 'ON_LEAVE',
        approvalStatus: 'APPROVED'
      });
      recordsAdded++;
    }
  }
  console.log(`✅ Seeded ${recordsAdded} attendance records and ${leaveRequestsAdded} approved leaves.`);

  // 3. Seed some rejected leave applications
  console.log('Seeding a few pending/rejected leave applications...');
  for (let i = 0; i < 3; i++) {
    const student = mscStudents[i];
    await LeaveRequest.create({
      studentId: student._id,
      department: forensicDept.name,
      departmentId: forensicDept._id,
      leaveType: 'CL',
      leaveTypeId: clType?._id,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-02'),
      totalDays: 2,
      reason: 'Attending friend marriage',
      status: 'REJECTED',
      currentAssigneeId: fSupervisor._id,
      auditLog: [
        { action: 'SUBMITTED', actorId: student._id, actorName: student.name, remarks: 'Applying' },
        { action: 'REJECTED_BY_SUPERVISOR', actorId: fSupervisor._id, actorName: fSupervisor.name, remarks: 'Rejected due to exam dates' }
      ]
    });
  }

  await mongoose.disconnect();
  console.log('\n--- 🌟 COMPLEX DATABASE SEEDING COMPLETED SUCCESSFULY! 🌟 ---');
})().catch(e => {
  console.error('❌ Complex seeding failed:', e);
  process.exit(1);
});
