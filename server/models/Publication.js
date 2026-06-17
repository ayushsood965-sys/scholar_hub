const mongoose = require('mongoose');

const PublicationSchema = new mongoose.Schema({
  scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thesisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thesis', required: true },
  type: { type: String, enum: ['JOURNAL', 'CONFERENCE', 'PATENT', 'IPR'], default: 'JOURNAL' },
  iprType: { type: String },
  itemStatus: { type: String },
  title: { type: String, required: true },
  journalName: { type: String, required: true },
  issn: { type: String },
  publicationDate: { type: Date, default: Date.now },
  paperLink: { type: String },
  doiUrl: { type: String },
  attachmentUrl: { type: String },
  documentUrl: { type: String }, // Handles PDF upload
  status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Publication', PublicationSchema);
