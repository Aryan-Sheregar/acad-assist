const express = require("express");
const {
  uploadTimetable,
  uploadAcademicCalendar,
  uploadSyllabus,
} = require("../controllers/fileController");
const router = express.Router();

router.post("/upload-timetable", uploadTimetable);
router.post("/upload-calendar", uploadAcademicCalendar);
router.post("/upload-syllabus", uploadSyllabus);

module.exports = router;
