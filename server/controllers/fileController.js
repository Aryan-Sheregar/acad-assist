const multer = require("multer");
const path = require("path");
const Timetable = require("../models/Timetable");
const AcademicCalendar = require("../models/AcademicCalendar");
const Syllabus = require("../models/Syllabus");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploadTimetableMiddleware = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|txt|doc|docx/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only PDF, TXT, DOC, or DOCX files are allowed!"));
  },
}).single("timetable");

const uploadCalendarMiddleware = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|txt|doc|docx/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only PDF, TXT, DOC, or DOCX files are allowed!"));
  },
}).single("calendar");

const uploadSyllabusMiddleware = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|txt|doc|docx/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only PDF, TXT, DOC, or DOCX files are allowed!"));
  },
}).single("syllabus");

exports.uploadTimetable = (req, res) => {
  uploadTimetableMiddleware(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const { userId } = req.body;
      const timetable = new Timetable({ userId, timetableData: req.file.path });
      await timetable.save();
      res
        .status(201)
        .json({ message: "Timetable uploaded successfully", file: req.file });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

exports.uploadAcademicCalendar = (req, res) => {
  uploadCalendarMiddleware(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const { userId } = req.body;
      const calendar = new AcademicCalendar({
        userId,
        calendarData: req.file.path,
      });
      await calendar.save();
      res
        .status(201)
        .json({
          message: "Academic calendar uploaded successfully",
          file: req.file,
        });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

exports.uploadSyllabus = (req, res) => {
  uploadSyllabusMiddleware(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const { userId } = req.body;
      const syllabus = new Syllabus({ userId, syllabusData: req.file.path });
      await syllabus.save();
      res
        .status(201)
        .json({ message: "Syllabus uploaded successfully", file: req.file });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};
