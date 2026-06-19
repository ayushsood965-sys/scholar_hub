const mongoose = require('mongoose');

const DegreeNameMasterSchema = new mongoose.Schema({
  degreeTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DegreeTypeMaster',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('DegreeNameMaster', DegreeNameMasterSchema);
