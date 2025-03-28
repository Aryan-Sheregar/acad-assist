const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  timetableData: { type: String, required: true },
  uploadTimestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Timetable', timetableSchema);