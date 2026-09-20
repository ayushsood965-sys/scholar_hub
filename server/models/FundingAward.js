const mongoose = require('mongoose');

const DisbursementEntrySchema = new mongoose.Schema({
  monthYear: { type: String, required: true }, // e.g. "September 2026", "2026-09"
  amount: { type: Number, required: true }, // e.g. 37000
  amountFormatted: { type: String, default: '' }, // e.g. "₹37,000"
  status: { 
    type: String, 
    enum: ['DISBURSED', 'PAID', 'PENDING', 'HELD', 'CANCELLED'], 
    default: 'DISBURSED' 
  },
  disbursedAt: { type: Date, default: Date.now },
  referenceNo: { type: String, default: '' }, // e.g. "PFMS-89320" / "UTR-482910" / "Voucher #104"
  remarks: { type: String, default: '' },
  disbursedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

const FundingAwardSchema = new mongoose.Schema({
  scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thesisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thesis', default: null },
  fundingOpportunityId: { type: mongoose.Schema.Types.ObjectId, ref: 'FundingOpportunity', default: null },
  awardTitle: { type: String, required: true },
  monthlyStipend: { type: String, default: '' },
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
  awardedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  disbursementLedger: [DisbursementEntrySchema]
}, { timestamps: true });

module.exports = mongoose.model('FundingAward', FundingAwardSchema);
