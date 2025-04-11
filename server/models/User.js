import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  email: { type: String, required: true, unique: true },
});

module.exports = mongoose.model("User", userSchema);
