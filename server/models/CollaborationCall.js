const mongoose = require('mongoose');

const CollaborationCallSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, default: 'Industry Partner' },
  department: { type: String, required: true },
  status: { type: String, default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('CollaborationCall', CollaborationCallSchema);
