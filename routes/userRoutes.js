const express = require("express");
const userController = require("../controllers/usersController");
const authController = require("../controllers/authController");

const router = express.Router();

router.route("/signup").post(authController.signUp);
router.route("/login").post(authController.signIn);

router
  .route("/")
  .get(authController.protectedRouteHandler, userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(
    authController.protectedRouteHandler,
    authController.restrictTo("admin", "lead-guide"),
    userController.deleteUser
  );

module.exports = router;
