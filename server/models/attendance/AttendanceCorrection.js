const mongoose = require('mongoose');

const attendanceCorrectionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceRecord',
      required: true
    },
    // Which specific subjects (timetable slots) this correction is for
    timetableSlotIds: [{
      type: mongoose.Schema.Types.ObjectId,
      default: []
    }],
    // The status the student is requesting: PRESENT or ON_LEAVE
    correctionType: {
      type: String,
      enum: ['PRESENT', 'ON_LEAVE'],
      default: 'PRESENT'
    },
    // If correctionType is ON_LEAVE, which leave type
    leaveType: {
      type: String,
      default: ''
    },
    reason: {
      type: String,
      required: true
    },
    documentUrl: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['PENDING_FACULTY', 'PENDING_HOD', 'APPROVED', 'REJECTED'],
      default: 'PENDING_FACULTY'
    },
    // The faculty who marked the original attendance
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    facultyRemarks: {
      type: String,
      default: ''
    },
    hodRemarks: {
      type: String,
      default: ''
    },
    // Track correction attempts per subject per date
    correctionAttempt: {
      type: Number,
      default: 1
    },
    auditLog: [
      {
        action: String,
        actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        actorName: String,
        timestamp: { type: Date, default: Date.now },
        remarks: String
      }
    ]
  },
  { timestamps: true }
);

attendanceCorrectionSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model('AttendanceCorrection', attendanceCorrectionSchema);
