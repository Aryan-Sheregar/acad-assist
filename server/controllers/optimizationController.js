const { optimizeLeaves } = require("../services/leaveOptimizationService");

exports.getLeaveOptimization = async (req, res) => {
  try {
    const { userId } = req.body;
    const calendar = await AcademicCalendar.findOne({ userId });
    if (!calendar) return res.status(404).json({ error: "Calendar not found" });
    const suggestions = await optimizeLeaves(calendar.calendarData);
    res.status(200).json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
