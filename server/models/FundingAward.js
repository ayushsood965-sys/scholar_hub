const mongoose = require('mongoose');

const FundingAwardSchema = new mongoose.Schema({
  scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thesisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thesis', default: null },
  fundingOpportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'FundingOpportunity', default: null },
  awardTitle: { type: String, required: true },
  amountSanctioned: { type: String, default: '' },
  amountDisbursed: { type: String, default: '' },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'SUSPENDED', 'PENDING_RENEWAL'],
    default: 'ACTIVE'
  },
  renewalDate: { type: Date, default: null },
  remarks: { type: String, default: '' },
  awardedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('FundingAward', FundingAwardSchema);
