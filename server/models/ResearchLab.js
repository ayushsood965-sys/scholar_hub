const mongoose = require('mongoose');

const ResearchLabSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  focus: { type: String, required: true },
  projects: [{ type: String }],
  status: { type: String, default: 'Actively Recruiting Scholars' },
  description: { type: String, default: '' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  researchAreas: [{ type: String }],
  equipment: [{
    name: { type: String, required: true },
    description: { type: String, default: '' },
    isShared: { type: Boolean, default: false }
  }],
  website: { type: String, default: '' },
  location: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  labType: {
    type: String,
    enum: ['Departmental', 'Centre of Excellence', 'Collaborative Facility', 'Central Instrumentation'],
    default: 'Departmental'
  },
  fundingSupport: [{ type: String }],
  establishedYear: { type: Number, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('ResearchLab', ResearchLabSchema);
