const mongoose = require('mongoose');

const FundingOpportunitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  agency: { type: String, required: true },
  amount: { type: String, required: true },
  duration: { type: String, required: true },
  scope: { type: String, required: true },
  status: { type: String, default: 'Applications Open' }
}, { timestamps: true });

module.exports = mongoose.model('FundingOpportunity', FundingOpportunitySchema);
