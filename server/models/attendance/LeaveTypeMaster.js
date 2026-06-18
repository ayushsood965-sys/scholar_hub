const mongoose = require('mongoose');

const leaveTypeMasterSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null // null indicates global leave type available to all departments
    },
    leaveName: {
      type: String,
      required: true
    },
    leaveCode: {
      type: String,
      required: true,
      uppercase: true
    },
    maxDaysPerYear: {
      type: Number,
      default: null // null indicates unlimited (e.g. duty leave)
    },
    requiresDocument: {
      type: Boolean,
      default: false
    },
    countsAsPresent: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeaveTypeMaster', leaveTypeMasterSchema);
