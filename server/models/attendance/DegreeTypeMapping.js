const mongoose = require('mongoose');

const DegreeTypeMappingSchema = new mongoose.Schema({
  degreeNameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DegreeNameMaster',
    required: true
  },
  degreeTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DegreeTypeMaster',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('DegreeTypeMapping', DegreeTypeMappingSchema);
