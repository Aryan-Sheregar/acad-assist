import express from "express";
import { addUser, removeUser } from "../controllers/userController.js";

const router = express.Router();
// router.post("/add", addUser);
// router.delete("/:userId", removeUser);

module.exports = router;
