const mongoose = require("mongoose");

const academicCalendarSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  calendarData: { type: String, required: true }, // File path
  uploadTimestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AcademicCalendar", academicCalendarSchema);
