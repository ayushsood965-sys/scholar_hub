const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true
  },
  leaveType: {
    type: String,
    enum: ['CASUAL', 'MEDICAL', 'DUTY', 'MATERNITY', 'PATERNITY', 'CO_CURRICULAR'],
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
  totalDays: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  documentUrl: {
    type: String // Required for MEDICAL if > 2 days, and CO_CURRICULAR (NCC/NSS/Sports)
  },
  status: {
    type: String,
    enum: ['PENDING_SUPERVISOR', 'PENDING_HOD', 'APPROVED', 'REJECTED'],
    default: 'PENDING_SUPERVISOR'
  },
  currentAssigneeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  auditLog: [{
    action: String,
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: String,
    date: { type: Date, default: Date.now },
    remarks: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
