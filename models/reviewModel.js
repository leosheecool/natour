const express = require("express");
const mongoose = require("mongoose");

const MIN_RATING = 1;
const MAX_RATING = 5;

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review cannot be empty"]
    },
    rating: {
      type: Number,
      required: [true, "Rating is mandatory"],
      min: [
        MIN_RATING,
        `The minimum rate should be equals or above ${MIN_RATING}`
      ],
      max: [
        MAX_RATING,
        `The minimum rate should be equals or lower ${MAX_RATING}`
      ]
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"]
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"]
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo"
  });

  // this.populate({
  //   path: "tour",
  //   select: "name"
  // });

  next();
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
