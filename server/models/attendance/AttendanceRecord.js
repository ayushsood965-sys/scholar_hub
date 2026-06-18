const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSessionMaster',
      required: true
    },
    timetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimetableMaster',
      default: null
    },
    courseCode: {
      type: String,
      default: 'DAILY' // For PhD daily logs
    },
    courseName: {
      type: String,
      default: 'Daily Check-In'
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: [
        'PRESENT', 'ABSENT', 'LATE', 'LATE_EXCUSED', 
        'DUTY_LEAVE', 'MEDICAL_LEAVE', 'CASUAL_LEAVE', 
        'HALF_DAY_PRESENT', 'HALF_DAY_ABSENT', 'ON_RESEARCH', 
        'CONFERENCE', 'FIELD_VISIT', 'SEMINAR', 'HOLIDAY', 
        'CANCELLED', 'NOT_MARKED'
      ],
      required: true
    },
    leaveRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveRequest',
      default: null
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    markedAt: {
      type: Date,
      default: Date.now
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    lastEditedAt: {
      type: Date,
      default: null
    },
    remarks: {
      type: String,
      default: ''
    },
    isLocked: {
      type: Boolean,
      default: false
    },
    lockReason: {
      type: String,
      default: ''
    },
    attendanceSource: {
      type: String,
      enum: ['MANUAL', 'BIOMETRIC', 'QR', 'SYSTEM'],
      default: 'MANUAL'
    },
    correctionRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceCorrection',
      default: null
    },
    auditHistory: [
      {
        editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        editedAt: { type: Date, default: Date.now },
        previousStatus: String,
        newStatus: String,
        reason: String
      }
    ]
  },
  { timestamps: true }
);

// Ensure a single record per student per slot/date combination
attendanceRecordSchema.index({ studentId: 1, date: 1, timetableId: 1, courseCode: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
