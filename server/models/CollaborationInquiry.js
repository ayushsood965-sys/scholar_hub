const mongoose = require('mongoose');

const CollaborationInquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  institution: { type: String, required: true },
  project: { type: String, required: true },
  details: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'REVIEWED', 'CONTACTED', 'ARCHIVED'], default: 'PENDING' },
  remarks: { type: String, default: '' },
  type: {
    type: String,
    enum: ['Sponsored Research', 'Consulting', 'Joint PhD', 'Internship', 'Technology Transfer', 'Faculty Exchange', 'MoU', 'Other'],
    default: 'Other'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedAt: { type: Date, default: null },
  responseDate: { type: Date, default: null },
  notes: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, default: '' },
    date: { type: Date, default: Date.now }
  }],
  phone: { type: String, default: '' },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  }
}, { timestamps: true });

module.exports = mongoose.model('CollaborationInquiry', CollaborationInquirySchema);
