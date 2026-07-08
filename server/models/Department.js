const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    faculty: {
      type: String,
      default: '',
      trim: true
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FacultyMaster',
      default: null
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Department', departmentSchema);
