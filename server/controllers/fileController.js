import multer from "multer";
import path from "path";
import fs from "fs";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import Timetable from "../models/Timetable.js";
import AcademicCalendar from "../models/AcademicCalendar.js";
import Syllabus from "../models/Syllabus.js";

// Initialize Google Vision client with explicit credentials
const visionClient = new ImageAnnotatorClient({
  keyFilename: path.join(__dirname, "../GV.json"), // Adjust path as needed
});

// Test the client on startup (optional but recommended)
visionClient
  .textDetection(
    "https://storage.googleapis.com/cloud-samples-data/vision/ocr/sign.jpg"
  )
  .then(() => console.log("Google Vision API connection successful"))
  .catch((err) => console.error("Vision API connection failed:", err.message));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || "server/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Google Vision OCR function
async function performOCR(imagePath) {
  try {
    const [result] = await visionClient.textDetection(imagePath);
    const detections = result.textAnnotations;
    return detections && detections.length > 0 ? detections[0].description : "";
  } catch (error) {
    console.error("Vision API Error:", error);
    throw new Error("OCR processing failed");
  }
}

const uploadTimetableMiddleware = multer({
  storage,
  fileFilter: (req, file, cb) => {
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

const uploadCalendarMiddleware = (req, res, next) => {
  const multerMiddleware = multer({
    storage,
    fileFilter: (req, file, cb) => {
      const filetypes = /jpeg|jpg|png|pdf|txt|doc|docx/;
      const extname = filetypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      const mimetype = filetypes.test(file.mimetype);
      if (extname && mimetype) {
        return cb(null, true);
      }
      cb(
        new Error(
          "Only image (JPEG, PNG) or document (PDF, TXT, DOC, DOCX) files are allowed!"
        )
      );
    },
  }).single("calendar");

  multerMiddleware(req, res, async (err) => {
    if (err) {
      return next(err);
    }

    if (!req.file) {
      return next(new Error("No file uploaded"));
    }

    if (req.file.mimetype.startsWith("image/")) {
      try {
        const text = await performOCR(req.file.path);
        console.log("\n📄 Raw OCR Text:\n", text);

        const lines = text
          .split("\n")
          .map((line) => line.replace(/[^\x00-\x7F]/g, "").trim())
          .filter((line) => line !== "");

        const calendarData = [];
        let skipHeader = true;
        let pendingDate = null;

        for (const line of lines) {
          console.log("🔍 Processing Line:", line);

          if (skipHeader) {
            if (
              line.toLowerCase().includes("date") ||
              line.toLowerCase().includes("day")
            ) {
              skipHeader = false;
              continue;
            }
          }

          // Case 1: Line contains both date and day (e.g., "31.03.2025 Monday")
          const dateWithDayMatch = line.match(/(\d{2}\.\d{2}\.\d{4})\s+(\w+)/);
          if (dateWithDayMatch) {
            const entry = {
              date: dateWithDayMatch[1],
              day: dateWithDayMatch[2],
            };

            // Check if there's any additional text (holiday description)
            const remainingText = line.replace(dateWithDayMatch[0], "").trim();
            if (remainingText) {
              entry.holiday = remainingText;
            }

            calendarData.push(entry);
            pendingDate = null; // Reset any pending date
            continue;
          }

          // Case 2: Line contains only a date (e.g., "14.01.2025")
          const dateOnlyMatch = line.match(/^(\d{2}\.\d{2}\.\d{4})$/);
          if (dateOnlyMatch) {
            pendingDate = dateOnlyMatch[1];
            continue;
          }

          // Case 3: Line contains only a day name and we have a pending date
          const dayOnlyMatch = line.match(/^(\w+)$/);
          if (pendingDate && dayOnlyMatch) {
            calendarData.push({
              date: pendingDate,
              day: dayOnlyMatch[1],
            });
            pendingDate = null;
            continue;
          }

          // Original parsing logic as fallback
          const parts = line
            .split(/\s{2,}|[\|\t\-]+/)
            .map((part) => part.trim())
            .filter((part) => part !== "");

          if (parts.length >= 2) {
            const entry = {
              date: parts[0],
              day: parts[1],
            };

            if (parts.length >= 3) {
              entry.holiday = parts.slice(2).join(" ");
            }

            calendarData.push(entry);
            pendingDate = null; // Reset any pending date
          }
        }

        console.log("✅ Extracted Calendar Data:", calendarData);
        req.calendarData = calendarData;
        next();
      } catch (ocrErr) {
        next(new Error(`OCR processing failed: ${ocrErr.message}`));
      }
    } else {
      next();
    }
  });
};

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

// Enhanced timetable parser for Vision API output
const parseTimetable = (text) => {
  console.log("Raw timetable text:", text);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // More flexible regex patterns
  const timeRegex = /(\d{1,2}:\d{2})\s*(?:TO|To|to|-)\s*(\d{1,2}:\d{2})/i;
  const courseRegex = /([A-Z]{2,4})\s*(\d{3})(?:\s*\(?([A-Z]\s*\d+)\)?)?/g;

  const timetable = {};
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);

  console.log("Processed lines:", lines);

  // Initialize structure for all days
  days.forEach((day) => {
    timetable[day] = {};
  });

  // Extract time slots first
  const timeSlots = [];
  for (const line of lines) {
    const timeMatch = line.match(timeRegex);
    if (timeMatch) {
      let startTime = timeMatch[1];
      let endTime = timeMatch[2];

      // Standardize time format (convert 01:00 to 13:00 for afternoon slots)
      if (startTime.startsWith("0") && parseInt(startTime.split(":")[0]) > 0) {
        const hourPart = parseInt(startTime.split(":")[0]);
        const minutePart = startTime.split(":")[1];
        startTime = `${hourPart + 12}:${minutePart}`;
      }

      if (endTime.startsWith("0") && parseInt(endTime.split(":")[0]) > 0) {
        const hourPart = parseInt(endTime.split(":")[0]);
        const minutePart = endTime.split(":")[1];
        endTime = `${hourPart + 12}:${minutePart}`;
      }

      timeSlots.push(`${startTime}-${endTime}`);
    }
  }

  console.log("Found time slots:", timeSlots);

  let currentDay = null;
  let currentSlotIndex = -1;

  for (const line of lines) {
    // Check if line is a day
    if (days.includes(line)) {
      currentDay = line;
      currentSlotIndex = 0;
      console.log(`Processing day: ${currentDay}`);
      continue;
    }

    // Skip time slot lines - we've already processed them
    if (line.match(timeRegex)) {
      continue;
    }

    // Skip lines with just numbers (row labels)
    if (/^\d+$/.test(line)) {
      continue;
    }

    // Process course information for current day
    if (currentDay) {
      // Reset course regex lastIndex
      courseRegex.lastIndex = 0;

      const courses = [];
      let match;
      while ((match = courseRegex.exec(line)) !== null) {
        const courseCode = `${match[1]} ${match[2]}`;
        const room = match[3] || "";
        courses.push(`${courseCode}${room ? `(${room})` : ""}`);
      }

      if (courses.length > 0) {
        if (currentSlotIndex < timeSlots.length) {
          const timeSlot = timeSlots[currentSlotIndex];
          timetable[currentDay][timeSlot] = courses.join(", ");
          console.log(
            `Added to ${currentDay} at ${timeSlot}: ${courses.join(", ")}`
          );
          currentSlotIndex++;
        }
      }
    }
  }

  // Fill in empty time slots with standard time slots
  const standardTimeSlots = [
    "09:00-09:55",
    "10:00-10:55",
    "11:00-11:55",
    "12:00-12:55",
    "13:00-13:55",
    "14:00-14:55",
    "15:00-15:55",
    "16:00-17:30",
  ];

  days.forEach((day) => {
    // First, copy any existing time slots
    const existingSlots = { ...timetable[day] };

    // Then initialize with standard slots
    standardTimeSlots.forEach((slot) => {
      timetable[day][slot] = "Free";
    });

    // Finally, copy back the existing data
    for (const slot in existingSlots) {
      // Find the closest standard time slot
      const bestMatch = findClosestTimeSlot(slot, standardTimeSlots);
      timetable[day][bestMatch] = existingSlots[slot];
    }
  });

  // Helper function to find the closest standard time slot
  function findClosestTimeSlot(actualSlot, standardSlots) {
    // This is a simple implementation - just returns the actual slot
    // In a more complex version, you could calculate time differences
    return (
      standardSlots.find((slot) => slot === actualSlot) || standardSlots[0]
    );
  }

  console.log("Final parsed timetable:", JSON.stringify(timetable, null, 2));
  return timetable;
};

exports.uploadTimetable = async (req, res) => {
  uploadTimetableMiddleware(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const { userId } = req.body;

      if (!userId) {
        // return res.status(400).json({ error: "userId is required" });
        userId = "default_user";
        console.log("Using default userId: ", userId);
      }

      const imagePath = req.file.path;

      console.log("Uploaded image path:", imagePath);
      console.log("Processing for userId:", userId);

      // Debugging: Verify file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error(`File not found at path: ${imagePath}`);
      }

      console.log("Starting OCR with Google Vision API...");
      const text = await performOCR(imagePath);
      console.log("OCR Text:", text);

      const timetableData = parseTimetable(text);

      // Delete any existing timetable for this user to avoid duplicates
      await Timetable.findOneAndDelete({ userId });

      const timetable = new Timetable({
        userId,
        filePath: imagePath,
        timetableData,
        ocrEngine: "google-vision",
      });

      const savedTimetable = await timetable.save();
      console.log("Saved timetable with ID:", savedTimetable._id);

      res.status(201).json({
        message: "Timetable uploaded and processed successfully",
        timetableId: savedTimetable._id,
        timetableData,
      });
    } catch (error) {
      console.error("Error in uploadTimetable:", error);
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        error: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  });
};

exports.uploadAcademicCalendar = (req, res) => {
  uploadCalendarMiddleware(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const { userId, startDate, endDate } = req.body;
      const parseDate = (str) => {
        const [day, month, year] = str.split(".");
        return new Date(`${year}-${month}-${day}`);
      };

      const calendar = new AcademicCalendar({
        userId,
        filePath: req.file.path,
        calendarData: req.calendarData || null,
        startDate: parseDate(startDate),
        endDate: parseDate(endDate),
        ocrEngine: req.file.mimetype.startsWith("image/")
          ? "google-vision"
          : null,
      });
      await calendar.save();
      res.status(201).json({
        message: "Academic calendar uploaded successfully",
        file: req.file,
        calendarData: req.calendarData,
      });
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
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
      const syllabus = new Syllabus({
        userId,
        syllabusData: req.file.path,
        uploadTimestamp: Date.now(),
      });
      await syllabus.save();
      res.status(201).json({
        message: "Syllabus uploaded successfully",
        file: req.file,
      });
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  });
};

exports.getTimetableSummary = async (req, res) => {
  try {
    // Get userId from either body or params, ensuring backward compatibility
    const userId = req.params.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    console.log("Looking for timetable with userId:", userId);

    const timetable = await Timetable.findOne({ userId });
    if (!timetable) {
      return res.status(404).json({ error: "Timetable not found" });
    }

    console.log("Found timetable:", timetable._id);

    const summary = {};
    const timetableData = timetable.timetableData;

    for (const day in timetableData) {
      const slots = timetableData[day];
      for (const slot in slots) {
        const subject = slots[slot];
        if (subject !== "Free") {
          // Match all course codes in the subject string
          const coursesMatches = [
            ...subject.matchAll(/(CSE|SEC|MGT|VAC)\s*\d+/gi),
          ];

          if (coursesMatches.length > 0) {
            for (const match of coursesMatches) {
              const courseCode = match[0].replace(/\s+/g, " ");
              summary[courseCode] = (summary[courseCode] || 0) + 1;
            }
          } else {
            // Fallback if no courses matched the regex
            console.log(`Non-matching subject entry: ${subject}`);
          }
        }
      }
    }

    res.status(200).json({
      summary,
      ocrEngine: timetable.ocrEngine || "unknown",
    });
  } catch (error) {
    console.error("Error in getTimetableSummary:", error);
    res.status(500).json({ error: error.message });
  }
};
