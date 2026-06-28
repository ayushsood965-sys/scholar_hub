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
    maxDaysLimitType: {
      type: String,
      enum: ['semester', 'year'],
      default: 'year'
    },
    maxDaysLimit: {
      type: Number,
      default: null // null indicates unlimited
    },
    documentUploadRule: {
      type: String,
      enum: ['none', 'optional', 'mandatory'],
      default: 'none'
    },
    requiresDocument: {
      type: Boolean,
      default: false
    },
    includeHolidays: {
      type: Boolean,
      default: false
    },
    countsAsPresent: {
      type: Boolean,
      default: false
    },
    minDaysPerRequest: {
      type: Number,
      default: 1
    },
    advanceNoticeDays: {
      type: Number,
      default: 0
    },
    allowHalfDay: {
      type: Boolean,
      default: false
    },
    applicableGender: {
      type: String,
      enum: ['All', 'Male', 'Female'],
      default: 'All'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeaveTypeMaster', leaveTypeMasterSchema);
