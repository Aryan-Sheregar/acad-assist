// server/routes/optimizationRoutes.js
const express = require("express");
const {
  getLeaveOptimizations, // Change from getLeaveOptimization to getLeaveOptimizations
} = require("../controllers/optimizationController");
const router = express.Router();

router.post("/leave", getLeaveOptimizations); // Update to match the imported name

module.exports = router;
