const mongoose = require('mongoose');

const CategoryGenderMasterSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['CATEGORY', 'GENDER'],
    uppercase: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Compound index to prevent duplicates
CategoryGenderMasterSchema.index({ type: 1, value: 1 }, { unique: true });

module.exports = mongoose.model('CategoryGenderMaster', CategoryGenderMasterSchema);
