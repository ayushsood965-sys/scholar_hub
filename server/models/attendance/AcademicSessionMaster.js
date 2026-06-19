const mongoose = require('mongoose');

const academicSessionMasterSchema = new mongoose.Schema(
  {
    sessionName: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    isCurrent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcademicSessionMaster', academicSessionMasterSchema);
