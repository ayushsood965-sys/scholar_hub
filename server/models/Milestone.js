const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    thesisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thesis', required: true },
    type: {
      type: String,
      enum: ['SYNOPSIS', 'PROGRESS_REPORT', 'PRE_SUBMISSION', 'FINAL_SUBMISSION', '6_MONTH_REPORT', 'CHAPTER_DRAFT'],
      required: true,
    },
    title: { type: String, required: true },
    sequence: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['PENDING', 'SUBMITTED', 'PENDING_HOD', 'APPROVED', 'REVISION_REQUIRED', 'DRAFT', 'UNDER_REVIEW_HOD', 'VERIFIED', 'REJECTED_BY_SUPERVISOR', 'REJECTED_BY_HOD'],
      default: 'PENDING',
    },
    documentUrl: { type: String, default: null },
    plagiarismReportUrl: { type: String, default: null },
    dueDate: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    comments: [
      {
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        authorName: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    forwardedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    forwardedRole: { type: String, enum: ['SUPERVISOR', 'HOD'], default: null },
    feeDetails: {
      periodFrom: { type: Date, default: null },
      periodTo: { type: Date, default: null },
      durationMonths: { type: Number, default: 0 },
      durationDays: { type: Number, default: 0 },
      totalFeeDeposited: { type: String, default: '' },
      remarks: { type: String, default: '' },
      feeReceiptUrl: { type: String, default: null }
    },
    history: [
      {
        action: { type: String, required: true }, // 'SUBMITTED', 'SUPERVISOR_APPROVED', 'SUPERVISOR_REJECTED', 'HOD_APPROVED', 'HOD_REJECTED'
        actorName: { type: String, required: true },
        actorRole: { type: String, required: true },
        documentUrl: { type: String, default: null },
        plagiarismReportUrl: { type: String, default: null },
        remarks: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Milestone', milestoneSchema);
