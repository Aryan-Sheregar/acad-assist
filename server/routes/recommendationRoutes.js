const express = require("express");
const {
  requestRecommendations,
  getSyllabusRecommendations,
} = require("../controllers/recommendationController");
const router = express.Router();

// Existing route for manual recommendations
router.post("/request", requestRecommendations);

// New route for syllabus-based recommendations
router.post("/syllabus", getSyllabusRecommendations);

module.exports = router;
