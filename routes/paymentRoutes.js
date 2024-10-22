const express = require("express");
const verifyJWT = require("../middleware/verifyJWT");
const {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
} = require("../controllers/paymentsController");

const router = express.Router();

router.use(verifyJWT);

router
  .route("/")
  .get(getPayments)
  .post(createPayment)
  .patch(updatePayment)
  .delete(deletePayment);

module.exports = router;
