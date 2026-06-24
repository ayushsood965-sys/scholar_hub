const mongoose = require('mongoose');

const SemesterDegreeMappingSchema = new mongoose.Schema({
  degreeNameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DegreeNameMaster',
    required: true
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SemesterMaster',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Ensure uniqueness of degree-semester mappings
SemesterDegreeMappingSchema.index({ degreeNameId: 1, semesterId: 1 }, { unique: true });

module.exports = mongoose.model('SemesterDegreeMapping', SemesterDegreeMappingSchema);
