const mongoose = require('mongoose');

const ChangeRequestSchema = new mongoose.Schema({
  scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thesisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thesis', required: true },
  type: { type: String, enum: ['TITLE_CHANGE', 'GUIDE_CHANGE'], required: true },
  currentValue: { type: String, required: true },
  proposedValue: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ChangeRequest', ChangeRequestSchema);
