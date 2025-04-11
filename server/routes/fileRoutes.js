import express from "express";
import {
  uploadTimetable,
  uploadAcademicCalendar,
  uploadSyllabus,
  getTimetableSummary,
} from "../controllers/fileController.js";
const router = express.Router();

router.post("/upload-timetable", uploadTimetable);
router.post("/upload-calendar", uploadAcademicCalendar);
router.post("/upload-syllabus", uploadSyllabus);
router.post("/timetable-summary", getTimetableSummary);

module.exports = router;
