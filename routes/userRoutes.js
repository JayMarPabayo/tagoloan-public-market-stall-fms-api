const express = require("express");
const verifyJWT = require("../middleware/verifyJWT");

const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/usersController");

const router = express.Router();

router.use(verifyJWT);

router
  .route("/")
  .get(getUsers)
  .post(createUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
