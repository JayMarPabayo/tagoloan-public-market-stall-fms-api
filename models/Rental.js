const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    stall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stall",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Rental", rentalSchema);
