const { getRecommendations } = require("../services/recommendationService");

exports.requestRecommendations = async (req, res) => {
  try {
    const { syllabusContent } = req.body;
    if (!syllabusContent) {
      return res.status(400).json({ error: "Syllabus content is required" });
    }
    const recommendations = await getRecommendations(syllabusContent);
    res.status(200).json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
