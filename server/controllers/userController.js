import User from "../models/User.js";

exports.addUser = async (req, res) => {
  try {
    const { userId, name, email } = req.body;
    const user = new User({ userId, name, email });
    await user.save();
    res.status(201).json({ message: "User added", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findOneAndDelete({ userId });
    res.status(200).json({ message: "User removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
