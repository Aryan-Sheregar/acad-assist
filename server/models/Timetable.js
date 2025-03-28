const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  filePath: { type: String, required: true }, // Path to the file
  timetableData: { type: Object, required: true }, // Structured data: { day: { time: subject } }
  uploadTimestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Timetable", timetableSchema);
