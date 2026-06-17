const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  speaker: { type: String, required: true },
  type: { type: String, enum: ['Conference', 'Workshop', 'Seminar', 'Other'], default: 'Seminar' }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
