const asyncHandler = require("express-async-handler");

const Stall = require("../models/Stall");

const getStalls = asyncHandler(async (req, res) => {
  const stalls = await Stall.find().lean();

  if (!stalls?.length) {
    return res.status(400).json({
      message: "No stalls found",
    });
  }

  res.json(stalls);
});

const createStall = asyncHandler(async (req, res) => {
  const { section, cost, notes } = req.body;

  if (!section || !cost) {
    return res.status(400).json({
      message: "Stall cost is required.",
    });
  }

  const newStall = { section, cost, notes };

  const stall = await Stall.create(newStall);

  if (stall) {
    res.status(201).json({
      message: `New stall created`,
    });
  } else {
    res.status(400).json({
      message: "Invalid stall data received.",
    });
  }
});

const updateStall = asyncHandler(async (req, res) => {
  const { cost, notes } = req.body;

  if (!id || !cost) {
    return res.status(400).json({
      message: "Stall cost is required.",
    });
  }

  const stall = await Stall.findById(id).exec();

  if (!stall) {
    res.status(400).json({
      message: "Stall not found",
    });
  }

  stall.cost = cost;

  const updatedStall = await stall.save();

  res.json({
    message: `Stall ${updatedStall.number} successfully updated`,
  });
});

const deleteStall = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      message: "Stall ID Required",
    });
  }

  const stall = await Stall.findById(id).exec();

  if (!stall) {
    return res.status(400).json({
      message: "Stall not found",
    });
  }

  const deletedStall = await stall.deleteOne();

  const response = `Stall ${deletedStall.number} deleted successfully`;

  res.json(response);
});

module.exports = {
  getStalls,
  createStall,
  updateStall,
  deleteStall,
};
