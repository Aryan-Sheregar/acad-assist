const express = require("express");
const { uploadTimetable } = require("../controllers/fileController");
const router = express.Router();

router.post("/upload-timetable", uploadTimetable);

module.exports = router;
