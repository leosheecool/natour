const express = require("express");
const toursHandler = require("../controllers/toursController");

const router = express.Router();

router.route("/").get(toursHandler.getTours).post(toursHandler.createTour);

router
  .route("/:id")
  .get(toursHandler.getTour)
  .patch(toursHandler.updateTour)
  .delete(toursHandler.deleteTour);

module.exports = router;
