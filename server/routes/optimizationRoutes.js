// server/routes/optimizationRoutes.js
const express = require("express");
const router = express.Router();
const {
  getLeaveOptimization,
} = require("../controllers/optimizationController");

// Make sure the function is properly imported and defined
router.post("/leave", getLeaveOptimization);

module.exports = router;
