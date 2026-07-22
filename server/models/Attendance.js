const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true
  },
  program: {
    type: String, // e.g., PhD, M.Sc, B.Tech
  },
  markedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'LEAVE', 'HOLIDAY'],
    required: true
  },
  type: {
    type: String,
    enum: ['COURSEWORK', 'LAB', 'SEMINAR', 'DAILY'],
    default: 'DAILY'
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  remarks: {
    type: String
  }
}, { timestamps: true });

// Ensure unique attendance per student per day for a specific type
attendanceSchema.index({ studentId: 1, date: 1, type: 1 }, { unique: true });
attendanceSchema.index({ studentId: 1, date: -1 });
attendanceSchema.index({ department: 1, date: -1, status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
