const express = require("express");
const verifyJWT = require("../middleware/verifyJWT");
const {
  getRentals,
  createRental,
  updateRental,
  deleteRental,
  vacateRental,
  payBanDeposit,
  compensateBanDeposit,
} = require("../controllers/rentalsController");

const router = express.Router();

router.use(verifyJWT);

router
  .route("/")
  .get(getRentals)
  .post(createRental)
  .patch(updateRental)
  .delete(deleteRental);

router.post("/vacate", vacateRental);
router.post("/pay-ban-deposit", payBanDeposit);
router.post("/compensate-ban-deposit", compensateBanDeposit);

module.exports = router;
