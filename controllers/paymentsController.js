const asyncHandler = require("express-async-handler");

const Payment = require("../models/Payment");
const Rental = require("../models/Rental");
const User = require("../models/User");

// -- OR Number Generator
const generateOrNumber = () => {
  return Math.floor(1000000 + Math.random() * 9000000).toString();
};

// @desc Get all payments
// @route GET /payments
// @access Private
const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate("rental")
    .populate("user")
    .lean();

  if (!payments?.length) {
    return res.status(400).json({
      message: "No payments found",
    });
  }

  res.json(payments);
});

// @desc Create new payment
// @route POST /payments
// @access Private
const createPayment = asyncHandler(async (req, res) => {
  const { rental, user, cost, amount } = req.body;

  if (!rental || !user || !cost || !amount) {
    return res.status(400).json({
      message: "All fields are required.",
    });
  }

  // -- if rental exists
  const rentalExists = await Rental.findById(rental).lean().exec();
  if (!rentalExists) {
    return res.status(404).json({
      message: "Rental not found",
    });
  }

  // -- if user exists
  const userExists = await User.findById(user).lean().exec();
  if (!userExists) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  // -- existing payments for this rental
  const paymentCount = await Payment.countDocuments({ rental }).exec();

  // -- new starting date
  const newStartingDate = new Date(rentalExists.startDate);
  newStartingDate.setDate(newStartingDate.getDate() + paymentCount);

  // --number of payments to create
  const numPayments = Math.floor(amount / cost);

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
  const createdPayments = await Payment.insertMany(payments);

  if (createdPayments.length) {
    res.status(201).json({
      message: `${createdPayments.length} new payments created`,
      payments: createdPayments,
    });
  } else {
    res.status(400).json({
      message: "Failed to create payments.",
    });
  }
});

// @desc Update a payment
// @route PATCH /payments
// @access Private
const updatePayment = asyncHandler(async (req, res) => {
  const { id, rental, user, cost, amount } = req.body;

  if (!id || !rental || !user || !cost || !amount) {
    return res.status(400).json({
      message: "All fields are required.",
    });
  }

  const payment = await Payment.findById(id).exec();

  if (!payment) {
    return res.status(404).json({
      message: "Payment not found",
    });
  }

  // Check if rental exists
  const rentalExists = await Rental.findById(rental).lean().exec();
  if (!rentalExists) {
    return res.status(404).json({
      message: "Rental not found",
    });
  }

  // Check if user exists
  const userExists = await User.findById(user).lean().exec();
  if (!userExists) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  payment.rental = rental;
  payment.user = user;
  payment.cost = cost;
  payment.amount = amount;

  const updatedPayment = await payment.save();

  res.json({
    message: `Payment successfully updated`,
  });
});

// @desc Delete a payment
// @route DELETE /payments
// @access Private
const deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      message: "Payment ID Required",
    });
  }

  const payment = await Payment.findById(id).exec();

  if (!payment) {
    return res.status(404).json({
      message: "Payment not found",
    });
  }

  const deletedPayment = await payment.deleteOne();

  const response = `Payment with ID ${deletedPayment._id} deleted successfully`;

  res.json(response);
});

module.exports = {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
};
