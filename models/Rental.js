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
    startDate: {
      type: Date,
      required: true,
    },
    banAmount: {
      type: Number,
      required: true,
    },
    banPaid: {
      type: Number,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Rental", rentalSchema);
