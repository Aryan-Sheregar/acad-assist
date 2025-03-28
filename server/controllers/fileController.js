const multer = require("multer");
const path = require("path");
const { createWorker } = require("tesseract.js");
const { fromPath } = require("pdf2pic");
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
    const filetypes = /pdf/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only PDF files are allowed!"));
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

exports.uploadTimetable = async (req, res) => {
  uploadTimetableMiddleware(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const { userId } = req.body;
      const filePath = req.file.path;

      // Convert PDF to image for OCR
      const output = fromPath(filePath, {
        format: "png",
        out_dir: "./uploads",
        file_name: `${path.basename(filePath, ".pdf")}.png`,
      });
      await output.bulk(-1); // Convert all pages
      const imagePath = `./uploads/${path.basename(filePath, ".pdf")}.png`;

      // OCR the image
      const worker = await createWorker();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      const {
        data: { text },
      } = await worker.recognize(imagePath);
      await worker.terminate();

      // Parse the OCR text
      const timetableData = parseTimetable(text);

      // Save to MongoDB
      const timetable = new Timetable({
        userId,
        filePath,
        timetableData,
      });
      await timetable.save();

      res
        .status(201)
        .json({
          message: "Timetable uploaded and processed successfully",
          timetableData,
        });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

const parseTimetable = (text) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = [
    "09:00-09:55",
    "10:00-10:55",
    "11:00-11:55",
    "12:00-12:55",
    "01:00-01:55",
    "02:00-02:55",
    "03:00-03:55",
    "04:00-05:30",
  ];

  const timetable = {};
  let currentDay = null;

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  lines.forEach((line) => {
    if (days.includes(line)) {
      currentDay = line;
      timetable[currentDay] = {};
    } else if (currentDay) {
      timeSlots.forEach((slot, index) => {
        if (line.includes(slot)) {
          const subjectMatch = line.match(/(CSE|MATH|PHY) \d{4}/);
          if (subjectMatch) {
            timetable[currentDay][slot] = subjectMatch[0];
          } else {
            timetable[currentDay][slot] = "Break";
          }
        }
      });
    }
  });

  return timetable;
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

exports.getTimetableSummary = async (req, res) => {
  try {
    const { userId } = req.body;
    const timetable = await Timetable.findOne({ userId });
    if (!timetable)
      return res.status(404).json({ error: "Timetable not found" });

    const summary = {};
    const timetableData = timetable.timetableData;

    for (const day in timetableData) {
      const slots = timetableData[day];
      for (const slot in slots) {
        const subject = slots[slot];
        if (subject !== "Break") {
          if (!summary[subject]) {
            summary[subject] = 0;
          }
          summary[subject] += 1;
        }
      }
    }

    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
