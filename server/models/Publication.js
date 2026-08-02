const mongoose = require('mongoose');

const PublicationSchema = new mongoose.Schema({
  scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thesisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thesis', required: true },
  type: { 
    type: String, 
    enum: ['JOURNAL', 'PUBLICATION', 'CONFERENCE', 'CONFERENCE_PROCEEDINGS', 'PATENT', 'IPR', 'WORKSHOP', 'SYMPOSIUM', 'TRAINING'], 
    default: 'PUBLICATION' 
  },
  publicationCategory: { type: String, default: '' },
  articleType: { type: String, default: 'Original Research Article' },
  publisherName: { type: String, default: '' },
  scope: { type: String, default: '' },
  role: { type: String, default: '' },
  mode: { type: String, default: '' },
  presentationType: { type: String, default: '' },
  conferenceName: { type: String, default: '' },
  proceedingsTitle: { type: String, default: '' },
  organizer: { type: String, default: '' },
  venueLocation: { type: String, default: '' },
  trainingType: { type: String, default: '' },
  duration: { type: String, default: '' },
  startDate: { type: Date },
  endDate: { type: Date },
  authors: { type: String, default: '' },
  inventors: { type: String, default: '' },
  applicant: { type: String, default: '' },
  applicationNo: { type: String, default: '' },
  impactFactor: { type: String, default: '' },
  isbn: { type: String, default: '' },
  iprType: { type: String, default: '' },
  itemStatus: { type: String, default: '' },
  indexing: { type: String, default: '' },
  volume: { type: String, default: '' },
  issue: { type: String, default: '' },
  pages: { type: String, default: '' },
  title: { type: String, required: true },
  journalName: { type: String, default: '' },
  issn: { type: String, default: '' },
  publicationDate: { type: Date, default: Date.now },
  paperLink: { type: String, default: '' },
  doiUrl: { type: String, default: '' },
  attachmentUrl: { type: String, default: '' },
  documentUrl: { type: String, default: '' }, // Handles PDF upload
  status: { type: String, enum: ['DRAFT', 'PENDING', 'UNDER_REVIEW_HOD', 'VERIFIED', 'REJECTED_BY_SUPERVISOR', 'REJECTED_BY_HOD'], default: 'DRAFT' },
  remarks: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Publication', PublicationSchema);
