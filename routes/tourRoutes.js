const express = require("express");
const toursHandler = require("../controllers/toursController");
const reviewRouter = require("../routes/reviewRoutes");
const authController = require("../controllers/authController");
const ADMIN_ROLE = "admin";
const TOUR_GUIDE_ROLE = "tour-guide";

const router = express.Router();

router.use("/:tourId/reviews", reviewRouter);

router
  .route("/top-5-cheap")
  .get(toursHandler.aliasTopTours, toursHandler.getTours);

router.route("/stats").get(toursHandler.getTourStats);
router
  .route("/monthly-plan/:year")
  .get(
    authController.protectedRouteHandler,
    authController.restrictTo(ADMIN_ROLE, TOUR_GUIDE_ROLE),
    toursHandler.getMonthlyPlan
  );

router
  .route("/tour-within/:distance/center/:latlng/unit/:unit")
  .get(toursHandler.getTourWithin);

router
  .route("/distances/:latlng/unit/:unit")
  .get(toursHandler.getToursDistances);

router
  .route("/")
  .get(toursHandler.getTours)
  .post(
    authController.protectedRouteHandler,
    authController.restrictTo(ADMIN_ROLE, TOUR_GUIDE_ROLE),
    toursHandler.createTour
  );

router
  .route("/:id")
  .get(toursHandler.getTour)
  .patch(
    authController.protectedRouteHandler,
    authController.restrictTo(ADMIN_ROLE, TOUR_GUIDE_ROLE),
    toursHandler.updateTour
  )
  .delete(
    authController.protectedRouteHandler,
    authController.restrictTo(ADMIN_ROLE, TOUR_GUIDE_ROLE),
    toursHandler.deleteTour
  );

module.exports = router;
