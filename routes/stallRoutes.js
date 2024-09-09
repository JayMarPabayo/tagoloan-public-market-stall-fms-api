const express = require("express");
const verifyJWT = require("../middleware/verifyJWT");
const {
  getStalls,
  createStall,
  updateStall,
  deleteStall,
} = require("../controllers/stallsController");

const router = express.Router();

router.use(verifyJWT);

router
  .route("/")
  .get(getStalls)
  .post(createStall)
  .patch(updateStall)
  .delete(deleteStall);

module.exports = router;
