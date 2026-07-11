const mongoose = require('mongoose');

const thesisSchema = new mongoose.Schema(
  {
    scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    department: { type: String, required: true },
    title: { type: String, required: true },
    enrollmentNumber: { type: String, required: true },
    abstract: { type: String, required: true },
    keywords: { type: String, default: '' },
    status: {
      type: String,
      enum: ['REGISTRATION_PENDING', 'REJECTED', 'COURSEWORK', 'SYNOPSIS_PENDING', 'ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED', 'AWARDED'],
      default: 'REGISTRATION_PENDING',
    },
    courseworkCompleted: { type: Boolean, default: false },
    courseworkDetails: {
      researchEthics: {
        type: [
          {
            subjectName: { type: String, required: true },
            subjectCode: { type: String, default: '' },
            marksObtained: { type: Number, required: true },
            maxMarks: { type: Number, required: true },
            examinationMonthYear: { type: String, default: '' }
          }
        ],
        default: []
      },
      researchMethodology: {
        type: [
          {
            subjectName: { type: String, required: true },
            subjectCode: { type: String, default: '' },
            marksObtained: { type: Number, required: true },
            maxMarks: { type: Number, required: true },
            examinationMonthYear: { type: String, default: '' }
          }
        ],
        default: []
      },
      elective: {
        type: [
          {
            subjectName: { type: String, required: true },
            subjectCode: { type: String, default: '' },
            marksObtained: { type: Number, required: true },
            maxMarks: { type: Number, required: true },
            examinationMonthYear: { type: String, default: '' }
          }
        ],
        default: []
      },
      others: {
        type: [
          {
            subjectName: { type: String, default: '' },
            subjectCode: { type: String, default: '' },
            marksObtained: { type: Number, default: null },
            maxMarks: { type: Number, default: null },
            examinationMonthYear: { type: String, default: '' }
          }
        ],
        default: []
      }
    },
    courseworkStatus: {
      type: String,
      enum: ['NOT_SUBMITTED', 'PENDING_FACULTY', 'PENDING_HOD', 'APPROVED', 'REJECTED'],
      default: 'NOT_SUBMITTED'
    },
    courseworkUploadProof: { type: String, default: null },
    courseworkApprovals: {
      facultyApproved: { type: Boolean, default: false },
      facultyApproverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      facultyApprovedAt: { type: Date, default: null },
      hodApproved: { type: Boolean, default: false },
      hodApproverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      hodApprovedAt: { type: Date, default: null }
    },
    preSubmissionSeminar: {
      status: {
        type: String,
        enum: ['NOT_REQUESTED', 'REQUESTED', 'FACULTY_APPROVED', 'HOD_APPROVED', 'SATISFACTORY', 'UNSATISFACTORY', 'NOT_SCHEDULED', 'SCHEDULED', 'CLEARED', 'UNCLEARED'],
        default: 'NOT_SCHEDULED'
      },
      requestRemarks: { type: String, default: '' },
      requestedAt: { type: Date, default: null },
      scheduledDate: { type: Date, default: null },
      scheduledTime: { type: String, default: '' },
      venue: { type: String, default: '' },
      committeeMembers: { type: String, default: '' },
      remarks: { type: String, default: '' },
      facultyApprovedAt: { type: Date, default: null },
      facultyApproverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      hodApprovedAt: { type: Date, default: null },
      hodApproverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      outcomeRecordedAt: { type: Date, default: null },
      outcomeRemarks: { type: String, default: '' }
    },
    preSubmissionSeminarHistory: [
      {
        scheduledDate: { type: Date, default: null },
        scheduledTime: { type: String, default: '' },
        venue: { type: String, default: '' },
        committeeMembers: { type: String, default: '' },
        remarks: { type: String, default: '' },
        outcomeRecordedAt: { type: Date, default: null },
        outcomeRemarks: { type: String, default: '' },
        status: { type: String, default: '' }
      }
    ],
    enrollmentVerified: { type: Boolean, default: false },
    synopsisProvisionallyCleared: { type: Boolean, default: false },
    activeResearchBypassed: { type: Boolean, default: false },
    activeResearchBypassMetadata: {
      bypassedBy: { type: String, default: '' },
      designation: { type: String, default: '' },
      timestamp: { type: Date, default: null },
      justification: { type: String, default: '' },
      statsBeforeBypass: {
        researchTimeMonths: { type: Number, default: 0 },
        approvedReportsCount: { type: Number, default: 0 },
        journalsCount: { type: Number, default: 0 },
        conferencesCount: { type: Number, default: 0 }
      }
    },
    startDate: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    awardedAt: { type: Date, default: null },
    dispatchDate: { type: Date, default: null },
    dispatchMethod: { type: String, default: '' },
    dispatchTrackingNumber: { type: String, default: '' },
    externalEvaluationStatus: {
      type: String,
      enum: ['PENDING', 'SUCCESSFUL', 'FAILED'],
      default: 'PENDING'
    },
    externalEvaluationRemarks: { type: String, default: '' },
    externalEvaluationLoggedAt: { type: Date, default: null },
    externalEvaluationLoggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    vivaDate: { type: Date, default: null },
    vivaTime: { type: String, default: '' },
    vivaVenue: { type: String, default: '' },
    vivaPanel: { type: String, default: '' },
    vivaStatus: {
      type: String,
      enum: ['NOT_SCHEDULED', 'SCHEDULED', 'SUCCESSFUL', 'UNSUCCESSFUL'],
      default: 'NOT_SCHEDULED',
    },
    vivaRemarks: { type: String, default: '' },
    auditLog: [
      {
        action: String,
        note: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Thesis', thesisSchema);
