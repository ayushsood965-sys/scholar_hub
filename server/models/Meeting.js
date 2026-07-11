const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    thesisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thesis', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    reason: { type: String, required: true },
    invitedAttendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Accepted
    rejectedAttendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Rejected
    department: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    remarks: { type: String, default: '' },
    responseLogs: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        action: { type: String, enum: ['ACCEPT', 'REJECT'] },
        timestamp: { type: Date, default: Date.now }
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Meeting', meetingSchema);
