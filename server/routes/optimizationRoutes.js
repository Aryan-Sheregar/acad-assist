const express = require("express");

const {
  getLeaveOptimization,
  sendLeaveSuggestions,
} = require("../controllers/optimizationController");

const router = express.Router();

// Make sure the function is properly imported and defined
router.post("/leave", getLeaveOptimization);
router.post("/leave/email", sendLeaveSuggestions);

module.exports = router;
