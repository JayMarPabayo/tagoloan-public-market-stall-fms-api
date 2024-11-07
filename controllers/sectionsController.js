const asyncHandler = require("express-async-handler");

const Section = require("../models/Section");
const Stall = require("../models/Stall");

const getSections = asyncHandler(async (req, res) => {
  const sections = await Section.find().lean();

  if (!sections?.length) {
    return res.status(400).json({
      message: "No sections found",
    });
  }

  res.json(sections);
});

const createSection = asyncHandler(async (req, res) => {
  const {
    group,
    name,
    stallsPerRow,
    numberOfStalls,
    cost = 20,
    banDeposit,
  } = req.body;

  if (!group || !name || !stallsPerRow || !numberOfStalls || !banDeposit) {
    return res.status(400).json({
      message: "All fields are required.",
    });
  }

  const duplicate = await Section.findOne({
    group,
    name,
  })
    .collation({ locale: "en", strength: 2 })
    .lean();

  if (duplicate) {
    return res.status(409).json({
      message: "Section already exists",
    });
  }

  const newSection = { name, group, stallsPerRow };

  const section = await Section.create(newSection);

  if (section) {
    const lastStall = await Stall.findOne({
      section: { $in: await Section.find({ group }).select("_id") },
    })
      .sort({ number: -1 })
      .lean();

    const startNumber = lastStall ? lastStall.number + 1 : 1;

    const stalls = [];
    for (let i = 0; i < numberOfStalls; i++) {
      stalls.push({
        section: section._id,
        cost: cost,
        banDeposit: banDeposit,
        notes: "",
        number: startNumber + i,
      });
    }
    await Stall.insertMany(stalls);

    res.status(201).json({
      message: `${section.group} ${section.name} with stalls created`,
    });
  } else {
    res.status(400).json({
      message: "Invalid section data received.",
    });
  }
});

const updateSection = asyncHandler(async (req, res) => {
  const { id, group, name, stallsPerRow } = req.body;

  if (!id || !group || !name || !stallsPerRow) {
    return res.status(400).json({
      message: "All fields are required.",
    });
  }

  const section = await Section.findById(id).exec();

  if (!section) {
    res.status(400).json({
      message: "Section not found",
    });
  }

  const duplicate = await Section.findOne({ name, group, stallsPerRow })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({
      message: "Section already exists",
    });
  }

  section.group = group;
  section.name = name;
  section.stallsPerRow = stallsPerRow;

  const updatedSection = await section.save();

  res.json({
    message: `${updatedSection.group} ${updatedSection.name} successfully updated`,
  });
});

const deleteSection = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      message: "Section ID Required",
    });
  }

  const section = await Section.findById(id).exec();

  if (!section) {
    return res.status(400).json({
      message: "Section not found",
    });
  }

  await Stall.deleteMany({ section: id });

  const deletedSection = await section.deleteOne();

  const response = `Name ${deletedSection.name} with ID ${deletedSection._id} deleted successfully`;

  res.json(response);
});

module.exports = {
  getSections,
  createSection,
  updateSection,
  deleteSection,
};
