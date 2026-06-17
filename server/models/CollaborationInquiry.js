const mongoose = require('mongoose');

const CollaborationInquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  institution: { type: String, required: true },
  project: { type: String, required: true },
  details: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'REVIEWED', 'CONTACTED', 'ARCHIVED'], default: 'PENDING' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('CollaborationInquiry', CollaborationInquirySchema);
