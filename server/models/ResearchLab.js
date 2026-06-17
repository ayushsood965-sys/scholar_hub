const mongoose = require('mongoose');

const ResearchLabSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  focus: { type: String, required: true },
  projects: [{ type: String }],
  status: { type: String, default: 'Actively Recruiting Scholars' }
}, { timestamps: true });

module.exports = mongoose.model('ResearchLab', ResearchLabSchema);
