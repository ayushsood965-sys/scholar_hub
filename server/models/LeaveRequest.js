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
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  leaveType: {
    type: String,
    required: true
  },
  leaveTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaveTypeMaster',
    default: null
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
  isHalfDay: {
    type: Boolean,
    default: false
  },
  reason: {
    type: String,
    required: true
  },
  documentUrl: {
    type: String 
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
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

leaveRequestSchema.index({ departmentId: 1, status: 1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
