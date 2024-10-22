const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rental",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cost: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    orNumber: {
      type: String,
      required: true,
      unique: true,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
