const mongoose = require('mongoose');

const additionalDocumentSchema = new mongoose.Schema(
  {
    scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    thesisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thesis', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    documentUrl: { type: String, required: true },
    forwardedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    forwardedRole: { type: String, enum: ['SUPERVISOR', 'HOD'], required: true },
    department: { type: String, required: true },
    status: { type: String, enum: ['SUBMITTED', 'REVIEWED'], default: 'SUBMITTED' },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdditionalDocument', additionalDocumentSchema);
