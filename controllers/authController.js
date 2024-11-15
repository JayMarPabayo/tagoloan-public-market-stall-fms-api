const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

// @desc Login
// @route POST /auth
// @access Public
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const foundUser = await User.findOne({ username }).exec();

  if (!foundUser || !foundUser.active) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const match = await bcrypt.compare(password, foundUser.password);

  if (!match) return res.status(401).json({ message: "Unauthorized" });

  const accessToken = jwt.sign(
    {
      UserInfo: {
        id: foundUser.id,
        fullname: foundUser.fullname,
        username: foundUser.username,
        role: foundUser.role,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { username: foundUser.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // Create secure cookie with refresh token
  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: false, //https
    sameSite: "lax", //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
  });

  // Send accessToken containing username and role
  res.json({
    accessToken,
    user: {
      id: foundUser.id,
      fullname: foundUser.fullname,
      username: foundUser.username,
      role: foundUser.role,
    },
  });
});

const updateAccount = asyncHandler(async (req, res) => {
  const { fullname, id, username, password, newPassword } = req.body;

  if (!fullname || !id || !username) {
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

  if (newPassword) {
    const match = await bcrypt.compare(password, user.password);

    if (!password) {
      return res.status(403).json({
        message: "Current password is required.",
      });
    }
    if (!match) {
      return res.status(403).json({
        message: "Current password is incorrect.",
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        message: "Password can't be blank.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
  }

  user.fullname = fullname;
  user.username = username;

  await user.save();

  // Send accessToken containing username and role
  res.json({
    message: `Account successfully updated`,
    user: {
      id: user.id,
      fullname: user.fullname,
      username: user.username,
      role: user.role,
    },
  });
});

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    asyncHandler(async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({
        username: decoded.username,
      }).exec();

      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

      const accessToken = jwt.sign(
        {
          UserInfo: {
            id: foundUser.id,
            fullname: foundUser.fullname,
            username: foundUser.username,
            role: foundUser.role,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      res.json({ accessToken });
    })
  );
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ message: "Cookie cleared" });
};

module.exports = {
  login,
  refresh,
  logout,
  updateAccount,
};
