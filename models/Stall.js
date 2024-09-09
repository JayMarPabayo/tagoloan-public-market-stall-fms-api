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

stallSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const lastStall = await mongoose
      .model("Stall")
      .findOne({ section: this.section })
      .sort({ number: -1 });

    this.number = lastStall ? lastStall.number + 1 : 1;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Stall", stallSchema);
