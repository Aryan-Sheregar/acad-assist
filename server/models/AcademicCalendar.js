// models/AcademicCalendar.js
const mongoose = require("mongoose");

const calendarEntrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    day: { type: String, required: true },
    holiday: { type: String }, // Optional field
  },
  { _id: false }
); // _id: false prevents MongoDB from creating IDs for each entry

const academicCalendarSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  filePath: { type: String, required: true },
  calendarData: [calendarEntrySchema], // Array of calendar entry objects
  ocrEngine: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const AcademicCalendar = mongoose.model(
  "AcademicCalendar",
  academicCalendarSchema
);

module.exports = AcademicCalendar;
