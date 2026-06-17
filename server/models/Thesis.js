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
      enum: ['REGISTRATION_PENDING', 'COURSEWORK', 'SYNOPSIS_PENDING', 'ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'SUBMITTED', 'AWARDED'],
      default: 'REGISTRATION_PENDING',
    },
    courseworkCompleted: { type: Boolean, default: false },
    courseworkDetails: {
      researchMethodology: {
        type: [
          {
            subjectName: { type: String, required: true },
            marksObtained: { type: Number, required: true },
            maxMarks: { type: Number, required: true }
          }
        ],
        default: []
      },
      researchAnalysis: {
        type: [
          {
            subjectName: { type: String, required: true },
            marksObtained: { type: Number, required: true },
            maxMarks: { type: Number, required: true }
          }
        ],
        default: []
      },
      elective: {
        type: [
          {
            subjectName: { type: String, required: true },
            marksObtained: { type: Number, required: true },
            maxMarks: { type: Number, required: true }
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
    courseworkApprovals: {
      facultyApproved: { type: Boolean, default: false },
      facultyApproverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      facultyApprovedAt: { type: Date, default: null },
      hodApproved: { type: Boolean, default: false },
      hodApproverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      hodApprovedAt: { type: Date, default: null }
    },
    enrollmentVerified: { type: Boolean, default: false },
    startDate: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    awardedAt: { type: Date, default: null },
    dispatchDate: { type: Date, default: null },
    dispatchMethod: { type: String, default: '' },
    dispatchTrackingNumber: { type: String, default: '' },
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
