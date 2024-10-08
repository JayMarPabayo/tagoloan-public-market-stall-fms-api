const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    group: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    stallsPerRow: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Section", sectionSchema);
