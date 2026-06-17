const mongoose = require('mongoose');

const DRCMeetingSchema = new mongoose.Schema({
  scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thesisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thesis', required: true },
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },
  venue: { type: String, required: true },
  committeeMembers: { type: String, default: '' },
  title: { type: String, default: 'DRC Meeting' },
  isSynopsisApproval: { type: Boolean, default: false },
  agenda: { type: String, default: '' },
  status: { type: String, enum: ['SCHEDULED', 'APPROVED', 'REVISION_REQUIRED'], default: 'SCHEDULED' },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('DRCMeeting', DRCMeetingSchema);
