const Tour = require("../models/tourModel");
const APIUtils = require("../utils/APIUtils");
const catchAsyncErrors = require("../utils/catchAsyncError");
const AppError = require("../utils/AppError");

const NOT_FOUND_STATUS_CODE = 404;
const NOT_FOUND_MESSAGE = "No tours found with this ID";

exports.aliasTopTours = (req, _, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";

  next();
};

exports.getTours = catchAsyncErrors(async (req, res) => {
  const EXCLUDED_FIELDS = ["page", "sort", "limit", "fields"];

  const features = new APIUtils(Tour.find(), req.query, EXCLUDED_FIELDS)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  res.json({
    status: "success",
    results: tours.length,
    data: {
      tours
    }
  });
});

exports.createTour = catchAsyncErrors(async (req, res, next) => {
  const CREATED_CODE = 201;

  const tour = await Tour.create(req.body);

  if (!tour) {
    next(new AppError(NOT_FOUND_MESSAGE, NOT_FOUND_STATUS_CODE));
    return;
  }

  res.status(CREATED_CODE).json({
    status: "success",
    data: {
      tour
    }
  });
});

exports.getTour = catchAsyncErrors(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    next(new AppError(NOT_FOUND_MESSAGE, NOT_FOUND_STATUS_CODE));
    return;
  }

  res.json({
    status: "success",
    data: {
      tour
    }
  });
});

exports.updateTour = catchAsyncErrors(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!tour) {
    next(new AppError(NOT_FOUND_MESSAGE, NOT_FOUND_STATUS_CODE));
    return;
  }

  res.json({
    status: "success",
    data: {
      tour
    }
  });
});

exports.deleteTour = catchAsyncErrors(async (req, res, next) => {
  const DELETED_CODE = 204;

  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    next(new AppError(NOT_FOUND_MESSAGE, NOT_FOUND_STATUS_CODE));
    return;
  }

  res.status(DELETED_CODE).json({
    status: "success",
    data: null
  });
});

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
