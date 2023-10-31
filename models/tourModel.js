const mongoose = require("mongoose");
const slugify = require("slugify");

const TITLE_MIN_LENGTH = 10;
const TITLE_MAX_LENGTH = 50;
const MIN_RATING = 1;
const MAX_RATING = 5;

const toursSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tour must have a name"],
      unique: [true, "Duplicate key"],
      trim: true,
      maxlength: [
        TITLE_MAX_LENGTH,
        `The tour title can't have more than ${TITLE_MAX_LENGTH} characters`
      ],
      minlength: [
        TITLE_MIN_LENGTH,
        `The tour title can't have less than ${TITLE_MIN_LENGTH} characters`
      ]
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
      default: 0,
      max: [
        MAX_RATING,
        `The maximum average rating must be less than or equals to ${MAX_RATING}`
      ],
      min: [
        MIN_RATING,
        `The minimum average rating must be great than or equals to ${MIN_RATING}`
      ]
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
    },
    startLocation: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"]
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"]
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User"
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

toursSchema.index({ price: 1, ratingsAverage: -1 });
toursSchema.index({ slug: 1 });

toursSchema.virtual("durationWeeks").get(function () {
  const WEEK_DURATION = 7;
  return this.duration / WEEK_DURATION;
});

toursSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id"
});

toursSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

toursSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }).populate({
    path: "guides",
    select: "-__v -passwordChangedAt"
  });
  next();
});

toursSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model("Tour", toursSchema);

module.exports = Tour;
