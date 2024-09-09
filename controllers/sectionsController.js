const asyncHandler = require("express-async-handler");

const Section = require("../models/Section");

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
  const { group, name } = req.body;

  if (!group || !name) {
    return res.status(400).json({
      message: "All fields are required.",
    });
  }

  const duplicate = await Section.findOne({
    name,
    group,
  })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({
      message: "Section already exists",
    });
  }

  const newSection = { name };

  const section = await Section.create(newSection);

  if (section) {
    res.status(201).json({
      message: `New section ${name} created`,
    });
  } else {
    res.status(400).json({
      message: "Invalid section data received.",
    });
  }
});

const updateSection = asyncHandler(async (req, res) => {
  const { group, name } = req.body;

  if (!id || !group || !name) {
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

  const duplicate = await Section.findOne({ name, group })
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

  const updatedSection = await section.save();

  res.json({
    message: `${updatedSection.name} successfully updated`,
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

  const deletedSection = await section.deleteOne();

  const response = `Name ${deletedSection.name} with ID ${deletedSection.i_id} deleted successfully`;

  res.json(response);
});

module.exports = {
  getSections,
  createSection,
  updateSection,
  deleteSection,
};
