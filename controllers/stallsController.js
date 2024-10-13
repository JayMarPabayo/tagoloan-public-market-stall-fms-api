const asyncHandler = require("express-async-handler");

const Stall = require("../models/Stall");
const Section = require("../models/Section");

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

  const sectionData = await Section.findById(section).exec();
  if (!sectionData) {
    return res.status(400).json({
      message: "Invalid section ID provided.",
    });
  }

  const group = sectionData.group;

  const lastStall = await Stall.findOne({
    section: { $in: await Section.find({ group }).select("_id") },
  })
    .sort({ number: -1 })
    .lean();

  const nextStallNumber = lastStall ? lastStall.number + 1 : 1;

  const newStall = { section, cost, notes, number: nextStallNumber };

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
  const { id, number, cost, notes } = req.body;

  if (!id || !number || !cost) {
    return res.status(400).json({
      message: "Stall cost & number are required.",
    });
  }

  const stall = await Stall.findById(id).exec();

  if (!stall) {
    return res.status(404).json({
      message: "Stall not found",
    });
  }

  const existingStall = await Stall.findOne({
    number,
    section: stall.section,
    _id: { $ne: id },
  }).exec();

  if (existingStall) {
    return res.status(400).json({
      message: `Stall number ${number} already exists.`,
    });
  }

  stall.number = number;
  stall.cost = cost;
  stall.notes = notes;

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

  // Check if the section has any other stalls
  const remainingStalls = await Stall.find({ section: stall.section }).lean();

  // If no more stalls are found, delete the section
  if (!remainingStalls.length) {
    await Section.findByIdAndDelete(stall.section).exec();
  }

  const response = `Stall ${deletedStall.number} deleted successfully`;

  res.json(response);
});

module.exports = {
  getStalls,
  createStall,
  updateStall,
  deleteStall,
};
