// server/controllers/optimizationController.js
const leaveOptimizationService = require("../services/leaveOptimizationService");

exports.getLeaveOptimization = async (req, res) => {
  try {
    // const { userId } = req.body; 

    // if (!userId) {
    //    return res.status(400).json({ error: "User ID is required" });
    // }
    const userId = req.body.userId || "default_user";

    const suggestions = await leaveOptimizationService.getLeaveOptimizations(
      userId
    );
    res.status(200).json({ suggestions });
  } catch (error) {
    console.error("Error in getLeaveOptimization:", error);
    res.status(500).json({ error: error.message });
  }
};
