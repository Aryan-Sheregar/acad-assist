const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { createWorker } = require("tesseract.js");
const Timetable = require("../models/Timetable");
const AcademicCalendar = require("../models/AcademicCalendar");
const Syllabus = require("../models/Syllabus");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || "server/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploadTimetableMiddleware = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept image files only
    const filetypes = /jpeg|jpg|png|gif|bmp|webp/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files (JPEG, PNG, GIF, BMP, WEBP) are allowed!"));
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
      const imagePath = req.file.path;

      console.log("Uploaded image path:", imagePath);

      // Ensure upload directory exists
      const uploadDir = path.dirname(imagePath);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log("Created uploads directory:", uploadDir);
      }

      // Check if file exists before proceeding
      if (!fs.existsSync(imagePath)) {
        return res.status(500).json({
          error: "Image upload failed - file not found",
          imagePath,
        });
      }

      // OCR the image using Tesseract.js v3.x
      console.log("Starting OCR process...");
      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(imagePath);
      await worker.terminate();

      console.log("OCR Text:", text);

      // Parse the OCR text
      const timetableData = parseTimetable(text);

      // Save to MongoDB
      const timetable = new Timetable({
        userId,
        filePath: imagePath,
        timetableData,
      });
      await timetable.save();

      res.status(201).json({
        message: "Timetable uploaded and processed successfully",
        timetableData,
      });
    } catch (error) {
      console.error("Error in uploadTimetable:", error);
      res.status(500).json({ error: error.message });
    }
  });
};

const parseTimetable = (text) => {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const timeSlots = [
    "09:00-09:55",
    "09:00 To 09:55",
    "10:00-10:55",
    "10:00 To 10:55",
    "11:00-11:55",
    "11:00 To 11:55",
    "12:00-12:55",
    "12:00 To 12:55",
    "01:00-01:55",
    "01:00 To 01:55",
    "02:00-02:55",
    "02:00 To 02:55",
    "03:00-03:55",
    "03:00 To 03:55",
    "04:00-05:30",
    "04:00 To 05:30",
  ];

  const timetable = {};
  let currentDay = null;

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  console.log("Parsed lines:", lines);

  // Initialize days to ensure we have a structure even if parsing is imperfect
  days.forEach((day) => {
    timetable[day] = {};
  });

  // First, try to identify the days and the time structure
  lines.forEach((line) => {
    // Check if the line is a day name
    const dayMatch = days.find((day) =>
      line.toLowerCase().includes(day.toLowerCase())
    );
    if (dayMatch) {
      currentDay = dayMatch;
      console.log("Found day:", currentDay);
    }
    // Check if the line contains a time slot and course code
    else if (currentDay) {
      for (const slot of timeSlots) {
        if (line.includes(slot)) {
          // Look for course codes like CSE 455, SEC 136, MGT 275, VAC 109
          const courseMatch = line.match(
            /(CSE|SEC|MGT|VAC)\s*\d+(\s*\(\w+\s*\d+\))?/i
          );
          if (courseMatch) {
            const course = courseMatch[0].replace(/\s+/g, " ");
            timetable[currentDay][slot] = course;
            console.log(`Found course for ${currentDay} at ${slot}: ${course}`);
          }
        }
      }
    }
  });

  // Fallback: If the above approach doesn't find much data, try to extract course codes
  // and match them with day/time based on positioning in the text
  let coursesFound = 0;
  for (const day in timetable) {
    coursesFound += Object.keys(timetable[day]).length;
  }

  if (coursesFound < 5) {
    // Arbitrary threshold to determine if main parsing worked
    console.log(
      "Main parsing found few courses. Trying alternative parsing method"
    );

    // Look for all course codes in the entire text
    const courseRegex = /(CSE|SEC|MGT|VAC)\s*\d+(\s*\(\w+\s*\d+\))?/gi;
    let match;
    const allCourses = [];

    while ((match = courseRegex.exec(text)) !== null) {
      allCourses.push({
        course: match[0],
        position: match.index,
      });
    }

    console.log("Found courses:", allCourses);

    // Simple table structure inference
    // This is a simplified approach - in a real implementation, you'd need more
    // sophisticated logic to determine which day/time each course belongs to
    if (allCourses.length > 0) {
      // For demonstration, let's just assign some of these to time slots
      // You would need to customize this based on your actual timetable structure
      const slotsArray = timeSlots.filter((v, i) => i % 2 === 0); // Take unique time slots

      // Simple distribution of courses across days and times
      // This would need to be refined based on actual table structure
      let courseIndex = 0;
      days.slice(0, 5).forEach((day) => {
        // Assume Mon-Fri
        slotsArray.forEach((slot) => {
          if (courseIndex < allCourses.length) {
            timetable[day][slot] = allCourses[courseIndex].course.replace(
              /\s+/g,
              " "
            );
            courseIndex++;
          }
        });
      });
    }
  }

  // Fill empty slots with "Free"
  days.forEach((day) => {
    timeSlots
      .filter((v, i) => i % 2 === 0)
      .forEach((slot) => {
        if (!timetable[day][slot]) {
          timetable[day][slot] = "Free";
        }
      });
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
      res.status(201).json({
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
        // Skip free slots
        if (subject !== "Free") {
          // Extract just the course code without room numbers
          const courseMatch = subject.match(/(CSE|SEC|MGT|VAC)\s*\d+/i);
          if (courseMatch) {
            const courseCode = courseMatch[0].replace(/\s+/g, " ");

            if (!summary[courseCode]) {
              summary[courseCode] = 0;
            }
            summary[courseCode] += 1;
          }
        }
      }
    }

    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
