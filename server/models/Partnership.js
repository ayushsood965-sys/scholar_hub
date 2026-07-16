const mongoose = require('mongoose');

const PartnershipSchema = new mongoose.Schema({
  partnerName: { type: String, required: true },
  partnerType: {
    type: String,
    enum: ['Industry', 'Academic', 'Government', 'NGO', 'International', 'Defense'],
    default: 'Industry'
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  departments: [{ type: String }],
  linkedLabIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ResearchLab' }],
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  mouDocumentUrl: { type: String, default: '' },
  partnerLogoUrl: { type: String, default: '' },
  outcomes: [{ type: String }],
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'PROPOSED', 'EXPIRED'],
    default: 'ACTIVE'
  },
  contactPerson: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Partnership', PartnershipSchema);
