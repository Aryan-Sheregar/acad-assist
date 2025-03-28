const express = require("express");
const {
  uploadTimetable,
  uploadAcademicCalendar,
  uploadSyllabus,
  getTimetableSummary,
} = require("../controllers/fileController");
const router = express.Router();

router.post("/upload-timetable", uploadTimetable);
router.post("/upload-calendar", uploadAcademicCalendar);
router.post("/upload-syllabus", uploadSyllabus);
router.post("/timetable-summary", getTimetableSummary);

module.exports = router;
