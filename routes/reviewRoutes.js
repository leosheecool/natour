const express = require("express");
const reviewController = require("../controllers/reviewsController");
const authController = require("../controllers/authController");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.protectedRouteHandler,
    authController.restrictTo("user"),
    reviewController.setIds,
    reviewController.createReview
  );

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(authController.protectedRouteHandler, reviewController.updateReview)
  .delete(authController.protectedRouteHandler, reviewController.deleteReview);

module.exports = router;
