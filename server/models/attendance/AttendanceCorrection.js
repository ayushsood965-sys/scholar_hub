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
    requestedStatus: {
      type: String,
      required: true
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

module.exports = mongoose.model('AttendanceCorrection', attendanceCorrectionSchema);
