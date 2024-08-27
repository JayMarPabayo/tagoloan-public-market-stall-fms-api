const mongoose = require("mongoose");

const stallSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    size: {
      type: String,
    },
    cost: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Stall", stallSchema);
