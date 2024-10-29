const express = require("express");
const verifyJWT = require("../middleware/verifyJWT");
const {
  getStalls,
  createStall,
  updateStall,
  deleteStall,
  addStallToSection,
} = require("../controllers/stallsController");

const router = express.Router();

router.use(verifyJWT);

router
  .route("/")
  .get(getStalls)
  .post(createStall)
  .patch(updateStall)
  .delete(deleteStall);

router.post("/add-to-section", addStallToSection);

module.exports = router;
