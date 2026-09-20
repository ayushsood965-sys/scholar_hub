require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Thesis = require('./models/Thesis');
const Milestone = require('./models/Milestone');
const Notification = require('./models/Notification');

async function seedAyushCompleteLifecycle() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const scholar = await User.findOne({ username: 'ayushtest@gmail.com' });
    if (!scholar) {
      console.error('Scholar ayushtest@gmail.com not found!');
      process.exit(1);
    }
    console.log(`Found scholar: ${scholar.name} (${scholar._id})`);

    const supervisor = await User.findOne({ username: 'pradeepkumar@gmail.com' });
    if (!supervisor) {
      console.error('Supervisor pradeepkumar@gmail.com not found!');
      process.exit(1);
    }
    console.log(`Found supervisor: ${supervisor.name} (${supervisor._id})`);

    const hod = await User.findOne({ username: 'mahinderkumar@gmail.com' }) || await User.findOne({ role: 'HOD', department: scholar.department });
    if (!hod) {
      console.error('HOD not found!');
      process.exit(1);
    }
    console.log(`Found HOD: ${hod.name} (${hod._id})`);

    const thesis = await Thesis.findOne({ scholarId: scholar._id });
    if (!thesis) {
      console.error('Thesis not found for ayushtest@gmail.com!');
      process.exit(1);
    }
    console.log(`Found thesis: "${thesis.title}" (${thesis._id})`);

    // 1. Ensure scholar and thesis coursework/enrollment prerequisites are verified
    scholar.isVerified = true;
    if (!scholar.profile) scholar.profile = {};
    scholar.profile.admissionDate = '2023-06-01';
    await scholar.save();

    thesis.courseworkCompleted = true;
    thesis.enrollmentVerified = true;
    thesis.synopsisProvisionallyCleared = true;
    thesis.supervisorId = supervisor._id;

    // 2. Pre-Submission Milestone (PRE_SUBMISSION) -> APPROVED
    let preMilestone = await Milestone.findOne({ thesisId: thesis._id, type: 'PRE_SUBMISSION' });
    if (!preMilestone) {
      preMilestone = new Milestone({
        thesisId: thesis._id,
        type: 'PRE_SUBMISSION',
        sequence: 99
      });
    }

    preMilestone.title = 'Pre-Submission Thesis & Plagiarism Clearance Package';
    preMilestone.status = 'APPROVED';
    preMilestone.documentUrl = '/uploads/theses/ayush_presubmission_draft.pdf';
    preMilestone.plagiarismReportUrl = '/uploads/plagiarism/ayush_turnitin_clearance.pdf';
    preMilestone.submittedAt = new Date('2026-06-15T10:00:00.000Z');
    preMilestone.reviewedAt = new Date('2026-06-25T15:30:00.000Z');
    preMilestone.comments = [
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
    ];
    preMilestone.history = [
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
    ];
    await preMilestone.save();
    console.log('✓ Seeded & Approved Pre-Submission Milestone');

    // 3. Pre-Submission Seminar on Thesis -> CLEARED
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
    console.log('✓ Seeded & Cleared Pre-Submission Seminar');

    // 4. Final Submission Milestone (FINAL_SUBMISSION) -> APPROVED
    let finalMilestone = await Milestone.findOne({ thesisId: thesis._id, type: 'FINAL_SUBMISSION' });
    if (!finalMilestone) {
      finalMilestone = new Milestone({
        thesisId: thesis._id,
        type: 'FINAL_SUBMISSION',
        sequence: 100
      });
    }

    finalMilestone.title = 'Final Complete Bound Thesis Submission Package';
    finalMilestone.status = 'APPROVED';
    finalMilestone.documentUrl = '/uploads/theses/ayush_final_bound_thesis.pdf';
    finalMilestone.plagiarismReportUrl = '/uploads/plagiarism/ayush_final_turnitin_clearance.pdf';
    finalMilestone.submittedAt = new Date('2026-07-28T11:00:00.000Z');
    finalMilestone.reviewedAt = new Date('2026-08-05T16:00:00.000Z');
    finalMilestone.comments = [
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
    ];
    finalMilestone.history = [
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
    ];
    await finalMilestone.save();
    console.log('✓ Seeded & Approved Final Submission Milestone with complete history');

    // 5. External Evaluation Details on Thesis
    thesis.dispatchDate = new Date('2026-08-10T10:00:00.000Z');
    thesis.dispatchMethod = 'Speed Post (Registered Airmail)';
    thesis.dispatchTrackingNumber = 'HPU-EXAM-PHD-2026-9844';
    thesis.externalEvaluationSentTo = 'Prof. S. K. Roy (IIT Roorkee), Prof. N. Sharma (JNU New Delhi)';
    thesis.externalEvaluationStatus = 'SUCCESSFUL';
    thesis.externalEvaluationLoggedAt = new Date('2026-08-30T11:30:00.000Z');
    thesis.externalEvaluationLoggedBy = hod._id;
    thesis.externalEvaluationRemarks = 'All external examiner reports received with Category-A commendation. Both examiners unconditionally recommended the thesis for the award of the Ph.D. degree subject to viva-voce examination.';
    console.log('✓ Seeded External Evaluation details');

    // 6. Viva-Voce Defense Details on Thesis
    thesis.vivaDate = new Date('2026-09-12T11:30:00.000Z');
    thesis.vivaTime = '11:30 AM';
    thesis.vivaVenue = 'Senate Committee Hall & Google Meet Hybrid';
    thesis.vivaPanel = 'Prof. S. K. Roy (External Examiner, IIT Roorkee), Prof. Mahinder Kumar (HOD & Chairperson), Dr. Pradeep Kumar (Supervisor)';
    thesis.vivaCoordinator = 'Prof. Mahinder Kumar';
    thesis.vivaMeetingLink = 'https://meet.google.com/phd-ayush-viva';
    thesis.vivaStatus = 'SUCCESSFUL';
    thesis.vivaRemarks = 'The candidate defended the research thesis before the board with exemplary proficiency and domain mastery. All inquiries from the external examiner and faculty were thoroughly and satisfactorily answered. Unanimously recommended for the Ph.D. degree award.';
    console.log('✓ Seeded Viva-Voce defense details');

    // 7. Degree Award & Final Thesis Status
    thesis.status = 'AWARDED';
    thesis.submittedAt = new Date('2026-08-05T16:00:00.000Z');
    thesis.awardedAt = new Date('2026-09-15T10:00:00.000Z');

    thesis.auditLog = thesis.auditLog || [];
    const newLogs = [
      { action: 'PRE_SUBMISSION_SUBMITTED', note: 'Pre-submission rough draft uploaded by scholar Ayush Sood.', date: new Date('2026-06-15T10:00:00.000Z') },
      { action: 'PRE_SUBMISSION_SUPERVISOR_APPROVED', note: 'Pre-submission draft approved by supervisor Dr. Pradeep Kumar.', date: new Date('2026-06-20T11:30:00.000Z') },
      { action: 'PRE_SUBMISSION_HOD_APPROVED', note: 'Pre-submission draft approved by HOD Prof. Mahinder Kumar.', date: new Date('2026-06-25T15:30:00.000Z') },
      { action: 'SEMINAR_SCHEDULED', note: 'Pre-submission seminar scheduled by HOD for 10/07/2026 at 11:00 AM.', date: new Date('2026-06-25T16:00:00.000Z') },
      { action: 'SEMINAR_CLEARED', note: 'Pre-submission colloquium defense cleared by Departmental Research Committee.', date: new Date('2026-07-10T13:00:00.000Z') },
      { action: 'FINAL_SUBMISSION_SUBMITTED', note: 'Final bound thesis uploaded by scholar Ayush Sood.', date: new Date('2026-07-28T11:00:00.000Z') },
      { action: 'SUPERVISOR_APPROVED', note: 'Final digital sign-off by supervisor Dr. Pradeep Kumar.', date: new Date('2026-08-01T14:30:00.000Z') },
      { action: 'HOD_APPROVED', note: 'Final digital sign-off by HOD Prof. Mahinder Kumar.', date: new Date('2026-08-05T16:00:00.000Z') },
      { action: 'THESIS_DISPATCHED', note: 'Thesis dispatched to external examiners via Speed Post (Registered Airmail) (Ref: HPU-EXAM-PHD-2026-9844).', date: new Date('2026-08-10T10:00:00.000Z') },
      { action: 'EXTERNAL_EVALUATION_SUCCESS', note: 'External examiner evaluation cleared successfully with Category-A commendations.', date: new Date('2026-08-30T11:30:00.000Z') },
      { action: 'VIVA_SCHEDULED', note: 'Viva-Voce scheduled for 12/09/2026 at 11:30 AM in Senate Committee Hall & Google Meet Hybrid.', date: new Date('2026-09-02T10:00:00.000Z') },
      { action: 'VIVA_OUTCOME_LOGGED', note: 'Viva-Voce defense recorded as SUCCESSFUL. Unanimously recommended for Ph.D. award.', date: new Date('2026-09-12T13:00:00.000Z') },
      { action: 'DEGREE_AWARDED', note: 'Ph.D. degree officially awarded by the Academic Council after successfully clearing all statutory evaluation criteria.', date: new Date('2026-09-15T10:00:00.000Z') }
    ];

    for (const log of newLogs) {
      if (!thesis.auditLog.some(l => l.action === log.action)) {
        thesis.auditLog.push(log);
      }
    }

    await thesis.save();
    console.log('✓ Updated Thesis state to AWARDED with complete lifecycle details');

    // 8. Notifications
    await Notification.deleteMany({ recipient: scholar._id, title: /Ph\.D\. Degree Awarded/i });
    await Notification.create({
      recipient: scholar._id,
      title: '🎓 Ph.D. Degree Awarded! Congratulations Doctor!',
      message: `Congratulations, Dr. ${scholar.name}! Your Ph.D. degree on "${thesis.title}" has been officially awarded by Himachal Pradesh University Academic Council!`,
      type: 'SUCCESSFUL_ACTION',
      link: 'overview'
    });
    console.log('✓ Created congratulations notification for scholar');

    console.log('\n================================================================');
    console.log('🎉 DEGREE AWARDED SUCCESSFULLY FOR AYUSHTEST@GMAIL.COM!');
    console.log('================================================================');
    console.log(`Scholar:             ${scholar.name} (${scholar.username})`);
    console.log(`Supervisor:          ${supervisor.name} (${supervisor.username})`);
    console.log(`HOD:                 ${hod.name} (${hod.username})`);
    console.log(`Thesis Title:        ${thesis.title}`);
    console.log(`Pre-Submission:      CLEARED & APPROVED`);
    console.log(`Final Submission:    SIGNED OFF BY SUPERVISOR & HOD`);
    console.log(`External Evaluation: SUCCESSFUL (${thesis.externalEvaluationSentTo})`);
    console.log(`Viva-Voce Defense:   SUCCESSFUL (${thesis.vivaVenue})`);
    console.log(`Final Thesis Status: ${thesis.status}`);
    console.log(`Degree Awarded Date: ${thesis.awardedAt.toLocaleDateString()}`);
    console.log('================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Error seeding complete lifecycle:', err);
    process.exit(1);
  }
}

seedAyushCompleteLifecycle();
