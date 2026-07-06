require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Thesis = require('./models/Thesis');
const Milestone = require('./models/Milestone');
const Publication = require('./models/Publication');
const RACReview = require('./models/RACReview');
const Notification = require('./models/Notification');

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database!');

    // 0. Disable the existing HOD for Forensic Science to avoid uniqueness constraints
    console.log('Checking for existing HOD in Forensic Science...');
    const existingHod = await User.findOne({
      role: 'HOD',
      department: 'Department of Forensic Science',
      isActive: true
    });
    if (existingHod) {
      console.log(`Deactivating existing HOD: ${existingHod.username}`);
      existingHod.isActive = false;
      await existingHod.save();
    }

    // Also deactivate old student/faculty if they exist to avoid duplicate usernames
    await User.deleteMany({
      username: { $in: ['ayushsood@gmail.com', 'pradeepkumar@gmail.com', 'mahinderkumar@gmail.com'] }
    });

    console.log('Creating users...');

    // 1. Create HOD User
    const hod = await User.create({
      name: 'Prof. Mahinder Kumar',
      username: 'mahinderkumar@gmail.com',
      password: 'password',
      role: 'HOD',
      department: 'Department of Forensic Science',
      isActive: true,
      isVerified: true,
      profileCompleted: true,
      profile: {
        phoneNumber: '+91 94180-12345',
        designation: 'Professor & Head',
        specialization: 'Forensic Toxicology & Serology',
        officeRoom: 'Room 204, Forensic Sciences Building',
        yearsOfService: 18,
        dob: '1972-04-15',
        gender: 'Male',
        nationality: 'Indian'
      }
    });
    console.log(`Created HOD: ${hod.name} (${hod._id})`);

    // 2. Create Faculty User
    const faculty = await User.create({
      name: 'Prof. Pradeep Kumar',
      username: 'pradeepkumar@gmail.com',
      password: 'password',
      role: 'FACULTY',
      subRole: 'SUPERVISOR',
      department: 'Department of Forensic Science',
      isActive: true,
      isVerified: true,
      profileCompleted: true,
      profile: {
        phoneNumber: '+91 98160-54321',
        designation: 'Associate Professor',
        specialization: 'DNA Profiling & Forensic Ballistics',
        officeRoom: 'Room 208, Forensic Sciences Building',
        yearsOfService: 12,
        dob: '1979-08-22',
        gender: 'Male',
        nationality: 'Indian'
      }
    });
    console.log(`Created Faculty: ${faculty.name} (${faculty._id})`);

    // 3. Create Scholar User
    const scholar = await User.create({
      name: 'Mr. Ayush Sood',
      username: 'ayushsood@gmail.com',
      password: 'password',
      role: 'STUDENT',
      department: 'Department of Forensic Science',
      isActive: true,
      isVerified: true, // will be verified by HOD
      profileCompleted: true,
      profile: {
        phoneNumber: '+91 98765-43210',
        dob: '1998-05-12',
        gender: 'Male',
        category: 'General',
        fatherName: 'Shri R. K. Sood',
        motherName: 'Smt. Sunita Sood',
        nationality: 'Indian',
        admissionDate: '2026-06-04',
        enrollmentNumber: 'FORS/2026/01',
        phdMode: 'FULL_TIME',
        preferredGuideId: faculty._id.toString(),
        thesisTitle: 'Advanced Forensic DNA Phenotyping for Complex Human Identification',
        thesisSummary: 'This research project focuses on establishing novel genetic markers and machine learning models to predict human physical appearance from low-template forensic DNA samples.',
        thesisKeywords: 'Forensic DNA, DNA Phenotyping, Machine Learning, SNP Markers',
        qualifications: {
          class10: { board: 'CBSE', year: 2014, percentage: 92 },
          class12: { board: 'CBSE', year: 2016, percentage: 89 },
          graduation: { degree: 'B.Sc. Forensic Science', university: 'HPU', year: 2019, percentage: 84 },
          postGraduation: { degree: 'M.Sc. Forensic Science', university: 'HPU', year: 2021, percentage: 86 }
        }
      }
    });
    console.log(`Created Scholar: ${scholar.name} (${scholar._id})`);

    // Delete any old thesis for this scholar just in case
    await Thesis.deleteMany({ scholarId: scholar._id });

    // 4. Create Thesis registration (REGISTRATION_PENDING)
    console.log('Initiating Ph.D. Lifecycle...');
    const thesis = await Thesis.create({
      scholarId: scholar._id,
      department: scholar.department,
      title: scholar.profile.thesisTitle,
      enrollmentNumber: scholar.profile.enrollmentNumber,
      abstract: scholar.profile.thesisSummary,
      keywords: scholar.profile.thesisKeywords,
      status: 'REGISTRATION_PENDING',
      auditLog: [{
        action: 'REGISTRATION_SUBMITTED',
        note: `Profile submitted by Scholar ${scholar.name} on ${new Date().toDateString()}`
      }]
    });
    console.log(`Created Thesis in REGISTRATION_PENDING: ${thesis.title}`);

    // 5. HOD verifies enrollment -> COURSEWORK
    thesis.enrollmentVerified = true;
    thesis.status = 'COURSEWORK';
    thesis.auditLog.push({
      action: 'ENROLLMENT_VERIFIED',
      note: `Verified by HOD ${hod.name} on ${new Date().toDateString()}`
    });
    console.log('HOD: Verified enrollment -> status: COURSEWORK');

    // 6. HOD assigns supervisor
    thesis.supervisorId = faculty._id;
    thesis.auditLog.push({
      action: 'SUPERVISOR_ASSIGNED',
      note: `Supervisor ${faculty.name} assigned by HOD ${hod.name}`
    });
    console.log(`HOD: Assigned Supervisor -> ${faculty.name}`);

    // 7. Clear Coursework -> SYNOPSIS_PENDING
    thesis.courseworkCompleted = true;
    thesis.status = 'SYNOPSIS_PENDING';
    thesis.auditLog.push({
      action: 'COURSEWORK_CLEARED',
      note: `Coursework marked complete by Supervisor ${faculty.name}`
    });
    console.log('Supervisor: Cleared coursework -> status: SYNOPSIS_PENDING');

    // 8. Create and submit Synopsis milestone
    const synopsisMilestone = await Milestone.create({
      thesisId: thesis._id,
      type: 'SYNOPSIS',
      title: 'Research Synopsis',
      status: 'SUBMITTED',
      sequence: 1,
      documentUrl: '/uploads/synopsis_ayush_sood.pdf',
      submittedAt: new Date()
    });
    console.log('Scholar: Submitted Research Synopsis milestone');

    // 9. Supervisor approves Synopsis milestone
    synopsisMilestone.status = 'APPROVED';
    synopsisMilestone.reviewedAt = new Date();
    synopsisMilestone.comments.push({
      authorId: faculty._id,
      authorName: faculty.name,
      text: 'Excellent research synopsis proposal. Formally approved.'
    });
    await synopsisMilestone.save();

    // Log the supervisor feedback in RACReview
    const synopsisRac = await RACReview.create({
      scholarId: scholar._id,
      thesisId: thesis._id,
      milestoneId: synopsisMilestone._id,
      reviewerId: faculty._id,
      comments: 'Excellent research synopsis proposal. Formally approved.',
      status: 'SATISFACTORY',
      remarks: 'Recommended for HOD DRC approval.',
      racNumber: 1,
      scheduledDate: new Date()
    });
    console.log('Supervisor: Approved Synopsis milestone & logged RAC Review');

    // 10. HOD DRC approves Synopsis -> ACTIVE_RESEARCH
    thesis.status = 'ACTIVE_RESEARCH';
    thesis.startDate = new Date();
    thesis.auditLog.push({
      action: 'DRC_APPROVED',
      note: `DRC approved by HOD ${hod.name}. Candidate admitted to active research.`
    });
    console.log('HOD: DRC Approved Synopsis -> status: ACTIVE_RESEARCH');

    // 11. Create Semester 1 6-Month Progress Report milestone
    const reportMilestone = await Milestone.create({
      thesisId: thesis._id,
      type: '6_MONTH_REPORT',
      title: 'Research Progress Report #1',
      sequence: 1,
      dueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      status: 'SUBMITTED',
      documentUrl: '/uploads/progress_report_semester_1.pdf',
      submittedAt: new Date()
    });
    console.log('Scholar: Submitted 6-Month Progress Report (Semester 1)');

    // 12. Supervisor reviews and approves progress report
    reportMilestone.status = 'APPROVED';
    reportMilestone.reviewedAt = new Date();
    reportMilestone.comments.push({
      authorId: faculty._id,
      authorName: faculty.name,
      text: 'Progress is highly satisfactory. Lab work on DNA phenotyping assays is proceeding on track.'
    });
    await reportMilestone.save();

    await RACReview.create({
      scholarId: scholar._id,
      thesisId: thesis._id,
      milestoneId: reportMilestone._id,
      reviewerId: faculty._id,
      comments: 'Progress is highly satisfactory.',
      status: 'SATISFACTORY',
      remarks: 'DNA markers successfully identified.',
      racNumber: 2,
      scheduledDate: new Date()
    });
    console.log('Supervisor: Approved Progress Report & logged RAC Review');

    // 13. Create 2 Verified Journal Publications and 2 Verified Conference Presentations
    console.log('Scholar: Adding and verifying required research publications...');
    await Publication.create([
      {
        scholarId: scholar._id,
        thesisId: thesis._id,
        type: 'JOURNAL',
        title: 'A Novel Multiplex PCR Assay for Human Physical Trait Prediction in Forensic Casework',
        journalName: 'International Journal of Legal Medicine',
        issn: '0937-9827',
        paperLink: 'https://doi.org/10.1007/s00414-026-09876-y',
        doiUrl: '10.1007/s00414-026-09876-y',
        documentUrl: '/uploads/paper_journal_1.pdf',
        status: 'VERIFIED',
        remarks: 'Verified by HOD.'
      },
      {
        scholarId: scholar._id,
        thesisId: thesis._id,
        type: 'JOURNAL',
        title: 'Deep Learning Approaches for Facial Feature Reconstruction from Low-Template Forensic DNA Profiles',
        journalName: 'Forensic Science International: Genetics',
        issn: '1872-4973',
        paperLink: 'https://doi.org/10.1016/j.fsigen.2026.102834',
        doiUrl: '10.1016/j.fsigen.2026.102834',
        documentUrl: '/uploads/paper_journal_2.pdf',
        status: 'VERIFIED',
        remarks: 'Verified by HOD.'
      },
      {
        scholarId: scholar._id,
        thesisId: thesis._id,
        type: 'CONFERENCE',
        title: 'Predicting Human Iris Color from DNA SNPs: A Comparison of Machine Learning Classifiers',
        journalName: 'Annual Conference of the International Society for Forensic Genetics',
        paperLink: 'https://isfg2026.org/proceedings/iris-prediction',
        documentUrl: '/uploads/paper_conf_1.pdf',
        status: 'VERIFIED',
        remarks: 'Verified by HOD.'
      },
      {
        scholarId: scholar._id,
        thesisId: thesis._id,
        type: 'CONFERENCE',
        title: 'Validation of Forensic DNA Phenotyping Markers in a Diverse Population Cohort',
        journalName: 'National Conference on Forensic DNA Analysis',
        paperLink: 'https://ncfda2026.in/abstracts/validation-dna',
        documentUrl: '/uploads/paper_conf_2.pdf',
        status: 'VERIFIED',
        remarks: 'Verified by HOD.'
      }
    ]);
    console.log('Added 4 verified publications (2 Journals, 2 Conferences).');

    // 14. Advance to PRE_SUBMISSION
    thesis.status = 'PRE_SUBMISSION';
    thesis.auditLog.push({
      action: 'FORCE_PRE_SUBMISSION',
      note: `Advanced to Pre-Submission phase. Publication and timeline requirements met.`
    });
    console.log('HOD: Advanced scholar to status: PRE_SUBMISSION');

    // 15. Create Pre-Submission milestone and submit draft
    const preMilestone = await Milestone.create({
      thesisId: thesis._id,
      type: 'PRE_SUBMISSION',
      title: 'Pre-Submission Thesis & Plagiarism Clearance Package',
      status: 'SUBMITTED',
      sequence: 99,
      documentUrl: '/uploads/pre_submission_draft.pdf',
      plagiarismReportUrl: '/uploads/plagiarism_report.pdf',
      submittedAt: new Date()
    });
    console.log('Scholar: Submitted Pre-Submission Thesis Draft & Plagiarism Report');

    // 16. HOD schedules pre-submission seminar
    thesis.auditLog.push({
      action: 'SEMINAR_SCHEDULED',
      note: `Pre-submission seminar scheduled by HOD ${hod.name} for ${new Date().toLocaleDateString()} at 10:30 AM in Department Board Room.`
    });
    console.log('HOD: Scheduled Pre-Submission Seminar');

    // 17. HOD clears seminar and approves Pre-submission milestone
    preMilestone.status = 'APPROVED';
    preMilestone.reviewedAt = new Date();
    preMilestone.comments.push({
      authorId: hod._id,
      authorName: hod.name,
      text: 'Pre-submission seminar presentation was successful. Plagiarism report is below 10%. Cleared for final submission.'
    });
    await preMilestone.save();

    thesis.status = 'PRE_SUBMISSION'; // remains in pre_submission until supervisor final signs off
    thesis.auditLog.push({
      action: 'SEMINAR_CLEARED',
      note: `Pre-submission seminar cleared by HOD ${hod.name}. Final thesis submission unlocked.`
    });
    console.log('HOD: Cleared Seminar and Approved Pre-submission milestone');

    // 18. Create Final Submission milestone and submit final thesis
    const finalMilestone = await Milestone.create({
      thesisId: thesis._id,
      type: 'FINAL_SUBMISSION',
      title: 'Final Complete Thesis Submission Package',
      status: 'SUBMITTED',
      sequence: 100,
      documentUrl: '/uploads/final_thesis_ayush_sood.pdf',
      plagiarismReportUrl: '/uploads/final_plagiarism_report_ayush_sood.pdf',
      submittedAt: new Date()
    });
    console.log('Scholar: Submitted Final Thesis & Plagiarism Package');

    // 19. Supervisor final digital approval -> SUBMITTED
    finalMilestone.status = 'APPROVED';
    finalMilestone.reviewedAt = new Date();
    finalMilestone.comments.push({
      authorId: faculty._id,
      authorName: faculty.name,
      text: `Approved and signed off for final evaluation by supervisor ${faculty.name}.`
    });
    await finalMilestone.save();

    thesis.status = 'SUBMITTED';
    thesis.submittedAt = new Date();
    thesis.auditLog.push({
      action: 'FINAL_APPROVED',
      note: `Final digital approval by supervisor ${faculty.name}. Thesis submitted for external evaluation.`
    });
    console.log('Supervisor: Final digital approval -> status: SUBMITTED');

    // 20. HOD logs dispatch to external examiners
    thesis.dispatchDate = new Date();
    thesis.dispatchMethod = 'Speed Post (DHL Express)';
    thesis.dispatchTrackingNumber = 'DHL-FORS-2026-9921';
    thesis.auditLog.push({
      action: 'THESIS_DISPATCHED',
      note: `Thesis dispatched to external examiners via Speed Post (DHL Express) (Ref: DHL-FORS-2026-9921)`
    });
    console.log('HOD: Logged dispatch of thesis to external examiners');

    // 21. HOD schedules Viva-Voce defense
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    thesis.vivaDate = tomorrow;
    thesis.vivaTime = '11:00 AM';
    thesis.vivaVenue = 'Forensic Department Conference Room';
    thesis.vivaPanel = 'Prof. R.K. Sen (External Examiner, Delhi University), Prof. Mahinder Kumar (HOD), Prof. Pradeep Kumar (Supervisor)';
    thesis.vivaStatus = 'SCHEDULED';
    thesis.auditLog.push({
      action: 'VIVA_SCHEDULED',
      note: `Viva-Voce scheduled for ${tomorrow.toLocaleDateString()} at 11:00 AM in Forensic Department Conference Room`
    });
    console.log('HOD: Scheduled Viva-Voce defense');

    // 22. HOD records Viva-Voce outcome as successful
    thesis.vivaStatus = 'SUCCESSFUL';
    thesis.vivaRemarks = 'The candidate defended the thesis exceptionally well. All external examiner queries were answered. Highly recommended for the Ph.D. award.';
    thesis.auditLog.push({
      action: 'VIVA_OUTCOME_LOGGED',
      note: `Viva-Voce defense recorded as SUCCESSFUL. Remarks: The candidate defended the thesis exceptionally well. All external examiner queries were answered. Highly recommended for the Ph.D. award.`
    });
    console.log('HOD: Logged Viva-Voce outcome -> SUCCESSFUL');

    // 23. HOD awards degree -> AWARDED
    thesis.status = 'AWARDED';
    thesis.awardedAt = new Date();
    thesis.auditLog.push({
      action: 'DEGREE_AWARDED',
      note: 'Ph.D. degree awarded by HOD / Academic Council after successful viva defense.'
    });
    console.log('HOD: Formally Awarded Degree -> status: AWARDED');

    await thesis.save();
    console.log('Saved final thesis document state successfully!');

    // 24. Create congratulations notification for the scholar
    await Notification.create({
      recipient: scholar._id,
      title: '🎓 Ph.D. Degree Awarded! Congratulations Doctor!',
      message: `Congratulations, Dr. Ayush Sood! Your Ph.D. degree on "Advanced Forensic DNA Phenotyping for Complex Human Identification" has been successfully awarded!`,
      type: 'SUCCESSFUL_ACTION',
      link: 'overview'
    });
    console.log('Created notifications.');

    console.log('\n======================================================');
    console.log('🎉 PH.D. LIFECYCLE COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log(`Scholar:   ${scholar.name} (${scholar.username})`);
    console.log(`Supervisor:${faculty.name} (${faculty.username})`);
    console.log(`HOD:        ${hod.name} (${hod.username})`);
    console.log(`Thesis:    "${thesis.title}"`);
    console.log(`Status:    ${thesis.status}`);
    console.log(`vivaStatus:${thesis.vivaStatus}`);
    console.log('======================================================\n');

    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error during lifecycle completion:', err);
    mongoose.connection.close();
    process.exit(1);
  }
}

run();
