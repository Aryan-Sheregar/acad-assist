const express = require("express");
const {
  requestRecommendations,
} = require("../controllers/recommendationController");
const router = express.Router();

router.post("/request", requestRecommendations);

module.exports = router;
