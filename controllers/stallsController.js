const asyncHandler = require("express-async-handler");

const Stall = require("../models/Stall");
const Section = require("../models/Section");
const Rental = require("../models/Rental");

const getStalls = asyncHandler(async (req, res) => {
  // Find all active rentals with endDate as null
  const activeRentals = await Rental.find({ endDate: null }).lean();

  // Create a set of stall IDs that are currently rented
  const rentedStallIds = new Set(
    activeRentals.map((rental) => rental.stall.toString())
  );

  // Retrieve all stalls and populate the section information
  const initialStalls = await Stall.find().populate("section").lean();

  if (!initialStalls?.length) {
    return res.status(400).json({ message: "No stalls found" });
  }

  // Add `available` property to each stall based on rental status
  const stalls = initialStalls.map((stall) => ({
    ...stall,
    available: !rentedStallIds.has(stall._id.toString()), // Set to true if not rented, false if rented
  }));

  res.json(stalls);
});
const createStall = asyncHandler(async (req, res) => {
  const { section, cost, notes } = req.body;

  if (!section || !cost) {
    return res
      .status(400)
      .json({ message: "Section and stall cost are required." });
  }

  const sectionData = await Section.findById(section).exec();
  if (!sectionData) {
    return res.status(400).json({ message: "Invalid section ID provided." });
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
      message: `New stall ${nextStallNumber} created in section ${sectionData.name}`,
    });
  } else {
    res.status(400).json({ message: "Invalid stall data received." });
  }
});

const updateStall = asyncHandler(async (req, res) => {
  const { id, number, cost, notes } = req.body;

  if (!id || !number || !cost) {
    return res
      .status(400)
      .json({ message: "Stall ID, cost, and number are required." });
  }

  const stall = await Stall.findById(id).exec();

  if (!stall) {
    return res.status(404).json({ message: "Stall not found" });
  }

  const existingStall = await Stall.findOne({
    number,
    section: stall.section,
    _id: { $ne: id },
  }).exec();

  if (existingStall) {
    return res.status(400).json({
      message: `Stall number ${number} already exists in this section.`,
    });
  }

  stall.number = number;
  stall.cost = cost;
  stall.notes = notes;

  const updatedStall = await stall.save();

  res.json({ message: `Stall ${updatedStall.number} successfully updated` });
});

const deleteStall = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Stall ID Required" });
  }

  const stall = await Stall.findById(id).exec();

  if (!stall) {
    return res.status(400).json({ message: "Stall not found" });
  }

  await Rental.deleteMany({ stall: stall._id });

  const deletedStall = await stall.deleteOne();

  const remainingStalls = await Stall.find({ section: stall.section }).lean();

  if (!remainingStalls.length) {
    await Section.findByIdAndDelete(stall.section);
  }

  res.json({ message: `Stall ${deletedStall.number} deleted successfully` });
});

const addStallToSection = asyncHandler(async (req, res) => {
  const { section } = req.body;

  if (!section) {
    return res.status(400).json({ message: "Section ID is required." });
  }

  // Check if the section exists
  const sectionData = await Section.findById(section).exec();
  if (!sectionData) {
    return res.status(400).json({ message: "Invalid section ID provided." });
  }

  // Find the highest stall number in the specified section
  const lastStall = await Stall.findOne({ section })
    .sort({ number: -1 })
    .lean();

  const nextStallNumber = lastStall ? lastStall.number + 1 : 1;

  // Find all sections with the same group
  const sectionsInSameGroup = await Section.find({
    group: sectionData.group,
  }).select("_id");

  // Find all stalls in those sections with number >= nextStallNumber
  const stallsToUpdate = await Stall.find({
    section: { $in: sectionsInSameGroup },
    number: { $gte: nextStallNumber },
  }).exec();

  // Increment the stall numbers of those stalls
  await Promise.all(
    stallsToUpdate.map(async (stall) => {
      stall.number += 1; // Increment the stall number
      await stall.save(); // Save the updated stall
    })
  );

  // Create the new stall with default cost and notes
  const newStall = {
    section,
    cost: 20,
    notes: "",
    number: nextStallNumber,
  };

  const stall = await Stall.create(newStall);

  if (stall) {
    res.status(201).json({
      message: `New stall ${nextStallNumber} created in section ${sectionData.name}`,
    });
  } else {
    res.status(400).json({ message: "Invalid stall data received." });
  }
});

module.exports = {
  getStalls,
  createStall,
  updateStall,
  deleteStall,
  addStallToSection,
};
