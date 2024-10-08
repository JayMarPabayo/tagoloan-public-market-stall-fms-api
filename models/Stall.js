const mongoose = require("mongoose");

const stallSchema = new mongoose.Schema(
  {
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    number: {
      type: Number,
      required: true,
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
