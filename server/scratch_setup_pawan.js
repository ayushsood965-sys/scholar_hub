require('dotenv').config({ path: 'c:/Codee/scholar_sync/server/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const Thesis = require('./models/Thesis');
const Milestone = require('./models/Milestone');
const Publication = require('./models/Publication');
const DRCMeeting = require('./models/DRCMeeting');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const student = await User.findOne({ username: 'pawansharma1@gmail.com' });
    const supervisor = await User.findOne({ username: 'sanjay.sen.fors.faculty2@gmail.com' });

    if (!student || !supervisor) {
      console.log('Student or Supervisor not found.');
      return;
    }

    let thesis = await Thesis.findOne({ scholarId: student._id });
    if (!thesis) {
      console.log('Creating a new thesis for Pawan Sharma...');
      thesis = await Thesis.create({
        scholarId: student._id,
        department: student.department,
        title: 'Forensic Investigation of Digital Forgery using Advanced Neural Networks',
        enrollmentNumber: student.profile?.enrollmentNumber || 'HP-FORS-2023-442',
        abstract: 'This thesis proposes new machine learning structures to identify forged documents in high-resolution scans.',
        status: 'PRE_SUBMISSION'
      });
    }

    // Set supervisor, coursework completed, enrollment verified, and pre-sub seminar status
    thesis.supervisorId = supervisor._id;
    thesis.courseworkCompleted = true;
    thesis.enrollmentVerified = true;
    thesis.status = 'PRE_SUBMISSION';
    if (!thesis.preSubmissionSeminar) {
      thesis.preSubmissionSeminar = {};
    }
    thesis.preSubmissionSeminar.status = 'CLEARED';
    thesis.preSubmissionSeminar.outcomeRemarks = 'Pre-submission seminar cleared with minor recommendations.';
    
    // Clear dispatch, external evaluation, viva statuses so it's a clean slate
    thesis.dispatchDate = null;
    thesis.dispatchMethod = '';
    thesis.dispatchTrackingNumber = '';
    thesis.externalEvaluationStatus = 'PENDING';
    thesis.externalEvaluationRemarks = '';
    thesis.vivaDate = null;
    thesis.vivaTime = '';
    thesis.vivaVenue = '';
    thesis.vivaPanel = '';
    thesis.vivaStatus = 'NOT_SCHEDULED';
    thesis.vivaRemarks = '';

    await thesis.save();
    console.log('Updated thesis with supervisor, coursework completed, enrollment verified, and seminar CLEARED.');

    // 1. Synopsis Milestone Approved
    let synopsisMilestone = await Milestone.findOne({ thesisId: thesis._id, type: 'SYNOPSIS' });
    if (!synopsisMilestone) {
      synopsisMilestone = await Milestone.create({
        thesisId: thesis._id,
        type: 'SYNOPSIS',
        title: 'Ph.D. Research Synopsis Submission',
        status: 'APPROVED',
        sequence: 1
      });
    } else {
      synopsisMilestone.status = 'APPROVED';
      await synopsisMilestone.save();
    }
    console.log('Synopsis milestone APPROVED.');

    // 2. DRC Meeting Approved
    let drcMeeting = await DRCMeeting.findOne({ thesisId: thesis._id });
    if (!drcMeeting) {
      await DRCMeeting.create({
        scholarId: student._id,
        thesisId: thesis._id,
        scheduledDate: new Date(),
        scheduledTime: '10:00 AM',
        venue: 'Forensic Sciences Seminar Room',
        status: 'APPROVED',
        remarks: 'Synopsis approved by committee'
      });
    } else {
      drcMeeting.status = 'APPROVED';
      await drcMeeting.save();
    }
    console.log('DRC Meeting APPROVED.');

    // 3. 6-Month Progress Reports Approved (Min 3)
    for (let i = 1; i <= 3; i++) {
      let report = await Milestone.findOne({ thesisId: thesis._id, type: '6_MONTH_REPORT', sequence: i });
      if (!report) {
        await Milestone.create({
          thesisId: thesis._id,
          type: '6_MONTH_REPORT',
          sequence: i,
          title: `6-Month Progress Report - Semester ${i}`,
          status: 'APPROVED',
          dueDate: new Date(Date.now() - (4 - i) * 180 * 24 * 3600 * 1000)
        });
      } else {
        report.status = 'APPROVED';
        await report.save();
      }
    }
    console.log('Three 6-Month progress report milestones APPROVED.');

    // 4. Mandatory Research Publications (2 Journals, 2 Conferences)
    await Publication.deleteMany({ thesisId: thesis._id });
    await Publication.create([
      {
        scholarId: student._id,
        thesisId: thesis._id,
        type: 'JOURNAL',
        title: 'Neural Forgery Detection in Scan Documents',
        journalName: 'International Journal of Forensic Sciences',
        status: 'VERIFIED'
      },
      {
        scholarId: student._id,
        thesisId: thesis._id,
        type: 'JOURNAL',
        title: 'Deep Learning Models for Altered PDF Auditing',
        journalName: 'Journal of Digital Forensics & Security',
        status: 'VERIFIED'
      },
      {
        scholarId: student._id,
        thesisId: thesis._id,
        type: 'CONFERENCE',
        title: 'A Comparative Study of CNN and Transformer for Forgery Identification',
        journalName: 'IEEE International Conference on Cyber Security',
        status: 'VERIFIED'
      },
      {
        scholarId: student._id,
        thesisId: thesis._id,
        type: 'CONFERENCE',
        title: 'Metadata Analysis of Compromised Electronic Documents',
        journalName: 'ACM Symposium on Applied Computing',
        status: 'VERIFIED'
      }
    ]);
    console.log('Mandatory 2 Journals and 2 Conferences publications created and VERIFIED.');

    // 5. Pre-submission milestone APPROVED
    let preMilestone = await Milestone.findOne({ thesisId: thesis._id, type: 'PRE_SUBMISSION' });
    if (!preMilestone) {
      preMilestone = await Milestone.create({
        thesisId: thesis._id,
        type: 'PRE_SUBMISSION',
        title: 'Pre-Submission Thesis Draft & Plagiarism Clearance Package',
        status: 'APPROVED',
        sequence: 99
      });
    } else {
      preMilestone.status = 'APPROVED';
      await preMilestone.save();
    }
    console.log('Pre-submission milestone APPROVED.');

    // 6. Ensure final submission milestone is created and PENDING
    let finalMilestone = await Milestone.findOne({ thesisId: thesis._id, type: 'FINAL_SUBMISSION' });
    if (finalMilestone) {
      finalMilestone.status = 'PENDING';
      finalMilestone.documentUrl = null;
      await finalMilestone.save();
    } else {
      await Milestone.create({
        thesisId: thesis._id,
        type: 'FINAL_SUBMISSION',
        title: 'Final Complete Thesis Submission Package',
        status: 'PENDING',
        sequence: 100
      });
    }
    console.log('Final complete thesis submission milestone created and PENDING.');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
