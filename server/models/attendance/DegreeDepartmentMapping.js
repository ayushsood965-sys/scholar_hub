const mongoose = require('mongoose');

const DegreeDepartmentMappingSchema = new mongoose.Schema({
  degreeNameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DegreeNameMaster',
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

DegreeDepartmentMappingSchema.index({ degreeNameId: 1, departmentId: 1 }, { unique: true });

module.exports = mongoose.model('DegreeDepartmentMapping', DegreeDepartmentMappingSchema);
