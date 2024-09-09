const express = require("express");
const verifyJWT = require("../middleware/verifyJWT");
const {
  getSections,
  createSection,
  updateSection,
  deleteSection,
} = require("../controllers/sectionsController");

const router = express.Router();

router.use(verifyJWT);

router
  .route("/")
  .get(getSections)
  .post(createSection)
  .patch(updateSection)
  .delete(deleteSection);

module.exports = router;
