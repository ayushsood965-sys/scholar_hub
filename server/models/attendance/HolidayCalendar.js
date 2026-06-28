const mongoose = require('mongoose');

const holidayCalendarSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null // null indicates university-wide
    },
    title: {
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
    isRecurring: {
      type: Boolean,
      default: false
    },
    holidayType: {
      type: String,
      enum: ['NATIONAL', 'STATE', 'RESTRICTED', 'OPTIONAL', 'DEPARTMENTAL', 'EMERGENCY_CLOSURE'],
      default: 'NATIONAL'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('HolidayCalendar', holidayCalendarSchema);
