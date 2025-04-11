import express from "express";
import { getLeaveOptimization } from "../controllers/optimizationController.js";

const router = express.Router();

// Make sure the function is properly imported and defined
router.post("/leave", getLeaveOptimization);

module.exports = router;
