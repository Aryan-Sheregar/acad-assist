import axios from "axios";
import { promises as fs } from "fs";
import pdf from "pdf-parse";

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
    return response.data.items.map((item) => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  } catch (error) {
    throw new Error(
      "Failed to fetch YouTube recommendations: " + error.message
    );
  }
};

exports.getSyllabusRecommendations = async (syllabusPath) => {
  const dataBuffer = await fs.readFile(syllabusPath);
  const data = await pdf(dataBuffer);
  const text = data.text;
  const keywords = text.split("\n").slice(0, 5).join(" "); // Simple: Take first 5 lines as keywords
  const response = await axios.get(
    "https://www.googleapis.com/youtube/v3/search",
    {
      params: {
        part: "snippet",
        q: keywords,
        type: "video",
        maxResults: 5,
        key: process.env.YOUTUBE_API_KEY,
      },
    }
  );
  return response.data.items.map((item) => ({
    title: item.snippet.title,
    videoId: item.id.videoId,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }));
};
