import express from "express";
import {
  requestRecommendations,
  getSyllabusRecommendations,
} from "../controllers/recommendationController.js";
const router = express.Router();

// Existing route for manual recommendations
router.post("/request", requestRecommendations);

// New route for syllabus-based recommendations
router.post("/syllabus", getSyllabusRecommendations);

module.exports = router;
