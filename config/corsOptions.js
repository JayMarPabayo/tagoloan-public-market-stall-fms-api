const allowedOrigins = require("./allowedOrigins");

const corsOptions = {
  origin: "https://tagoloanpublicmarketstallfms.onrender.com",
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
