const mongoose = require('mongoose');

const CollaborationCallSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, default: 'Industry Partner' },
  department: { type: String, required: true },
  status: { type: String, default: 'Active' },
  partnerType: {
    type: String,
    enum: ['Industry', 'Academic', 'Government', 'NGO', 'International'],
    default: 'Industry'
  },
  deadline: { type: Date, default: null },
  fundingAmount: { type: String, default: '' },
  contactPerson: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  eligibleDepartments: [{ type: String }],
  outcomes: [{ type: String }],
  relatedLabId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchLab', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('CollaborationCall', CollaborationCallSchema);
