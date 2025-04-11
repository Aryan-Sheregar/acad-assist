const {
  getRecommendations,
  getSyllabusRecommendations,
} = require("../services/recommendationService");
const Syllabus = require("../models/Syllabus");

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

exports.getSyllabusRecommendations = async (req, res) => {
  try {
    // const { userId } = req.body.userId || "default_user"; 
    // if (!userId) {
    //   return res.status(400).json({ error: "User ID is required" });
    // }

    const userId = req.body.userId || "default_user";
    
    const syllabus = await Syllabus.findOne({ userId });
    if (!syllabus) {
      return res
        .status(404)
        .json({ error: "Syllabus not found for this user" });
    }
    const recommendations = await getSyllabusRecommendations(
      syllabus.syllabusData
    );
    res.status(200).json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
