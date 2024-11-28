const asyncHandler = require("express-async-handler");

const Rental = require("../models/Rental");
const Vendor = require("../models/Vendor");
const Stall = require("../models/Stall");
const Payment = require("../models/Payment");
const User = require("../models/User");

const generateOrNumber = () => {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
};

const getRentals = asyncHandler(async (req, res) => {
  // Fetch all rentals with related vendor and stall data
  const rentals = await Rental.find()
    .populate("vendor")
    .populate({
      path: "stall",
      populate: {
        path: "section",
      },
    })
    .sort({ updatedAt: -1 })
    .lean();

  if (!rentals?.length) {
    return res.status(400).json({
      message: "No rentals found",
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let rental of rentals) {
    const payments = await Payment.find({ rental: rental._id }).lean();

    let daysPaid = payments.reduce((total, payment) => {
      return total + payment.amount / payment.cost;
    }, 0);

    let dueDate = new Date(rental.startDate);
    dueDate.setDate(dueDate.getDate() + Math.floor(daysPaid));

    rental.daysPaid = daysPaid;
    rental.dueDate = dueDate;
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

  const newRental = {
    vendor,
    stall,
    startDate,
    banAmount: stallExists.banDeposit,
    banPaid: stallExists.banDeposit,
  };

  const rental = await Rental.create(newRental);

  if (rental) {
    // await Stall.findByIdAndUpdate(stall, { available: false });

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

const vacateRental = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      message: "Rental ID is required",
    });
  }

  const rental = await Rental.findById(id).exec();

  if (!rental) {
    return res.status(404).json({
      message: "Rental not found",
    });
  }

  rental.endDate = Date.now();
  await rental.save();

  res.json({
    message: `Rental vacated successfully. Stall ${rental.stall} is now available.`,
  });
});

const payBanDeposit = asyncHandler(async (req, res) => {
  const { id, amount } = req.body;

  const parsedAmount = parseFloat(amount);

  if (!id || isNaN(parsedAmount)) {
    return res.status(400).json({
      message: "Rental ID and valid amount are required",
    });
  }
  const rental = await Rental.findById(id).exec();

  if (!rental) {
    return res.status(404).json({
      message: "Rental not found",
    });
  }

  const remainingBalance = rental.banAmount - rental.banPaid;
  if (parsedAmount > remainingBalance) {
    return res.status(400).json({
      message: `Amount exceeds the remaining balance of ${remainingBalance}`,
    });
  }

  rental.banPaid += parsedAmount;
  await rental.save();

  res.json({
    message: `Ban deposit of ${parsedAmount} added successfully. Total paid: ${
      rental.banPaid
    }. Remaining balance: ${rental.banAmount - rental.banPaid}`,
  });
});

const compensateBanDeposit = asyncHandler(async (req, res) => {
  const { id, amount, user, cost } = req.body;

  const parsedAmount = parseFloat(amount);

  if (!id || isNaN(parsedAmount)) {
    return res.status(400).json({
      message: "Rental ID and valid amount are required",
    });
  }
  const rental = await Rental.findById(id).exec();

  if (!rental) {
    return res.status(404).json({
      message: "Rental not found",
    });
  }

  const userExists = await User.findById(user).lean().exec();
  if (!userExists) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  const remainingBanPaid = rental.banPaid - parsedAmount;

  if (remainingBanPaid < 0) {
    return res.status(400).json({
      message: `Insufficient ban deposit paid. Available balance is ${rental.banPaid}.`,
    });
  }

  rental.banPaid = remainingBanPaid;
  await rental.save();

  // -- existing payments for this rental
  const paymentCount = await Payment.countDocuments({ rental }).exec();

  // -- new starting date
  const newStartingDate = new Date(rental.startDate);
  newStartingDate.setDate(newStartingDate.getDate() + paymentCount);

  // --number of payments to create
  const numPayments = Math.floor(parsedAmount / cost);

  // Generate a unique 7-digit OR number
  const orNumber = generateOrNumber();

  const payments = [];
  for (let i = 0; i < numPayments; i++) {
    const paymentDate = new Date(newStartingDate);
    paymentDate.setDate(paymentDate.getDate() + i);

    const newPayment = {
      rental,
      user,
      cost,
      amount: cost,
      date: paymentDate,
      orNumber,
    };

    payments.push(newPayment);
  }

  // -- Create all payments at once
  await Payment.insertMany(payments);

  res.json({
    message: `Due amount of ${parsedAmount} has been paid successfully. Total paid: ${rental.banAmount}. Remaining balance paid: ${remainingBanPaid}`,
  });
});

module.exports = {
  getRentals,
  createRental,
  updateRental,
  deleteRental,
  vacateRental,
  payBanDeposit,
  compensateBanDeposit,
};
