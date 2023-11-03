const express = require("express");
const userController = require("../controllers/usersController");
const authController = require("../controllers/authController");
const router = express.Router();

router.route("/signup").post(authController.signUp);
router.route("/login").post(authController.signIn);
router.route("/forgot-password").post(authController.forgotPassword);
router.patch("/reset-password").post(authController.resetPassword);

router.use(authController.protectedRouteHandler);

router.route("/me").get(userController.getMe, userController.getUser);

router.route("/update-password").patch(authController.updatePassword);
router
  .route("/update-me")
  .patch(
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
  );
router.route("/desactivate-me").patch(userController.desactivateMe);

router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
