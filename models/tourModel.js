const mongoose = require("mongoose");

const slugify = require("slugify");

const toursSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tour must have a name"],
      unique: [true, "Duplicate key"],
      trim: true
    },
    duration: {
      type: Number,
      required: [true, "Tour must have a duration"]
    },
    maxGroupSize: {
      type: Number,
      required: [true, "Tour must have a group size"]
    },
    difficulty: {
      type: String,
      required: [true, "Tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty must be either easy, medium or difficult"
      }
    },
    description: {
      type: String,
      trim: true,
      required: true
    },
    imageCover: {
      type: String,
      required: [true, "Tour must have a cover image"]
    },
    images: {
      type: [String]
    },
    ratingsAverage: {
      type: Number,
      default: 0
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, "Tour must have a price"]
    },
    priceDiscount: {
      type: Number
    },
    summary: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

toursSchema.virtual("durationWeeks").get(function () {
  const WEEK_DURATION = 7;
  return this.duration / WEEK_DURATION;
});

toursSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

toursSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

toursSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model("Tour", toursSchema);

module.exports = Tour;
