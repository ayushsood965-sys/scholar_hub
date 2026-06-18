const mongoose = require('mongoose');

const timetableMasterSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    courseCode: {
      type: String,
      required: true
    },
    courseName: {
      type: String,
      required: true
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: {
      type: String, // HH:MM e.g. "09:00"
      required: true
    },
    endTime: {
      type: String, // HH:MM e.g. "10:00"
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TimetableMaster', timetableMasterSchema);
