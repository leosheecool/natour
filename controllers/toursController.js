const Tour = require("../models/tourModel");
const catchAsyncErrors = require("../utils/catchAsyncError");
const factory = require("./handlerFactory");

exports.aliasTopTours = (req, _, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";

  next();
};

exports.getTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, "reviews");

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsyncErrors(async (_, res) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: {
          $gte: 4.5
        }
      }
    },
    {
      $group: {
        _id: "$difficulty",
        totalNbRatings: {
          $sum: "$ratingsQuantity"
        },
        totalNbTours: {
          $sum: 1
        },
        averageRating: {
          $avg: "$ratingsAverage"
        },
        averagePrice: {
          $avg: "$price"
        },
        minPrice: {
          $min: "$price"
        },
        maxPrice: {
          $max: "$price"
        }
      }
    },
    {
      $sort: {
        averagePrice: 1
      }
    }
  ]);

  res.json({
    status: "success",
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsyncErrors(async (req, res) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates"
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}/01/01`),
          $lte: new Date(`${year}/12/31`)
        }
      }
    },
    {
      $group: {
        _id: {
          $month: "$startDates"
        },
        nbTours: {
          $sum: 1
        },
        tours: {
          $push: "$name"
        }
      }
    },
    {
      $addFields: {
        month: "$_id"
      }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: {
        month: 1
      }
    }
  ]);

  res.json({
    status: "success",
    data: {
      plan
    }
  });
});
