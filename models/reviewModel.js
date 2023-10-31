const mongoose = require("mongoose");
const Tour = require("./tourModel");

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

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo"
  });

  next();
});

reviewSchema.statics.calcAverageRating = async function (tourId) {
  const defaultAvgRating = 4.5;

  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: "$tour",
        nbRating: { $sum: 1 },
        avgRating: { $avg: "$rating" }
      }
    }
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0]?.avgRating ?? defaultAvgRating,
    ratingsQuantity: stats[0]?.nbRating ?? 0
  });
};

reviewSchema.post("save", function () {
  this.constructor.calcAverageRating(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.review = await this.clone().findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.review.constructor.calcAverageRating(this.review.tour);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
