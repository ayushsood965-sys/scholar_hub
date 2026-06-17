const mongoose = require('mongoose');

const RACReviewSchema = new mongoose.Schema({
  scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thesisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thesis', required: true },
  
  // Legacy fields (for HOD scheduled reviews)
  racNumber: { type: Number, default: 1 }, 
  scheduledDate: { type: Date, default: Date.now },
  committeeMembers: { type: String, default: '' },
  progressReportUrl: { type: String },
  remarks: { type: String },
  studentRemarks: { type: String, default: '' },
  submissions: [
    {
      progressReportUrl: { type: String },
      studentRemarks: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    }
  ],

  // New Phase 5 fields (for supervisor milestone reviews)
  milestoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone', default: null },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  comments: { type: String, default: '' },

  status: { 
    type: String, 
    enum: ['SCHEDULED', 'SATISFACTORY', 'UNSATISFACTORY'], 
    default: 'SCHEDULED' 
  },
  
  // Enriched Ph.D. RAC academic review parameters
  researchProgress: { type: String, default: '' },
  nextMilestones: { type: String, default: '' },
  nextMeetingDate: { type: Date, default: null },
  committeeChairedBy: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('RACReview', RACReviewSchema);
