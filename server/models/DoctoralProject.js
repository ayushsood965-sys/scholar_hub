const mongoose = require('mongoose');

const DoctoralProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: String, required: true },
  abstract: { type: String, required: true },
  scholarName: { type: String, required: true },
  supervisorName: { type: String, required: true },
  status: { type: String, default: 'ACTIVE_RESEARCH' },
  imageUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('DoctoralProject', DoctoralProjectSchema);
