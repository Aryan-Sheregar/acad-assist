// server/controllers/optimizationController.js
const leaveOptimizationService = require("../services/leaveOptimizationService");
const { sendLeaveSuggestionsEmail } = require("../services/emailService");

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

// 🚀 New export feature: Send leave suggestions to user's email
exports.sendLeaveSuggestions = async (req, res) => {
  try {
    const { userId, email } = req.body;

    // Validate inputs
    if (!userId || !email) {
      return res.status(400).json({ error: "userId and email are required" });
    }

    const suggestions = await leaveOptimizationService.getLeaveOptimizations(
      userId
    );

    await sendLeaveSuggestionsEmail(email, suggestions);

    res.status(200).json({ message: "Suggestions sent successfully!" });
  } catch (error) {
    console.error("Error in sendLeaveSuggestions:", error);
    res.status(500).json({ error: "Failed to send suggestions" });
  }
};
