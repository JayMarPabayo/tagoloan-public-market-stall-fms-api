const express = require("express");
const verifyJWT = require("../middleware/verifyJWT");
const {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
} = require("../controllers/vendorsController");

const router = express.Router();

router.use(verifyJWT);

router
  .route("/")
  .get(getVendors)
  .post(createVendor)
  .patch(updateVendor)
  .delete(deleteVendor);

module.exports = router;
