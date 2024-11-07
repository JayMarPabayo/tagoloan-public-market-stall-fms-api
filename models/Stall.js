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
    banDeposit: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Stall", stallSchema);
