const leaveOptimizationService = require("../services/leaveOptimizationService.js");

exports.getLeaveOptimizations = async (req, res) => {
  try {
    const userId = req.params.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const optimizations = await leaveOptimizationService.getLeaveOptimizations(
      userId
    );

    res.status(200).json({
      message: "Leave optimizations calculated successfully",
      optimizations,
    });
  } catch (error) {
    console.error("Error in getLeaveOptimizations:", error);
    res.status(500).json({ error: error.message });
  }
};
