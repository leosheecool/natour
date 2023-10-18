const mongoose = require("mongoose");

const toursSchema = new mongoose.Schema({
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
    default: Date.now()
  },
  startDates: [Date]
});

const Tour = mongoose.model("Tour", toursSchema);

module.exports = Tour;
