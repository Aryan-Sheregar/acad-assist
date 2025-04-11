const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables from root .env (adjust path only if running locally)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Debug logs
console.log("PORT:", process.env.PORT);
console.log("MONGO_URI:", process.env.MONGO_URI);

const userRoutes = require("./routes/userRoutes");
const fileRoutes = require("./routes/fileRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const optimizationRoutes = require("./routes/optimizationRoutes");

const app = express();

// CORS middleware
app.use(cors());
app.use(express.json());

// MongoDB Atlas connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// API routes
// app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/optimization", optimizationRoutes);

// Serve React frontend in production
app.use(express.static(path.join(__dirname, "../client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
