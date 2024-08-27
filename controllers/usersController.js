const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

const User = require("../models/User");

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").lean();

  if (!users?.length) {
    return res.status(400).json({
      message: "No users found",
    });
  }

  res.json(users);
});

const createUser = asyncHandler(async (req, res) => {
  const { fullname, username, password, role } = req.body;

  if (!fullname || !username || !password) {
    return res.status(400).json({
      message: "All fields are required.",
    });
  }

  const duplicate = await User.findOne({
    username,
  })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({
      message: "Username already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = !role
    ? { fullname, username, password: hashedPassword }
    : { fullname, username, password: hashedPassword, role };

  const user = await User.create(newUser);

  if (user) {
    res.status(201).json({
      message: `New user ${username} created`,
    });
  } else {
    res.status(400).json({
      message: "Invalid user data received.",
    });
  }
});

const updateUser = asyncHandler(async (req, res) => {
  const { fullname, id, username, password, role, active } = req.body;

  if (!fullname || !id || !username || typeof active !== "boolean") {
    return res.status(400).json({
      message: "All fields are required.",
    });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    res.status(400).json({
      message: "User not found",
    });
  }

  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({
      message: "Username already exists",
    });
  }

  user.fullname = fullname;
  user.username = username;
  if (!!role) user.role = role;
  user.active = active;

  if (password) {
    user.password = await bcrypt.hash(password, 10);
  }

  const updatedUser = await user.save();

  res.json({
    message: `${updatedUser.username} successfully updated`,
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      message: "User ID Required",
    });
  }

  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({
      message: "User not found",
    });
  }

  const deletedUser = await user.deleteOne();

  const response = `Username ${deletedUser.username} with ID ${deletedUser.i_id} deleted successfully`;

  res.json(response);
});

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
