require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Thesis = require('./models/Thesis');
const Milestone = require('./models/Milestone');
const RACReview = require('./models/RACReview');
const Publication = require('./models/Publication');
const FundingAward = require('./models/FundingAward');
const Meeting = require('./models/Meeting');
const DRCMeeting = require('./models/DRCMeeting');
const ChangeRequest = require('./models/ChangeRequest');
const AdditionalDocument = require('./models/AdditionalDocument');
const ResearchLab = require('./models/ResearchLab');
const Notification = require('./models/Notification');

async function seedCompleteScholarData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully!\n');

    // 1. Find or verify Scholar, Supervisor, HOD
    const scholar = await User.findOne({ username: 'ayushtest@gmail.com' });
    if (!scholar) {
      console.error('Scholar ayushtest@gmail.com not found!');
      process.exit(1);
    }
    console.log(`✓ Scholar: ${scholar.name} (${scholar._id})`);

    const supervisor = await User.findOne({ username: 'pradeepkumar@gmail.com' }) ||
      await User.findOne({ role: 'FACULTY', department: scholar.department });
    if (!supervisor) {
      console.error('Supervisor not found!');
      process.exit(1);
    }
    console.log(`✓ Supervisor: ${supervisor.name} (${supervisor._id})`);

    const hod = await User.findOne({ username: 'mahinderkumar@gmail.com' }) || 
      await User.findOne({ role: 'HOD', department: scholar.department });
    if (!hod) {
      console.error('HOD not found!');
      process.exit(1);
    }
    console.log(`✓ HOD: ${hod.name} (${hod._id})`);

    let thesis = await Thesis.findOne({ scholarId: scholar._id });
    if (!thesis) {
      console.error('Thesis not found for ayushtest@gmail.com!');
      process.exit(1);
    }
    console.log(`✓ Found Thesis: "${thesis.title}" (${thesis._id})\n`);

    // =========================================================================
    // STEP 1: SCHOLAR PROFILE ENHANCEMENT
    // =========================================================================
    scholar.isVerified = true;
    scholar.profileCompleted = true;
    scholar.department = 'Forensic Science';
    scholar.profile = {
      ...scholar.profile,
      phone: '+91 98160 12345',
      admissionDate: '2023-06-01',
      fatherName: 'Sh. Rajinder Sood',
      motherName: 'Smt. Anita Sood',
      dob: '1997-04-15',
      gender: 'Male',
      category: 'General',
      address: 'Department of Forensic Science, HPU Summer Hill, Shimla, Himachal Pradesh - 171005',
      bloodGroup: 'B+',
      emergencyContact: '+91 98160 54321',
      qualification: 'M.Sc. Forensic Science (First Class with Distinction, 84.5%)',
      university: 'Himachal Pradesh University, Summer Hill, Shimla',
      researchArea: 'Forensic DNA Phenotyping & STR Molecular Profiling',
      enrollmentNumber: 'HPU/FS/PHD/2023-882'
    };
    await scholar.save();
    console.log('✓ 1. Profile updated and fully verified for Ayush Sood');

    // =========================================================================
    // STEP 2: THESIS CORE FIELDS, COURSEWORK & COMPLETE LIFECYCLE AUDIT TRAIL
    // =========================================================================
    thesis.supervisorId = supervisor._id;
    thesis.department = 'Forensic Science';
    thesis.enrollmentNumber = 'HPU/FS/PHD/2023-882';
    thesis.title = 'Advanced Computational DNA Profiling & Molecular Phenotyping in Forensic Investigations';
    thesis.abstract = 'This doctoral thesis presents novel high-throughput multiplex PCR protocols and machine learning frameworks for human DNA phenotyping and STR profiling from low-template, severely degraded skeletal remains. The developed computational classifiers achieved over 94% predictive accuracy for pigmentation and biogeographical ancestry, offering transformative solutions for cold case investigations and disaster victim identification in India.';
    thesis.keywords = 'Forensic DNA Phenotyping, Short Tandem Repeats (STR), Single Nucleotide Polymorphism (SNP), Multiplex PCR, Machine Learning, Degraded Skeletal DNA, Biogeographical Ancestry';
    thesis.status = 'AWARDED';
    thesis.enrollmentVerified = true;
    thesis.synopsisProvisionallyCleared = true;
    thesis.startDate = new Date('2023-06-01T10:00:00.000Z');
    thesis.submittedAt = new Date('2026-08-05T16:00:00.000Z');
    thesis.awardedAt = new Date('2026-09-15T10:00:00.000Z');

    // Coursework Details & Approvals
    thesis.courseworkCompleted = true;
    thesis.courseworkStatus = 'APPROVED';
    thesis.courseworkUploadProof = '/uploads/theses/ayush_coursework_marksheet.pdf';
    thesis.courseworkApprovals = {
      facultyApproved: true,
      facultyApproverId: supervisor._id,
      facultyApprovedAt: new Date('2024-01-15T11:00:00.000Z'),
      hodApproved: true,
      hodApproverId: hod._id,
      hodApprovedAt: new Date('2024-01-20T14:30:00.000Z')
    };
    thesis.courseworkDetails = {
      researchEthics: [
        {
          subjectName: 'Research and Publication Ethics (RPE)',
          subjectCode: 'CPE-RPE-01',
          marksObtained: 88,
          maxMarks: 100,
          examinationMonthYear: '2023-12'
        }
      ],
      researchMethodology: [
        {
          subjectName: 'Research Methodology & Applied Statistics in Forensics',
          subjectCode: 'FSC-RM-101',
          marksObtained: 92,
          maxMarks: 100,
          examinationMonthYear: '2023-12'
        }
      ],
      elective: [
        {
          subjectName: 'Advanced Forensic DNA Phenotyping & STR Molecular Profiling',
          subjectCode: 'FSC-ELE-201',
          marksObtained: 85,
          maxMarks: 100,
          examinationMonthYear: '2023-12'
        }
      ],
      others: [
        {
          subjectName: 'Directed Reading in Biological Forensic Evidence & Genomics',
          subjectCode: 'FSC-DIR-301',
          marksObtained: 90,
          maxMarks: 100,
          examinationMonthYear: '2023-12'
        }
      ]
    };

    // Pre-Submission Seminar
    thesis.preSubmissionSeminar = {
      status: 'CLEARED',
      requestedAt: new Date('2026-06-15T10:30:00.000Z'),
      requestRemarks: 'Requesting permission to deliver Pre-Submission Colloquium before the Departmental Research Committee.',
      scheduledDate: new Date('2026-07-10T10:00:00.000Z'),
      scheduledTime: '11:00 AM',
      venue: 'Department Seminar Hall & Smart Classroom',
      committeeMembers: 'Prof. Mahinder Kumar (HOD & Chairperson), Dr. Pradeep Kumar (Supervisor), Prof. S. K. Gupta (External Expert), DRC Members',
      remarks: 'Pre-submission presentation was successfully delivered before the DRC panel. The candidate defended research methodology, findings, and publications.',
      facultyApprovedAt: new Date('2026-06-20T11:30:00.000Z'),
      facultyApproverId: supervisor._id,
      hodApprovedAt: new Date('2026-06-25T15:30:00.000Z'),
      hodApproverId: hod._id,
      outcomeRecordedAt: new Date('2026-07-10T13:00:00.000Z'),
      outcomeRemarks: 'The expert committee examined the rough draft and found the research work comprehensive and satisfactory. The candidate is cleared to prepare the final bound thesis incorporating committee recommendations.'
    };

    thesis.preSubmissionSeminarHistory = [
      {
        scheduledDate: new Date('2026-07-10T10:00:00.000Z'),
        scheduledTime: '11:00 AM',
        venue: 'Department Seminar Hall & Smart Classroom',
        committeeMembers: 'Prof. Mahinder Kumar (HOD), Dr. Pradeep Kumar (Supervisor), DRC Committee',
        remarks: 'Pre-submission seminar presented successfully.',
        outcomeRecordedAt: new Date('2026-07-10T13:00:00.000Z'),
        outcomeRemarks: 'Cleared by Departmental Research Committee. Permitted to submit final bound thesis.',
        status: 'CLEARED'
      }
    ];

    // External Evaluation & Dispatch Details
    thesis.dispatchDate = new Date('2026-08-10T10:00:00.000Z');
    thesis.dispatchMethod = 'Speed Post (Registered Airmail)';
    thesis.dispatchTrackingNumber = 'HPU-EXAM-PHD-2026-9844';
    thesis.externalEvaluationSentTo = 'Prof. S. K. Roy (IIT Roorkee), Prof. N. Sharma (JNU New Delhi)';
    thesis.externalEvaluationStatus = 'SUCCESSFUL';
    thesis.externalEvaluationLoggedAt = new Date('2026-08-30T11:30:00.000Z');
    thesis.externalEvaluationLoggedBy = hod._id;
    thesis.externalEvaluationRemarks = 'All external examiner reports received with Category-A commendation. Both examiners unconditionally recommended the thesis for the award of the Ph.D. degree subject to viva-voce examination.';

    // Viva-Voce Defense
    thesis.vivaDate = new Date('2026-09-12T11:30:00.000Z');
    thesis.vivaTime = '11:30 AM';
    thesis.vivaVenue = 'Senate Committee Hall & Google Meet Hybrid';
    thesis.vivaPanel = 'Prof. S. K. Roy (External Examiner, IIT Roorkee), Prof. Mahinder Kumar (HOD & Chairperson), Dr. Pradeep Kumar (Supervisor)';
    thesis.vivaCoordinator = 'Prof. Mahinder Kumar';
    thesis.vivaMeetingLink = 'https://meet.google.com/phd-ayush-viva';
    thesis.vivaStatus = 'SUCCESSFUL';
    thesis.vivaRemarks = 'The candidate defended the research thesis before the board with exemplary proficiency and domain mastery. All inquiries from the external examiner and faculty were thoroughly and satisfactorily answered. Unanimously recommended for the Ph.D. degree award.';

    // Sequential Audit Log
    thesis.auditLog = [
      { action: 'REGISTRATION_SUBMITTED', note: 'Ph.D. Scholar profile submitted for HOD registration clearance.', date: new Date('2023-06-01T10:00:00.000Z') },
      { action: 'REGISTRATION_APPROVED', note: 'Registration verified and admitted by HOD Prof. Mahinder Kumar.', date: new Date('2023-06-05T14:00:00.000Z') },
      { action: 'COURSEWORK_SUBMITTED', note: 'Uploaded Ph.D. coursework grade cards & marks statement.', date: new Date('2024-01-10T11:00:00.000Z') },
      { action: 'COURSEWORK_FACULTY_APPROVED', note: 'Coursework marks verified and approved by Supervisor Dr. Pradeep Kumar.', date: new Date('2024-01-15T11:00:00.000Z') },
      { action: 'COURSEWORK_HOD_APPROVED', note: 'Coursework clearance endorsed and certified by HOD Prof. Mahinder Kumar.', date: new Date('2024-01-20T14:30:00.000Z') },
      { action: 'SYNOPSIS_SUBMITTED', note: 'Uploaded research proposal synopsis with similarity index verification.', date: new Date('2024-02-10T10:00:00.000Z') },
      { action: 'SYNOPSIS_SUPERVISOR_APPROVED', note: 'Synopsis methodology verified by Supervisor Dr. Pradeep Kumar.', date: new Date('2024-02-15T15:00:00.000Z') },
      { action: 'SYNOPSIS_HOD_APPROVED', note: 'Synopsis defense approved by Departmental Research Committee.', date: new Date('2024-03-01T15:00:00.000Z') },
      { action: 'PRE_SUBMISSION_SUBMITTED', note: 'Pre-submission rough draft uploaded by scholar Ayush Sood.', date: new Date('2026-06-15T10:00:00.000Z') },
      { action: 'PRE_SUBMISSION_SUPERVISOR_APPROVED', note: 'Pre-submission draft approved by supervisor Dr. Pradeep Kumar.', date: new Date('2026-06-20T11:30:00.000Z') },
      { action: 'PRE_SUBMISSION_HOD_APPROVED', note: 'Pre-submission draft approved by HOD Prof. Mahinder Kumar.', date: new Date('2026-06-25T15:30:00.000Z') },
      { action: 'SEMINAR_SCHEDULED', note: 'Pre-submission seminar scheduled by HOD for 10/07/2026 at 11:00 AM.', date: new Date('2026-06-25T16:00:00.000Z') },
      { action: 'SEMINAR_CLEARED', note: 'Pre-submission colloquium defense cleared by Departmental Research Committee.', date: new Date('2026-07-10T13:00:00.000Z') },
      { action: 'FINAL_SUBMISSION_SUBMITTED', note: 'Final bound thesis uploaded by scholar Ayush Sood.', date: new Date('2026-07-28T11:00:00.000Z') },
      { action: 'SUPERVISOR_APPROVED', note: 'Final digital sign-off by supervisor Dr. Pradeep Kumar.', date: new Date('2026-08-01T14:30:00.000Z') },
      { action: 'HOD_APPROVED', note: 'Final digital sign-off by HOD Prof. Mahinder Kumar.', date: new Date('2026-08-05T16:00:00.000Z') },
      { action: 'THESIS_DISPATCHED', note: 'Thesis dispatched to external examiners via Speed Post (Ref: HPU-EXAM-PHD-2026-9844).', date: new Date('2026-08-10T10:00:00.000Z') },
      { action: 'EXTERNAL_EVALUATION_SUCCESS', note: 'External examiner evaluation cleared successfully with Category-A commendations.', date: new Date('2026-08-30T11:30:00.000Z') },
      { action: 'VIVA_SCHEDULED', note: 'Viva-Voce scheduled for 12/09/2026 at 11:30 AM in Senate Committee Hall.', date: new Date('2026-09-02T10:00:00.000Z') },
      { action: 'VIVA_OUTCOME_LOGGED', note: 'Viva-Voce defense recorded as SUCCESSFUL. Unanimously recommended for Ph.D. award.', date: new Date('2026-09-12T13:00:00.000Z') },
      { action: 'DEGREE_AWARDED', note: 'Ph.D. degree officially awarded by the Academic Council.', date: new Date('2026-09-15T10:00:00.000Z') }
    ];

    await thesis.save();
    console.log('✓ 2. Thesis, Coursework & Lifecycle updated to AWARDED');

    // =========================================================================
    // STEP 3: SYNOPSIS MILESTONE & DRC MEETING
    // =========================================================================
    await Milestone.deleteMany({ thesisId: thesis._id, type: 'SYNOPSIS' });
    const synopsisMilestone = await Milestone.create({
      thesisId: thesis._id,
      type: 'SYNOPSIS',
      title: 'Research Synopsis Proposal: Forensic DNA Phenotyping & STR Molecular Profiling',
      sequence: 1,
      status: 'APPROVED',
      documentUrl: '/uploads/theses/ayush_synopsis_proposal.pdf',
      plagiarismReportUrl: '/uploads/plagiarism/ayush_synopsis_turnitin.pdf',
      submittedAt: new Date('2024-02-10T10:00:00.000Z'),
      reviewedAt: new Date('2024-03-01T15:00:00.000Z'),
      comments: [
        {
          authorId: supervisor._id,
          authorName: supervisor.name,
          text: 'The experimental research methodology, multiplex PCR optimization, and sample sizing are thoroughly formulated. Approved and recommended for Departmental Research Committee defense.',
          createdAt: new Date('2024-02-15T15:00:00.000Z')
        },
        {
          authorId: hod._id,
          authorName: hod.name,
          text: 'Synopsis defense conducted before DRC. The committee evaluated the proposal and approved research registration.',
          createdAt: new Date('2024-03-01T15:00:00.000Z')
        }
      ],
      history: [
        {
          action: 'SUBMITTED',
          actorName: scholar.name,
          actorRole: 'STUDENT',
          documentUrl: '/uploads/theses/ayush_synopsis_proposal.pdf',
          plagiarismReportUrl: '/uploads/plagiarism/ayush_synopsis_turnitin.pdf',
          remarks: 'Submitted research synopsis proposal with Turnitin similarity verification report (Similarity Index: 3%).',
          timestamp: new Date('2024-02-10T10:00:00.000Z')
        },
        {
          action: 'SUPERVISOR_APPROVED',
          actorName: supervisor.name,
          actorRole: 'SUPERVISOR',
          remarks: 'Supervisor endorsement granted. Methodology, target loci, and Turnitin similarity index (3%) verified. Forwarded to HOD.',
          timestamp: new Date('2024-02-15T15:00:00.000Z')
        },
        {
          action: 'HOD_APPROVED',
          actorName: hod.name,
          actorRole: 'HOD',
          remarks: 'HOD sign-off completed. Synopsis successfully defended and approved by Departmental Research Committee.',
          timestamp: new Date('2024-03-01T15:00:00.000Z')
        }
      ]
    });

    // DRC Meeting for Synopsis
    await DRCMeeting.deleteMany({ thesisId: thesis._id });
    const drcMeeting = await DRCMeeting.create({
      scholarId: scholar._id,
      thesisId: thesis._id,
      title: 'Departmental Research Committee (DRC) Synopsis Defense & Topic Clearance',
      isSynopsisApproval: true,
      agenda: 'Oral defense and statutory scrutiny of Ph.D. research synopsis proposal of candidate Ayush Sood',
      scheduledDate: new Date('2024-02-28T10:00:00.000Z'),
      scheduledTime: '11:00 AM',
      venue: 'Department Council Room, Faculty of Forensic Science',
      committeeMembers: 'Prof. Mahinder Kumar (Chairperson & HOD), Dr. Pradeep Kumar (Supervisor), Prof. S. K. Gupta (External Subject Expert), DRC Members',
      status: 'APPROVED',
      remarks: 'The candidate defended the research synopsis proposal with distinction. Scope, ethical clearances, and experimental timeline were scrutinised and unanimously approved.'
    });
    console.log('✓ 3. Synopsis Milestone & DRC Meeting seeded & approved');

    // =========================================================================
    // STEP 4: RESEARCH DEGREE COMMITTEE (RDC) 6-MONTH REVIEWS (RACReview)
    // =========================================================================
    await RACReview.deleteMany({ thesisId: thesis._id });
    const rdcSessions = [
      {
        racNumber: 1,
        scheduledDate: new Date('2024-07-15T11:00:00.000Z'),
        committeeMembers: 'Prof. Mahinder Kumar (Chairperson), Dr. Pradeep Kumar (Supervisor), Prof. S. K. Roy (External Expert)',
        committeeChairedBy: 'Prof. Mahinder Kumar',
        status: 'SATISFACTORY',
        progressReportUrl: '/uploads/theses/ayush_rdc1_report.pdf',
        studentRemarks: 'Established laboratory protocols for high-yield biological sample DNA extraction and validated primer specificity.',
        remarks: 'Progress is highly satisfactory. Protocol validation and STR primer specificity verified.',
        researchProgress: 'Standardized extraction protocols for bone and dental remains. Completed multiplex primer panel synthesis.',
        nextMilestones: 'Initiate multiplex PCR thermal cycler optimization across 24 STR loci.',
        submissions: [
          {
            progressReportUrl: '/uploads/theses/ayush_rdc1_report.pdf',
            studentRemarks: 'RDC-1 Periodic Progress Report with electropherogram baseline data.',
            uploadedAt: new Date('2024-07-10T10:00:00.000Z')
          }
        ]
      },
      {
        racNumber: 2,
        scheduledDate: new Date('2025-01-20T11:00:00.000Z'),
        committeeMembers: 'Prof. Mahinder Kumar (Chairperson), Dr. Pradeep Kumar (Supervisor), Prof. S. K. Roy (External Expert)',
        committeeChairedBy: 'Prof. Mahinder Kumar',
        status: 'SATISFACTORY',
        progressReportUrl: '/uploads/theses/ayush_rdc2_report.pdf',
        studentRemarks: 'Optimized 24-plex multiplex PCR assay with high sensitivity down to 15 picograms of template DNA.',
        remarks: 'Assay optimization criteria met. Commended for robust sensitivity testing on degraded casework samples.',
        researchProgress: 'Achieved complete STR profile recovery from 92% of degraded skeletal specimens.',
        nextMilestones: 'Begin feature engineering and training machine learning phenotypic trait predictors.',
        submissions: [
          {
            progressReportUrl: '/uploads/theses/ayush_rdc2_report.pdf',
            studentRemarks: 'RDC-2 Progress Report with sensitivity titration curve data.',
            uploadedAt: new Date('2025-01-15T10:00:00.000Z')
          }
        ]
      },
      {
        racNumber: 3,
        scheduledDate: new Date('2025-07-22T11:00:00.000Z'),
        committeeMembers: 'Prof. Mahinder Kumar (Chairperson), Dr. Pradeep Kumar (Supervisor), Prof. S. K. Roy (External Expert)',
        committeeChairedBy: 'Prof. Mahinder Kumar',
        status: 'SATISFACTORY',
        progressReportUrl: '/uploads/theses/ayush_rdc3_report.pdf',
        studentRemarks: 'Trained ensemble machine learning models for eye, hair, and skin pigmentation prediction.',
        remarks: 'Outstanding experimental progress. Machine learning models demonstrated >94% AUC-ROC predictive accuracy.',
        researchProgress: 'Model cross-validation on North Indian population cohort completed successfully.',
        nextMilestones: 'Submit research findings to Scopus indexed Q1 peer-reviewed journal.',
        submissions: [
          {
            progressReportUrl: '/uploads/theses/ayush_rdc3_report.pdf',
            studentRemarks: 'RDC-3 Progress Report with ROC curves and confusion matrix evaluations.',
            uploadedAt: new Date('2025-07-18T10:00:00.000Z')
          }
        ]
      },
      {
        racNumber: 4,
        scheduledDate: new Date('2026-01-18T11:00:00.000Z'),
        committeeMembers: 'Prof. Mahinder Kumar (Chairperson), Dr. Pradeep Kumar (Supervisor), Prof. S. K. Roy (External Expert)',
        committeeChairedBy: 'Prof. Mahinder Kumar',
        status: 'SATISFACTORY',
        progressReportUrl: '/uploads/theses/ayush_rdc4_report.pdf',
        studentRemarks: 'Published research article in Forensic Science International: Genetics and presented at ISFG.',
        remarks: 'Exemplary output. Statutory publication requirements satisfied with high-impact publications.',
        researchProgress: 'Completed blind forensic casework trial simulations. Formulated preliminary thesis chapters.',
        nextMilestones: 'Finalize full thesis chapters and compile colloquium presentation deck.',
        submissions: [
          {
            progressReportUrl: '/uploads/theses/ayush_rdc4_report.pdf',
            studentRemarks: 'RDC-4 Progress Report with published journal reprints.',
            uploadedAt: new Date('2026-01-12T10:00:00.000Z')
          }
        ]
      },
      {
        racNumber: 5,
        scheduledDate: new Date('2026-05-20T11:00:00.000Z'),
        committeeMembers: 'Prof. Mahinder Kumar (Chairperson), Dr. Pradeep Kumar (Supervisor), Prof. S. K. Roy (External Expert)',
        committeeChairedBy: 'Prof. Mahinder Kumar',
        status: 'SATISFACTORY',
        progressReportUrl: '/uploads/theses/ayush_rdc5_report.pdf',
        studentRemarks: 'Completed doctoral thesis draft incorporating all committee recommendations across 6 chapters.',
        remarks: 'All Ph.D. research objectives achieved in full. Unanimously cleared for Pre-Submission Seminar Colloquium.',
        researchProgress: 'Full thesis chapters written. Turnitin similarity verified at 4%.',
        nextMilestones: 'Deliver departmental Pre-Submission Seminar Colloquium.',
        submissions: [
          {
            progressReportUrl: '/uploads/theses/ayush_rdc5_report.pdf',
            studentRemarks: 'RDC-5 Comprehensive synthesis report and chapter synopsis package.',
            uploadedAt: new Date('2026-05-15T10:00:00.000Z')
          }
        ]
      }
    ];

    for (const r of rdcSessions) {
      await RACReview.create({
        scholarId: scholar._id,
        thesisId: thesis._id,
        reviewerId: supervisor._id,
        ...r
      });
    }
    console.log(`✓ 4. Seeded ${rdcSessions.length} RDC Periodic Reviews (RDC-1 to RDC-5, all SATISFACTORY)`);

    // =========================================================================
    // STEP 5: 6-MONTH PROGRESS REPORTS (Milestones type: 6_MONTH_REPORT)
    // =========================================================================
    await Milestone.deleteMany({ thesisId: thesis._id, type: '6_MONTH_REPORT' });
    const progressReports = [
      {
        sequence: 1,
        title: '1st Six-Month Progress Report (Months 1–6)',
        feeFrom: '2023-06-01',
        feeTo: '2023-11-30',
        submittedAt: new Date('2023-12-10T10:00:00.000Z'),
        reviewedAt: new Date('2023-12-18T16:00:00.000Z'),
        doc: '/uploads/theses/ayush_progress_report_1.pdf',
        receipt: '/uploads/receipts/ayush_fee_sem1.pdf',
        supRemark: 'Coursework exams cleared and sample collection completed. Approved.',
        hodRemark: 'Progress report 1 verified by HOD.'
      },
      {
        sequence: 2,
        title: '2nd Six-Month Progress Report (Months 7–12)',
        feeFrom: '2023-12-01',
        feeTo: '2024-05-31',
        submittedAt: new Date('2024-06-10T10:00:00.000Z'),
        reviewedAt: new Date('2024-06-18T16:00:00.000Z'),
        doc: '/uploads/theses/ayush_progress_report_2.pdf',
        receipt: '/uploads/receipts/ayush_fee_sem2.pdf',
        supRemark: 'DNA extraction protocols and primer assays validated. Approved.',
        hodRemark: 'Progress report 2 verified by HOD.'
      },
      {
        sequence: 3,
        title: '3rd Six-Month Progress Report (Months 13–18)',
        feeFrom: '2024-06-01',
        feeTo: '2024-11-30',
        submittedAt: new Date('2024-12-12T10:00:00.000Z'),
        reviewedAt: new Date('2024-12-20T16:00:00.000Z'),
        doc: '/uploads/theses/ayush_progress_report_3.pdf',
        receipt: '/uploads/receipts/ayush_fee_sem3.pdf',
        supRemark: 'Multiplex PCR optimization completed across 24 loci. Approved.',
        hodRemark: 'Progress report 3 verified by HOD.'
      },
      {
        sequence: 4,
        title: '4th Six-Month Progress Report (Months 19–24)',
        feeFrom: '2024-12-01',
        feeTo: '2025-05-31',
        submittedAt: new Date('2025-06-14T10:00:00.000Z'),
        reviewedAt: new Date('2025-06-22T16:00:00.000Z'),
        doc: '/uploads/theses/ayush_progress_report_4.pdf',
        receipt: '/uploads/receipts/ayush_fee_sem4.pdf',
        supRemark: 'Machine learning phenotypic algorithms trained with >94% accuracy. Approved.',
        hodRemark: 'Progress report 4 verified by HOD.'
      },
      {
        sequence: 5,
        title: '5th Six-Month Progress Report (Months 25–30)',
        feeFrom: '2025-06-01',
        feeTo: '2025-11-30',
        submittedAt: new Date('2025-12-15T10:00:00.000Z'),
        reviewedAt: new Date('2025-12-23T16:00:00.000Z'),
        doc: '/uploads/theses/ayush_progress_report_5.pdf',
        receipt: '/uploads/receipts/ayush_fee_sem5.pdf',
        supRemark: 'Scopus Q1 journal papers published and patent filed. Approved.',
        hodRemark: 'Progress report 5 verified by HOD.'
      },
      {
        sequence: 6,
        title: '6th Six-Month Progress Report (Months 31–36)',
        feeFrom: '2025-12-01',
        feeTo: '2026-05-31',
        submittedAt: new Date('2026-06-05T10:00:00.000Z'),
        reviewedAt: new Date('2026-06-12T16:00:00.000Z'),
        doc: '/uploads/theses/ayush_progress_report_6.pdf',
        receipt: '/uploads/receipts/ayush_fee_sem6.pdf',
        supRemark: 'Comprehensive thesis draft compiled. Cleared for pre-submission. Approved.',
        hodRemark: 'Progress report 6 verified by HOD.'
      }
    ];

    for (const pr of progressReports) {
      await Milestone.create({
        thesisId: thesis._id,
        type: '6_MONTH_REPORT',
        sequence: pr.sequence,
        title: pr.title,
        status: 'APPROVED',
        documentUrl: pr.doc,
        submittedAt: pr.submittedAt,
        reviewedAt: pr.reviewedAt,
        feeDetails: {
          periodFrom: new Date(pr.feeFrom),
          periodTo: new Date(pr.feeTo),
          durationMonths: 6,
          durationDays: 0,
          totalFeeDeposited: 4500,
          remarks: `Semester ${pr.sequence} Ph.D. tuition and laboratory fee deposited and reconciled with Finance Branch.`,
          feeReceiptUrl: pr.receipt
        },
        comments: [
          {
            authorId: supervisor._id,
            authorName: supervisor.name,
            text: pr.supRemark,
            createdAt: pr.reviewedAt
          },
          {
            authorId: hod._id,
            authorName: hod.name,
            text: pr.hodRemark,
            createdAt: new Date(pr.reviewedAt.getTime() + 86400000)
          }
        ],
        history: [
          {
            action: 'SUBMITTED',
            actorName: scholar.name,
            actorRole: 'STUDENT',
            documentUrl: pr.doc,
            remarks: `Uploaded ${pr.title} with verified semester fee receipt.`,
            timestamp: pr.submittedAt
          },
          {
            action: 'SUPERVISOR_APPROVED',
            actorName: supervisor.name,
            actorRole: 'SUPERVISOR',
            documentUrl: pr.doc,
            remarks: pr.supRemark,
            timestamp: pr.reviewedAt
          },
          {
            action: 'HOD_APPROVED',
            actorName: hod.name,
            actorRole: 'HOD',
            documentUrl: pr.doc,
            remarks: pr.hodRemark,
            timestamp: new Date(pr.reviewedAt.getTime() + 86400000)
          }
        ]
      });
    }
    console.log(`✓ 5. Seeded ${progressReports.length} Six-Month Progress Reports (Sem 1 to 6, all APPROVED with fees & history)`);

    // =========================================================================
    // STEP 6: CHAPTER DRAFTS (Milestones type: CHAPTER_DRAFT)
    // =========================================================================
    await Milestone.deleteMany({ thesisId: thesis._id, type: 'CHAPTER_DRAFT' });
    const chapterDrafts = [
      {
        sequence: 1,
        title: 'Chapter 1: Introduction, Problem Formulation & Research Objectives',
        submittedAt: new Date('2025-02-10T10:00:00.000Z'),
        reviewedAt: new Date('2025-02-20T15:00:00.000Z'),
        doc: '/uploads/theses/ayush_chapter1_draft.pdf',
        supRemark: 'Introduction clearly contextualizes current limitations in cold-case skeletal STR profiling. Research objectives are sharply articulated. Approved.',
        hodRemark: 'Chapter 1 framework and scope verified by HOD.'
      },
      {
        sequence: 2,
        title: 'Chapter 2: Comprehensive Review of Global & National Literature',
        submittedAt: new Date('2025-05-15T10:00:00.000Z'),
        reviewedAt: new Date('2025-05-25T15:00:00.000Z'),
        doc: '/uploads/theses/ayush_chapter2_draft.pdf',
        supRemark: 'Comprehensive survey of over 280 peer-reviewed articles covering STRs, SNPs, and massively parallel sequencing. Approved.',
        hodRemark: 'Literature review depth and theoretical synthesis endorsed by HOD.'
      },
      {
        sequence: 3,
        title: 'Chapter 3: Materials, Methodology & DNA Extraction Protocols',
        submittedAt: new Date('2025-09-10T10:00:00.000Z'),
        reviewedAt: new Date('2025-09-20T15:00:00.000Z'),
        doc: '/uploads/theses/ayush_chapter3_draft.pdf',
        supRemark: 'Detailed demographical sampling protocols and demilitarized biological bone extraction methods described with reproducible rigor. Approved.',
        hodRemark: 'Methodological standards and ethics adherence approved.'
      },
      {
        sequence: 4,
        title: 'Chapter 4: Multiplex PCR Assay Optimization & Population Genotyping',
        submittedAt: new Date('2025-12-05T10:00:00.000Z'),
        reviewedAt: new Date('2025-12-15T15:00:00.000Z'),
        doc: '/uploads/theses/ayush_chapter4_draft.pdf',
        supRemark: 'Electropherograms, peak balance ratios, and thermal cycler conditions documented with empirical precision across 24 loci. Approved.',
        hodRemark: 'Empirical data validation approved by HOD.'
      },
      {
        sequence: 5,
        title: 'Chapter 5: Machine Learning Phenotypic Prediction & Statistical Modeling',
        submittedAt: new Date('2026-03-02T10:00:00.000Z'),
        reviewedAt: new Date('2026-03-12T15:00:00.000Z'),
        doc: '/uploads/theses/ayush_chapter5_draft.pdf',
        supRemark: 'Ensemble model architectures, hyperparameter grids, cross-validation metrics, and feature importance rankings are mathematically sound. Approved.',
        hodRemark: 'Computational genomics models and accuracy benchmarks endorsed.'
      },
      {
        sequence: 6,
        title: 'Chapter 6: Results, Discussion, Forensic Case Simulations & Conclusion',
        submittedAt: new Date('2026-05-18T10:00:00.000Z'),
        reviewedAt: new Date('2026-05-28T15:00:00.000Z'),
        doc: '/uploads/theses/ayush_chapter6_draft.pdf',
        supRemark: 'Blind validation case studies show practical utility in criminal investigations. Final synthesis and recommendations are thoroughly argued. Approved.',
        hodRemark: 'Full chapter series cleared for Pre-Submission Colloquium compilation.'
      }
    ];

    for (const ch of chapterDrafts) {
      await Milestone.create({
        thesisId: thesis._id,
        type: 'CHAPTER_DRAFT',
        sequence: ch.sequence,
        title: ch.title,
        status: 'APPROVED',
        documentUrl: ch.doc,
        forwardedTo: supervisor._id,
        forwardedRole: 'SUPERVISOR',
        submittedAt: ch.submittedAt,
        reviewedAt: ch.reviewedAt,
        comments: [
          {
            authorId: supervisor._id,
            authorName: supervisor.name,
            text: ch.supRemark,
            createdAt: ch.reviewedAt
          },
          {
            authorId: hod._id,
            authorName: hod.name,
            text: ch.hodRemark,
            createdAt: new Date(ch.reviewedAt.getTime() + 86400000)
          }
        ],
        history: [
          {
            action: 'SUBMITTED',
            actorName: scholar.name,
            actorRole: 'STUDENT',
            documentUrl: ch.doc,
            remarks: `Uploaded ${ch.title} for supervisor review.`,
            timestamp: ch.submittedAt
          },
          {
            action: 'SUPERVISOR_APPROVED',
            actorName: supervisor.name,
            actorRole: 'SUPERVISOR',
            documentUrl: ch.doc,
            remarks: ch.supRemark,
            timestamp: ch.reviewedAt
          },
          {
            action: 'HOD_APPROVED',
            actorName: hod.name,
            actorRole: 'HOD',
            documentUrl: ch.doc,
            remarks: ch.hodRemark,
            timestamp: new Date(ch.reviewedAt.getTime() + 86400000)
          }
        ]
      });
    }
    console.log(`✓ 6. Seeded ${chapterDrafts.length} Chapter Drafts (Chapters 1 to 6, all APPROVED with history)`);

    // =========================================================================
    // STEP 7: RESEARCH OUTPUTS & PUBLICATIONS (Publication model)
    // =========================================================================
    await Publication.deleteMany({ thesisId: thesis._id });
    const publications = [
      {
        thesisId: thesis._id,
        scholarId: scholar._id,
        type: 'JOURNAL',
        title: 'High-Throughput Forensic DNA Phenotyping for Pigmentation and Biogeographical Ancestry in North Indian Cohorts',
        journalName: 'Forensic Science International: Genetics',
        issn: '1872-4973',
        indexing: 'SCOPUS',
        impactFactor: 4.88,
        itemStatus: 'Published',
        volume: '58',
        issue: '2',
        pages: '102-118',
        doiUrl: '10.1016/j.fsigen.2024.102654',
        paperLink: 'https://doi.org/10.1016/j.fsigen.2024.102654',
        publicationDate: new Date('2024-09-15T00:00:00.000Z'),
        documentUrl: '/uploads/publications/ayush_fsigen_paper.pdf',
        status: 'VERIFIED',
        remarks: 'Scopus Q1 journal publication verified and signed off for Ph.D. degree requirement.'
      },
      {
        thesisId: thesis._id,
        scholarId: scholar._id,
        type: 'JOURNAL',
        title: 'Machine Learning Frameworks for Predicting Physical Phenotypic Traits from Low-Template Degraded Skeletal DNA',
        journalName: 'International Journal of Legal Medicine',
        issn: '0937-9827',
        indexing: 'SCOPUS',
        impactFactor: 3.25,
        itemStatus: 'Published',
        volume: '139',
        issue: '1',
        pages: '45-59',
        doiUrl: '10.1007/s00414-025-03120-x',
        paperLink: 'https://doi.org/10.1007/s00414-025-03120-x',
        publicationDate: new Date('2025-04-10T00:00:00.000Z'),
        documentUrl: '/uploads/publications/ayush_ijlm_paper.pdf',
        status: 'VERIFIED',
        remarks: 'Verified by Supervisor and cleared by HOD. Mandatory doctoral publication criteria cleared.'
      },
      {
        thesisId: thesis._id,
        scholarId: scholar._id,
        type: 'CONFERENCE',
        title: 'Optimization of 24-Plex SNP Assay for Forensic Cold Case Identification',
        conferenceName: '30th Congress of the International Society for Forensic Genetics (ISFG 2024)',
        organizer: 'International Society for Forensic Genetics',
        venueLocation: 'Santiago de Compostela, Spain & Hybrid',
        indexing: 'SCOPUS',
        itemStatus: 'Presented',
        volume: 'ISFG-2024-Proceedings',
        issn: 'ISFG-CONF-2024',
        publicationDate: new Date('2024-09-05T00:00:00.000Z'),
        documentUrl: '/uploads/publications/ayush_isfg_presentation.pdf',
        status: 'VERIFIED',
        remarks: 'International conference presentation delivered and verified by Departmental Research Committee.'
      },
      {
        thesisId: thesis._id,
        scholarId: scholar._id,
        type: 'CONFERENCE',
        title: 'Deep Learning Predictive Modeling for Forensic Craniofacial Reconstruction',
        conferenceName: 'Annual National Conference of the Indian Academy of Forensic Medicine (IAFM 2025)',
        organizer: 'Indian Academy of Forensic Medicine',
        venueLocation: 'New Delhi, India',
        indexing: 'UGC_CARE',
        itemStatus: 'Presented',
        volume: 'IAFM-2025-Paper-44',
        issn: 'IAFM-CONF-2025',
        publicationDate: new Date('2025-02-18T00:00:00.000Z'),
        documentUrl: '/uploads/publications/ayush_iafm_certificate.pdf',
        status: 'VERIFIED',
        remarks: 'National conference oral presentation delivered. Awarded Best Research Presentation Commendation.'
      },
      {
        thesisId: thesis._id,
        scholarId: scholar._id,
        type: 'PUBLICATION',
        articleType: 'Book Chapter',
        publicationCategory: 'Book Chapter',
        title: 'Emerging Paradigms in Molecular Forensics: From STRs to Massively Parallel Sequencing',
        publisherName: 'Springer Nature Protocols in Forensic Molecular Biology',
        isbn: '978-981-19-4560-8',
        pages: '230-258',
        publicationDate: new Date('2025-06-20T00:00:00.000Z'),
        documentUrl: '/uploads/publications/ayush_springer_chapter.pdf',
        status: 'VERIFIED',
        remarks: 'Peer-reviewed book chapter publication verified and cleared.'
      },
      {
        thesisId: thesis._id,
        scholarId: scholar._id,
        type: 'PATENT',
        iprType: 'Patent',
        title: 'A Portable Multiplex PCR Microfluidic Cartridge for Rapid On-Site Forensic Human DNA Phenotyping',
        applicationNo: '202511048921 A',
        applicant: 'Himachal Pradesh University & Ayush Sood',
        journalName: 'Indian Patent Office Journal',
        volume: 'Ayush Sood, Dr. Pradeep Kumar',
        issn: '202511048921 A',
        pages: 'India',
        itemStatus: 'Published / Filed',
        publicationDate: new Date('2025-11-12T00:00:00.000Z'),
        documentUrl: '/uploads/publications/ayush_patent_certificate.pdf',
        status: 'VERIFIED',
        remarks: 'Indian Patent publication gazette verified by IPR Cell and endorsed by HOD.'
      }
    ];

    for (const pub of publications) {
      await Publication.create(pub);
    }
    console.log(`✓ 7. Seeded ${publications.length} Research Outputs (2 Journals, 2 Conferences, 1 Book Chapter, 1 Patent, all VERIFIED)`);

    // =========================================================================
    // STEP 8: FUNDING AWARD & RESEARCH LAB (FundingAward & ResearchLab models)
    // =========================================================================
    await FundingAward.deleteMany({ scholarId: scholar._id });
    
    // Generate 14 months of disbursement ledger per DisbursementEntrySchema
    const ledger = [];
    const months = [
      'June 2023', 'July 2023', 'August 2023', 'September 2023', 'October 2023', 'November 2023',
      'December 2023', 'January 2024', 'February 2024', 'March 2024', 'April 2024', 'May 2024',
      'June 2024', 'July 2024'
    ];
    let refNum = 8801;
    for (let i = 0; i < months.length; i++) {
      const year = i < 7 ? 2023 : 2024;
      const monthIdx = i < 7 ? (5 + i) : (i - 7);
      const disDate = new Date(year, monthIdx + 1, 5);
      ledger.push({
        monthYear: months[i],
        amount: 37000,
        amountFormatted: '₹37,000',
        status: 'DISBURSED',
        disbursedAt: disDate,
        referenceNo: `PFMS/HPU/JRF/${year}/${refNum++}`,
        remarks: 'DBT PFMS direct bank transfer cleared and reconciled by finance branch.',
        disbursedBy: hod._id
      });
    }

    const fundingAward = await FundingAward.create({
      scholarId: scholar._id,
      thesisId: thesis._id,
      awardTitle: 'UGC-NET Junior Research Fellowship (JRF / SRF in Forensic Science)',
      monthlyStipend: '₹37,000 / Month + 16% HRA',
      amountSanctioned: '₹15,80,000',
      amountDisbursed: '₹6,28,880',
      startDate: new Date('2023-06-01T00:00:00.000Z'),
      endDate: new Date('2026-05-31T00:00:00.000Z'),
      status: 'ACTIVE',
      awardedBy: hod._id,
      remarks: 'Awarded under UGC National Eligibility Test (NET-JRF). Verified by HOD and Finance Branch.',
      disbursementLedger: ledger
    });

    // Research Lab
    let lab = await ResearchLab.findOne({ leadId: supervisor._id });
    if (!lab) {
      lab = new ResearchLab({
        name: 'Advanced Forensic Genomics & Molecular Phenotyping Laboratory',
        department: 'Forensic Science',
        leadId: supervisor._id,
        focus: 'Human DNA Phenotyping, STR Genotyping & Machine Learning Crime Reconstruction',
        projects: ['Forensic STR Allelic Ladder Validation', 'Degraded Skeletal DNA Phenotyping', 'Cold Case Molecular Identification'],
        status: 'Active Lab',
        description: 'State-of-the-art specialized university research laboratory for high-throughput genomic analysis, forensic casework simulations, and DNA biomarker validation.',
        members: [scholar._id],
        researchAreas: ['Forensic STR Profiling', 'Phenotypic SNP Panels', 'Degraded Biomass Genomics'],
        equipment: [
          { name: 'Applied Biosystems 3500 Genetic Analyzer (24-Capillary)', description: 'High-resolution capillary electrophoresis', isShared: false },
          { name: 'Illumina MiSeq FGx Forensic Genomics System', description: 'Next-generation sequencing for targeted STR & SNP panels', isShared: true },
          { name: 'QuantStudio 5 Real-Time PCR System', description: 'Quantitative human DNA assay and degradation assessment', isShared: false },
          { name: 'Qubit 4 Fluorometer & Fragment Analyzer', description: 'High-sensitivity fluorometric DNA quantification', isShared: false },
          { name: 'Eppendorf Mastercycler X50 High-Performance Cyclers', description: 'Gradient thermal cyclers for multiplex PCR', isShared: true }
        ],
        location: 'Room 304, Bio-Science Complex, Summer Hill Campus, HPU',
        establishedYear: 2018,
        labType: 'Departmental',
        contactEmail: 'forensic.lab@hpuniv.ac.in'
      });
    } else {
      if (!lab.members.includes(scholar._id)) {
        lab.members.push(scholar._id);
      }
    }
    await lab.save();
    console.log(`✓ 8. Seeded Funding Award (14 months ledger disbursed) & mapped Research Lab (${lab.name})`);

    // =========================================================================
    // STEP 9: GUIDANCE & CONSULTATION MEETINGS (Meeting model)
    // =========================================================================
    await Meeting.deleteMany({ scholarId: scholar._id });
    const meetings = [
      {
        scholarId: scholar._id,
        thesisId: thesis._id,
        date: new Date('2024-03-12T11:00:00.000Z'),
        time: '11:00 AM',
        reason: 'Detailed consultation on STR primer design, multiplex PCR annealing curves, and ethical clearance guidelines.',
        invitedAttendees: [supervisor._id],
        attendees: [supervisor._id],
        department: 'Forensic Science',
        status: 'APPROVED',
        remarks: 'Meeting held. Primer sets validated. Cleared for laboratory oligonucleotide synthesis.',
        responseLogs: [
          {
            user: supervisor._id,
            action: 'ACCEPT',
            timestamp: new Date('2024-03-10T14:00:00.000Z')
          }
        ]
      },
      {
        scholarId: scholar._id,
        thesisId: thesis._id,
        date: new Date('2024-10-18T14:30:00.000Z'),
        time: '02:30 PM',
        reason: 'Troubleshooting electropherogram baseline noise and peak height ratios on 3500 Genetic Analyzer.',
        invitedAttendees: [supervisor._id],
        attendees: [supervisor._id],
        department: 'Forensic Science',
        status: 'APPROVED',
        remarks: 'Meeting concluded. Formamide denaturation protocol modified; resolution problem resolved.',
        responseLogs: [
          {
            user: supervisor._id,
            action: 'ACCEPT',
            timestamp: new Date('2024-10-16T11:00:00.000Z')
          }
        ]
      },
      {
        scholarId: scholar._id,
        thesisId: thesis._id,
        date: new Date('2025-05-14T10:30:00.000Z'),
        time: '10:30 AM',
        reason: 'Joint review of machine learning feature selection methods and Forensic Science International manuscript.',
        invitedAttendees: [supervisor._id, hod._id],
        attendees: [supervisor._id, hod._id],
        department: 'Forensic Science',
        status: 'APPROVED',
        remarks: 'Joint consultation conducted. Manuscript approved for final submission to FSI Genetics.',
        responseLogs: [
          {
            user: supervisor._id,
            action: 'ACCEPT',
            timestamp: new Date('2025-05-12T16:00:00.000Z')
          },
          {
            user: hod._id,
            action: 'ACCEPT',
            timestamp: new Date('2025-05-13T09:30:00.000Z')
          }
        ]
      },
      {
        scholarId: scholar._id,
        thesisId: thesis._id,
        date: new Date('2026-04-20T15:00:00.000Z'),
        time: '03:00 PM',
        reason: 'Pre-Submission colloquium review and thesis chapters compilation check.',
        invitedAttendees: [supervisor._id],
        attendees: [supervisor._id],
        department: 'Forensic Science',
        status: 'APPROVED',
        remarks: 'Chapters inspected. Formatting adheres strictly to university doctoral guidelines. Cleared for pre-submission.',
        responseLogs: [
          {
            user: supervisor._id,
            action: 'ACCEPT',
            timestamp: new Date('2026-04-18T10:00:00.000Z')
          }
        ]
      }
    ];

    for (const m of meetings) {
      await Meeting.create(m);
    }
    console.log(`✓ 9. Seeded ${meetings.length} Guidance & Advisory Meetings (all APPROVED with response logs)`);

    // =========================================================================
    // STEP 9B: PRE-SUBMISSION & FINAL SUBMISSION MILESTONES
    // =========================================================================
    await Milestone.deleteMany({ thesisId: thesis._id, type: { $in: ['PRE_SUBMISSION', 'FINAL_SUBMISSION'] } });
    
    // Pre-Submission Milestone
    await Milestone.create({
      thesisId: thesis._id,
      type: 'PRE_SUBMISSION',
      sequence: 99,
      title: 'Pre-Submission Thesis & Plagiarism Clearance Package',
      status: 'APPROVED',
      documentUrl: '/uploads/theses/ayush_presubmission_draft.pdf',
      plagiarismReportUrl: '/uploads/plagiarism/ayush_turnitin_clearance.pdf',
      submittedAt: new Date('2026-06-15T10:00:00.000Z'),
      reviewedAt: new Date('2026-06-25T15:30:00.000Z'),
      comments: [
        {
          authorId: supervisor._id,
          authorName: supervisor.name,
          text: 'Verified rough thesis draft and Turnitin similarity index (4%). Plagiarism criteria cleared. Recommended for departmental pre-submission colloquium defense.',
          createdAt: new Date('2026-06-20T11:30:00.000Z')
        },
        {
          authorId: hod._id,
          authorName: hod.name,
          text: 'Endorsed by HOD. Pre-submission seminar colloquium defense presentation approved and cleared.',
          createdAt: new Date('2026-06-25T15:30:00.000Z')
        }
      ],
      history: [
        {
          action: 'SUBMITTED',
          actorName: scholar.name,
          actorRole: 'STUDENT',
          documentUrl: '/uploads/theses/ayush_presubmission_draft.pdf',
          plagiarismReportUrl: '/uploads/plagiarism/ayush_turnitin_clearance.pdf',
          remarks: 'Submitted rough thesis draft with Turnitin similarity report (similarity index: 4%).',
          timestamp: new Date('2026-06-15T10:00:00.000Z')
        },
        {
          action: 'SUPERVISOR_APPROVED',
          actorName: supervisor.name,
          actorRole: 'SUPERVISOR',
          documentUrl: '/uploads/theses/ayush_presubmission_draft.pdf',
          plagiarismReportUrl: '/uploads/plagiarism/ayush_turnitin_clearance.pdf',
          remarks: 'Supervisor digital verification completed. Approved and forwarded to HOD for pre-submission seminar scheduling.',
          timestamp: new Date('2026-06-20T11:30:00.000Z')
        },
        {
          action: 'HOD_APPROVED',
          actorName: hod.name,
          actorRole: 'HOD',
          documentUrl: '/uploads/theses/ayush_presubmission_draft.pdf',
          plagiarismReportUrl: '/uploads/plagiarism/ayush_turnitin_clearance.pdf',
          remarks: 'HOD clearance granted. Pre-submission seminar scheduled and cleared.',
          timestamp: new Date('2026-06-25T15:30:00.000Z')
        }
      ]
    });

    // Final Submission Milestone
    await Milestone.create({
      thesisId: thesis._id,
      type: 'FINAL_SUBMISSION',
      sequence: 100,
      title: 'Final Complete Bound Thesis Submission Package',
      status: 'APPROVED',
      documentUrl: '/uploads/theses/ayush_final_bound_thesis.pdf',
      plagiarismReportUrl: '/uploads/plagiarism/ayush_final_turnitin_clearance.pdf',
      submittedAt: new Date('2026-07-28T11:00:00.000Z'),
      reviewedAt: new Date('2026-08-05T16:00:00.000Z'),
      comments: [
        {
          authorId: supervisor._id,
          authorName: supervisor.name,
          text: 'Verified incorporation of all colloquium expert recommendations. Final bound thesis formatted according to university doctoral guidelines. Fully endorsed and signed off.',
          createdAt: new Date('2026-08-01T14:30:00.000Z')
        },
        {
          authorId: hod._id,
          authorName: hod.name,
          text: 'Verified supervisor sign-off and similarity compliance. Cleared for external university examiner evaluation and dispatch.',
          createdAt: new Date('2026-08-05T16:00:00.000Z')
        }
      ],
      history: [
        {
          action: 'SUBMITTED',
          actorName: scholar.name,
          actorRole: 'STUDENT',
          documentUrl: '/uploads/theses/ayush_final_bound_thesis.pdf',
          plagiarismReportUrl: '/uploads/plagiarism/ayush_final_turnitin_clearance.pdf',
          remarks: 'Uploaded final bound thesis incorporating colloquium suggestions with final similarity verification.',
          timestamp: new Date('2026-07-28T11:00:00.000Z')
        },
        {
          action: 'SUPERVISOR_APPROVED',
          actorName: supervisor.name,
          actorRole: 'SUPERVISOR',
          documentUrl: '/uploads/theses/ayush_final_bound_thesis.pdf',
          plagiarismReportUrl: '/uploads/plagiarism/ayush_final_turnitin_clearance.pdf',
          remarks: 'Supervisor digital verification completed. Approved and endorsed for HOD clearance.',
          timestamp: new Date('2026-08-01T14:30:00.000Z')
        },
        {
          action: 'HOD_APPROVED',
          actorName: hod.name,
          actorRole: 'HOD',
          documentUrl: '/uploads/theses/ayush_final_bound_thesis.pdf',
          plagiarismReportUrl: '/uploads/plagiarism/ayush_final_turnitin_clearance.pdf',
          remarks: 'HOD clearance granted. Approved for external examiner dispatch and adjudication.',
          timestamp: new Date('2026-08-05T16:00:00.000Z')
        },
        {
          action: 'EXTERNAL_EVALUATION_DISPATCHED',
          actorName: hod.name,
          actorRole: 'HOD',
          remarks: `Thesis package dispatched to external examiners.\n` +
                   `• Dispatched To: Prof. S. K. Roy (IIT Roorkee), Prof. N. Sharma (JNU New Delhi)\n` +
                   `• Dispatch Method: Speed Post (Registered Airmail)\n` +
                   `• Date Dispatched: 10/08/2026\n` +
                   `• Tracking Reference Code: HPU-EXAM-PHD-2026-9844`,
          timestamp: new Date('2026-08-10T10:00:00.000Z')
        },
        {
          action: 'EXTERNAL_EVALUATION_SUCCESSFUL',
          actorName: hod.name,
          actorRole: 'HOD',
          remarks: `External evaluation reports successfully logged.\n` +
                   `• Result: PASSED (Clear & Satisfactory)\n` +
                   `• Dispatched To: Prof. S. K. Roy (IIT Roorkee), Prof. N. Sharma (JNU New Delhi)\n` +
                   `• Date Dispatched: 10/08/2026\n` +
                   `• Evaluator Remarks & Feedback: All external examiner reports received with Category-A commendation. Both examiners unconditionally recommended the thesis for the award of the Ph.D. degree subject to viva-voce examination.`,
          timestamp: new Date('2026-08-30T11:30:00.000Z')
        },
        {
          action: 'VIVA_SCHEDULED',
          actorName: hod.name,
          actorRole: 'HOD',
          remarks: `Viva-Voce scheduled to be conducted.\n` +
                   `• Date: 12/09/2026\n` +
                   `• Time: 11:30 AM\n` +
                   `• Venue: Senate Committee Hall & Google Meet Hybrid\n` +
                   `• Convenor/Coordinator: Prof. Mahinder Kumar\n` +
                   `• Panel Members: Prof. S. K. Roy (External Examiner, IIT Roorkee), Prof. Mahinder Kumar (HOD & Chairperson), Dr. Pradeep Kumar (Supervisor)\n` +
                   `• Meeting Link: https://meet.google.com/phd-ayush-viva`,
          timestamp: new Date('2026-09-02T10:00:00.000Z')
        },
        {
          action: 'VIVA_SUCCESSFUL',
          actorName: hod.name,
          actorRole: 'HOD',
          remarks: `Viva-Voce outcome recorded.\n` +
                   `• Outcome: PASSED (Clear & Pass)\n` +
                   `• Date Conducted: 12/09/2026\n` +
                   `• Time: 11:30 AM\n` +
                   `• Venue: Senate Committee Hall & Google Meet Hybrid\n` +
                   `• Convenor/Coordinator: Prof. Mahinder Kumar\n` +
                   `• Panel Members: Prof. S. K. Roy (External Examiner, IIT Roorkee), Prof. Mahinder Kumar (HOD & Chairperson), Dr. Pradeep Kumar (Supervisor)\n` +
                   `• Meeting Link: https://meet.google.com/phd-ayush-viva\n` +
                   `• Board Decision Notes: The candidate defended the research thesis before the board with exemplary proficiency and domain mastery. All inquiries from the external examiner and faculty were thoroughly and satisfactorily answered. Unanimously recommended for the Ph.D. degree award.`,
          timestamp: new Date('2026-09-12T13:00:00.000Z')
        }
      ]
    });
    console.log('✓ 9B. Seeded Pre-Submission & Final Submission Milestones (both APPROVED with full evaluation & viva history)');

    // =========================================================================
    // STEP 10: CHANGE REQUESTS (ChangeRequest model)
    // =========================================================================
    await ChangeRequest.deleteMany({ thesisId: thesis._id });
    const changeReq = await ChangeRequest.create({
      scholarId: scholar._id,
      thesisId: thesis._id,
      type: 'TITLE_CHANGE',
      currentValue: 'Forensic DNA Phenotyping: Methods and Computational Models',
      proposedValue: 'Advanced Computational DNA Profiling & Molecular Phenotyping in Forensic Investigations',
      reason: 'Incorporated specific STR loci profiling and machine learning phenotypic prediction scope as recommended by the Research Degree Committee review panel.',
      status: 'APPROVED',
      remarks: 'Title refinement examined and approved by Departmental Research Committee and endorsed by HOD.'
    });
    console.log('✓ 10. Seeded Change Request (TITLE_CHANGE, APPROVED by HOD)');

    // =========================================================================
    // STEP 11: ADDITIONAL DOCUMENTS (AdditionalDocument model)
    // =========================================================================
    await AdditionalDocument.deleteMany({ scholarId: scholar._id });
    const addDocs = [
      {
        scholarId: scholar._id,
        thesisId: thesis._id,
        title: 'Institutional Human Ethics Committee (IHEC) Clearance Certificate',
        description: 'Official ethical clearance for collection and analysis of anonymized human biological samples (Ref: HPU/IEC/2023/118).',
        documentUrl: '/uploads/documents/ayush_ethics_clearance.pdf',
        forwardedTo: supervisor._id,
        forwardedRole: 'SUPERVISOR',
        department: 'Forensic Science',
        status: 'REVIEWED',
        remarks: 'Verified. Ethical clearance complies with ICMR standards and university bioethics regulations.'
      },
      {
        scholarId: scholar._id,
        thesisId: thesis._id,
        title: 'Central Instrumentation Facility (CIF) Laser Confocal & Genetic Analyzer Clearance',
        description: 'Instrument access log, calibration certification, and sample throughput validation from Central Research Facility.',
        documentUrl: '/uploads/documents/ayush_cif_clearance.pdf',
        forwardedTo: supervisor._id,
        forwardedRole: 'SUPERVISOR',
        department: 'Forensic Science',
        status: 'REVIEWED',
        remarks: 'Verified. CIF user logs and equipment maintenance clearances confirmed.'
      },
      {
        scholarId: scholar._id,
        thesisId: thesis._id,
        title: 'University Central Library & Departmental No-Dues Certificate',
        description: 'Official No-Dues clearance from HPU Central Library and Departmental Reading Room.',
        documentUrl: '/uploads/documents/ayush_library_nodues.pdf',
        forwardedTo: hod._id,
        forwardedRole: 'HOD',
        department: 'Forensic Science',
        status: 'REVIEWED',
        remarks: 'Approved. All borrowed monographs, thesis volumes, and reference manuals returned. Zero outstanding dues.'
      },
      {
        scholarId: scholar._id,
        thesisId: thesis._id,
        title: 'Laboratory Chemical & Biological Safety Compliance Sign-Off',
        description: 'Hazardous reagent disposal, biohazard containment, and BSL-2 laboratory safety compliance sign-off.',
        documentUrl: '/uploads/documents/ayush_biosafety_signoff.pdf',
        forwardedTo: supervisor._id,
        forwardedRole: 'SUPERVISOR',
        department: 'Forensic Science',
        status: 'REVIEWED',
        remarks: 'Inspected and verified. Laboratory waste handling followed biosafety level-2 protocols.'
      }
    ];

    for (const d of addDocs) {
      await AdditionalDocument.create(d);
    }
    console.log(`✓ 11. Seeded ${addDocs.length} Additional Documents (all REVIEWED with supervisor/HOD remarks)`);

    // =========================================================================
    // STEP 12: NOTIFICATIONS
    // =========================================================================
    await Notification.deleteMany({ recipient: scholar._id });
    const notifications = [
      {
        recipient: scholar._id,
        title: '🎓 Ph.D. Degree Awarded! Congratulations Doctor!',
        message: `Congratulations, Dr. ${scholar.name}! Your Ph.D. degree on "${thesis.title}" has been officially awarded by Himachal Pradesh University Academic Council!`,
        type: 'SUCCESSFUL_ACTION',
        link: 'overview'
      },
      {
        recipient: scholar._id,
        title: '🎉 Viva-Voce Defense Passed with Commendation',
        message: 'The examination board recorded your viva-voce defense as SUCCESSFUL and unanimously recommended you for the degree award.',
        type: 'SUCCESSFUL_ACTION',
        link: 'finalSubmission'
      },
      {
        recipient: scholar._id,
        title: '📚 Coursework Verified & Certified',
        message: 'Your coursework examination scorecards have been certified and approved by Supervisor and HOD.',
        type: 'SUCCESSFUL_ACTION',
        link: 'coursework'
      },
      {
        recipient: scholar._id,
        title: '🔬 RDC Progress Clearances',
        message: 'All 5 periodic Research Degree Committee (RDC) reviews have been completed and marked SATISFACTORY.',
        type: 'SUCCESSFUL_ACTION',
        link: 'rac'
      }
    ];

    for (const n of notifications) {
      await Notification.create(n);
    }
    console.log(`✓ 12. Created celebratory and milestone notifications`);

    console.log('\n================================================================');
    console.log('🌟 COMPLETE STUDENT DASHBOARD SEEDING COMPLETED FOR AYUSHTEST@GMAIL.COM');
    console.log('================================================================');
    console.log('All dashboard tabs are seeded with rich, realistic, verified data:');
    console.log('  1. Overview:        100% Progress, Milestone Timeline, Next Action');
    console.log('  2. Profile:         Complete demographics, qualification & enrollment');
    console.log('  3. Early Stage:     Active Workspace & All Milestone Records');
    console.log('  4. Coursework:      4 Subjects (Marks: 88, 92, 85, 90), Approved by Supervisor & HOD');
    console.log('  5. Synopsis:        Synopsis Proposal (Turnitin 3%), Approved by Supervisor & HOD, DRC Defense');
    console.log('  6. RDC (6-Month):   5 RDC Review Sessions, all SATISFACTORY with reports & recommendations');
    console.log('  7. 6-Month Reports: 6 Progress Reports (Sem 1 to 6), all APPROVED with Fee Details & Proofs');
    console.log('  8. Chapter Drafts:  6 Chapter Drafts (Chapters 1 to 6), all APPROVED with complete workflow history');
    console.log('  9. Research Outputs:2 Scopus Q1 Journals, 2 Conferences, 1 Book Chapter, 1 Patent (all VERIFIED)');
    console.log(' 10. Funding & Lab:   Active UGC-NET JRF/SRF Award, 14 Months Disbursement Ledger & Advanced Genomics Lab');
    console.log(' 11. Meetings:        4 Supervisor Guidance & Advisory Meetings (all APPROVED with Response Logs)');
    console.log(' 12. Pre-Submission:  Rough Draft (Turnitin 4%), Approved by Supervisor & HOD, Seminar CLEARED');
    console.log(' 13. Final Submission:Final Bound Thesis, Dispatched via Speed Post, External Reports SUCCESSFUL, Viva SUCCESSFUL');
    console.log(' 14. Request Changes: 1 Approved Title Change Request with HOD Remarks');
    console.log(' 15. Documents:       4 Clearances (Ethics, CIF, Library No-Dues, Bio-Safety), all REVIEWED');
    console.log(' 16. Certificates:    All 4 Academic Credentials Unlocked & Downloadable');
    console.log('================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Fatal error during seeding:', err);
    process.exit(1);
  }
}

seedCompleteScholarData();
