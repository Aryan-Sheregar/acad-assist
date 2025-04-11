const express = require("express");
const {
  getLeaveOptimization,
} = require("../controllers/optimizationController");

const router = express.Router();

// Make sure the function is properly imported and defined
router.post("/leave", getLeaveOptimization);

module.exports = router;
