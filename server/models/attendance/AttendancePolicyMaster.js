const mongoose = require('mongoose');

const attendancePolicyMasterSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      index: true,
      default: null // null indicates Global Default (Super Admin fallback policy)
    },
    degreeNameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DegreeNameMaster',
      required: true
    },
    minRequiredPercentage: {
      type: Number,
      required: true,
      default: 75
    },
    warningThreshold: {
      type: Number,
      required: true,
      default: 80
    },
    maxCondonationPercentage: {
      type: Number,
      required: true,
      default: 10
    },
    editLockHours: {
      type: Number,
      required: true,
      default: 48
    },
    allowHalfDay: {
      type: Boolean,
      default: true
    },
    allowMedicalLeave: {
      type: Boolean,
      default: true
    },
    allowDutyLeave: {
      type: Boolean,
      default: true
    },
    allowCorrection: {
      type: Boolean,
      default: true
    },
    correctionWindowDays: {
      type: Number,
      default: 14
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Compound index on departmentId + degreeNameId
attendancePolicyMasterSchema.index({ departmentId: 1, degreeNameId: 1 }, { unique: true });

module.exports = mongoose.model('AttendancePolicyMaster', attendancePolicyMasterSchema);
