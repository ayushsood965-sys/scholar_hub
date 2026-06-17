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
      enum: ['PENDING', 'SUBMITTED', 'APPROVED', 'REVISION_REQUIRED'],
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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Milestone', milestoneSchema);
