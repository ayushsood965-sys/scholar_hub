const mongoose = require('mongoose');

const studentSemesterMappingSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicSessionMaster',
      required: true
    },
    degreeTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DegreeTypeMaster',
      required: true
    },
    degreeNameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DegreeNameMaster',
      required: true
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SemesterMaster',
      required: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    mappedSubjects: [
      {
        timetableSlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimetableMaster' },
        subjectCode: { type: String },
        subjectName: { type: String }
      }
    ],
    mappedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    mappedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// A student can only have one mapping per session+degreeType+degreeName+semester
studentSemesterMappingSchema.index(
  { studentId: 1, sessionId: 1, degreeTypeId: 1, degreeNameId: 1, semesterId: 1 },
  { unique: true }
);

module.exports = mongoose.model('StudentSemesterMapping', studentSemesterMappingSchema);
