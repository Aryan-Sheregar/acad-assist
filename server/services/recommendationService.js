const axios = require("axios");

exports.getRecommendations = async (syllabusContent) => {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: syllabusContent,
          type: "video",
          maxResults: 5,
          key: process.env.YOUTUBE_API_KEY,
        },
      }
    );
    const videos = response.data.items.map((item) => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
    return videos;
  } catch (error) {
    throw new Error(
      "Failed to fetch YouTube recommendations: " + error.message
    );
  }
};
