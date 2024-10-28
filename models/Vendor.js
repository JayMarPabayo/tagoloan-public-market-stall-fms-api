const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    type: {
      type: String,
    },
    address: {
      type: String,
    },
    contact: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

vendorSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    await Rental.deleteMany({ vendor: this._id });
    next();
  }
);

module.exports = mongoose.model("Vendor", vendorSchema);
