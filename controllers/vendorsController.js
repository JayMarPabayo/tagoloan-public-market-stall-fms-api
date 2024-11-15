const asyncHandler = require("express-async-handler");

const Vendor = require("../models/Vendor");
const Rental = require("../models/Rental");

const getVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.aggregate([
    {
      $lookup: {
        from: "rentals",
        localField: "_id",
        foreignField: "vendor",
        as: "rentals",
      },
    },
    {
      $addFields: {
        hasRental: { $gt: [{ $size: "$rentals" }, 0] },
      },
    },
    {
      $project: {
        rentals: 0,
      },
    },
  ]);

  if (!vendors?.length) {
    return res.status(400).json({
      message: "No vendors found",
    });
  }

  res.json(vendors);
});

const createVendor = asyncHandler(async (req, res) => {
  const { name, birthdate, owner, address, contact } = req.body;

  if (!name || !birthdate || !owner || !address || !contact) {
    return res.status(400).json({
      message: "All fields are required.",
    });
  }

  const duplicate = await Vendor.findOne({
    name,
  })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({
      message: "Vendor already exists",
    });
  }

  // -- Check if the vendor is at least 18 years old
  const birthDate = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  const dayDifference = today.getDate() - birthDate.getDate();

  const isUnder18 =
    age < 18 ||
    (age === 18 &&
      (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)));

  if (isUnder18) {
    return res.status(400).json({
      message: "Vendor must be at least 18 years old.",
    });
  }

  const newVendor = {
    name,
    birthdate,
    owner,
    address,
    contact,
  };

  const vendor = await Vendor.create(newVendor);

  if (vendor) {
    res.status(201).json({
      message: `New vendor ${name} created`,
    });
  } else {
    res.status(400).json({
      message: "Invalid vendor data received.",
    });
  }
});

const updateVendor = asyncHandler(async (req, res) => {
  const { id, name, birthdate, owner, address, contact } = req.body;

  if (!id || !name || !birthdate || !owner || !address || !contact) {
    return res.status(400).json({
      message: "All fields are required.",
    });
  }

  const vendor = await Vendor.findById(id).exec();

  if (!vendor) {
    res.status(400).json({
      message: "Vendor not found",
    });
  }

  const duplicate = await Vendor.findOne({ name })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec();

  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({
      message: "Vendor already exists",
    });
  }

  // -- Check if the vendor is at least 18 years old
  const birthDate = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  const dayDifference = today.getDate() - birthDate.getDate();

  const isUnder18 =
    age < 18 ||
    (age === 18 &&
      (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)));

  if (isUnder18) {
    return res.status(400).json({
      message: "Vendor must be at least 18 years old.",
    });
  }

  vendor.name = name;
  vendor.birthdate = birthdate;
  vendor.owner = owner;
  vendor.address = address;
  vendor.contact = contact;

  const updatedVendor = await vendor.save();

  res.json({
    message: `${updatedVendor.name} successfully updated`,
  });
});

const deleteVendor = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      message: "Vendor ID Required",
    });
  }

  const vendor = await Vendor.findById(id).exec();

  if (!vendor) {
    return res.status(400).json({
      message: "Vendor not found",
    });
  }

  await Rental.deleteMany({ vendor: vendor._id }).exec();

  const deletedVendor = await vendor.deleteOne();

  const response = `Name ${deletedVendor.name} with ID ${deletedVendor.i_id} deleted successfully`;

  res.json(response);
});

module.exports = {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
};
