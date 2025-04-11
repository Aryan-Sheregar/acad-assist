import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import optimizationRoutes from "./routes/optimizationRoutes.js";

// Debug environment variables
console.log("PORT:", process.env.PORT);
console.log("MONGO_URI:", process.env.MONGO_URI);

const app = express();

// CORS configuration (restrict to frontend in production if needed)
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// MongoDB connection without deprecated options
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
// app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/optimization", optimizationRoutes);

// Default port fallback
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
