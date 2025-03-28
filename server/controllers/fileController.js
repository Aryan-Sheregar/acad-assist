const multer = require("multer");
const path = require("path");
const Timetable = require("../models/Timetable");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
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

exports.uploadTimetable = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const { userId } = req.body;
      const timetable = new Timetable({
        userId,
        timetableData: req.file.path,
      });
      await timetable.save();
      res
        .status(201)
        .json({ message: "Timetable uploaded successfully", file: req.file });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};
