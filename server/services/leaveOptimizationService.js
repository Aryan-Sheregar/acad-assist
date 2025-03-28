const fs = require("fs").promises;
const pdf = require("pdf-parse"); // Install: npm install pdf-parse

exports.optimizeLeaves = async (calendarPath) => {
  const dataBuffer = await fs.readFile(calendarPath);
  const data = await pdf(dataBuffer);
  const text = data.text;
  // Simple logic: Find "Holiday" or date patterns, suggest extensions
  const holidays = text.match(/Holiday.*\d{2}-\d{2}-\d{4}/g) || [];
  return holidays.map((h) => ({
    date: h,
    suggestion: "Extend with weekend if applicable",
  }));
};
