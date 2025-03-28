const mongoose = require("mongoose");

const syllabusSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  syllabusData: { type: String, required: true }, // File path
  uploadTimestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Syllabus", syllabusSchema);
