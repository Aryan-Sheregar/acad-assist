const express = require("express");
const {
  getLeaveOptimization,
} = require("../controllers/optimizationController");
const router = express.Router();

router.post("/leave", getLeaveOptimization);

module.exports = router;
