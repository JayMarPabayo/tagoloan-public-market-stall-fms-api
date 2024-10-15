const asyncHandler = require("express-async-handler");

const Rental = require("../models/Rental");
const Vendor = require("../models/Vendor");
const Stall = require("../models/Stall");

const getRentals = asyncHandler(async (req, res) => {
  const rentals = await Rental.find()
    .populate("vendor")
    .populate("stall")
    .lean();

  if (!rentals?.length) {
    return res.status(400).json({
      message: "No rentals found",
    });
  }

  res.json(rentals);
});

const createRental = asyncHandler(async (req, res) => {
  const { vendor, stall, startDate } = req.body;

  if (!vendor || !stall || !startDate) {
    return res.status(400).json({
      message: "All fields are required.",
    });
  }

  // Check if vendor exists
  const vendorExists = await Vendor.findById(vendor).lean().exec();
  if (!vendorExists) {
    return res.status(404).json({
      message: "Vendor not found",
    });
  }

  // Check if stall exists
  const stallExists = await Stall.findById(stall).lean().exec();
  if (!stallExists) {
    return res.status(404).json({
      message: "Stall not found",
    });
  }

  const newRental = { vendor, stall, startDate };

  const rental = await Rental.create(newRental);

  if (rental) {
    await Stall.findByIdAndUpdate(stall, { available: false });

    res.status(201).json({
      message: "New rental created",
    });
  } else {
    res.status(400).json({
      message: "Invalid rental data received.",
    });
  }
});

const updateRental = asyncHandler(async (req, res) => {
  const { id, vendor, stall, startDate } = req.body;

  if (!id || !vendor || !stall || !startDate) {
    return res.status(400).json({
      message: "All fields are required.",
    });
  }

  const rental = await Rental.findById(id).exec();

  if (!rental) {
    return res.status(400).json({
      message: "Rental not found",
    });
  }

  // Check if vendor exists
  const vendorExists = await Vendor.findById(vendor).lean().exec();
  if (!vendorExists) {
    return res.status(404).json({
      message: "Vendor not found",
    });
  }

  // Check if stall exists
  const stallExists = await Stall.findById(stall).lean().exec();
  if (!stallExists) {
    return res.status(404).json({
      message: "Stall not found",
    });
  }

  rental.vendor = vendor;
  rental.stall = stall;
  rental.startDate = startDate;

  const updatedRental = await rental.save();

  res.json({
    message: `Rental successfully updated`,
  });
});

const deleteRental = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      message: "Rental ID Required",
    });
  }

  const rental = await Rental.findById(id).exec();

  if (!rental) {
    return res.status(400).json({
      message: "Rental not found",
    });
  }

  const deletedRental = await rental.deleteOne();

  const response = `Rental with ID ${deletedRental._id} deleted successfully`;

  res.json(response);
});

module.exports = {
  getRentals,
  createRental,
  updateRental,
  deleteRental,
};
