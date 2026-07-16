const mongoose = require('mongoose');

const FundingOpportunitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  agency: { type: String, required: true },
  amount: { type: String, required: true },
  duration: { type: String, required: true },
  scope: { type: String, required: true },
  status: { type: String, default: 'Applications Open' },
  type: {
    type: String,
    enum: ['Fellowship', 'Project Grant', 'Travel Grant', 'Infrastructure', 'State Scholarship', 'Industry Sponsorship'],
    default: 'Fellowship'
  },
  eligibilityDepartments: [{ type: String }],
  eligibilityCriteria: { type: String, default: '' },
  deadline: { type: Date, default: null },
  applicationUrl: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  documentsRequired: [{ type: String }],
  fundingBody: {
    type: String,
    enum: ['UGC', 'CSIR', 'DST', 'DBT', 'ICSSR', 'ICHR', 'DRDO', 'HIMCOSTE', 'HP State Govt', 'SERB', 'RUSA', 'Industry', 'University', 'Other'],
    default: 'Other'
  },
  recurrence: {
    type: String,
    enum: ['One-time', 'Monthly', 'Annual', 'Project-based'],
    default: 'One-time'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('FundingOpportunity', FundingOpportunitySchema);
