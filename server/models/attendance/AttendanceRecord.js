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
    degreeTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DegreeTypeMaster',
      default: null
    },
    degreeNameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DegreeNameMaster',
      default: null
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SemesterMaster',
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
    classes: [
      {
        timetableSlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimetableMaster' },
        subjectName: String,
        selected: { type: Boolean, default: false },
        isCancelled: { type: Boolean, default: false }
      }
    ],
    isLeaveOverride: {
      type: Boolean,
      default: false
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
      enum: ['PRESENT', 'ABSENT', 'ON_LEAVE', 'NOT_APPLICABLE'],
      required: true
    },
    leaveRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveRequest',
      default: null
    },
    leaveType: {
      type: String,
      default: ''
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
    approvalStatus: {
      type: String,
      enum: ['PENDING_HOD', 'APPROVED'],
      default: 'APPROVED'
    },
    forwardedToHOD: {
      type: Boolean,
      default: false
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
