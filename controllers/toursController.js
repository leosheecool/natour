const Tour = require("../models/tourModel");
const AppError = require("../utils/AppError");
const { BAD_REQ_CODE } = require("../utils/HTTPCodes");
const catchAsyncErrors = require("../utils/catchAsyncError");
const { resizePhotos } = require("../utils/fileUpload");
const factory = require("./handlerFactory");
const multer = require("multer");

exports.aliasTopTours = (req, _, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";

  next();
};

const multerStorage = multer.memoryStorage();

const multerFilter = (_, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
    return;
  }

  cb(
    new AppError("Not an image! Please upload only images", BAD_REQ_CODE),
    false
  );
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  {
    name: "imageCover",
    maxCount: 1
  },
  {
    name: "images",
    maxCount: 5
  }
]);

exports.resizeTourImages = catchAsyncErrors(async (req, _, next) => {
  const coverImgSize = {
    width: 2000,
    height: 1333
  };
  const imagesSize = {
    width: 500,
    height: 500
  };

  if (req.files.imageCover) {
    const [filename] = await resizePhotos(
      [req.files.imageCover[0].buffer],
      `tour-${req.params.id}-cover`,
      "public/img/tours/",
      coverImgSize
    );

    req.body.imageCover = filename;
  }

  if (req.files.images) {
    const filenames = await resizePhotos(
      req.files.images.map((img) => img.buffer),
      `tour-${req.params.id}-image`,
      "public/img/tours/",
      imagesSize
    );

    req.body.images = filenames;
  }
  next();
});

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

exports.getTourWithin = catchAsyncErrors(async (req, res, next) => {
  const earthRadius = {
    mi: 3963.2,
    km: 6378.1
  };

  const { distance, unit } = req.params;
  const [lat, lng] = req.params.latlng.split(",");

  if (!lat || !lng) {
    next(new AppError("Please provide latitude and longitude", BAD_REQ_CODE));
    return;
  }

  const radius =
    unit === "mi" ? distance / earthRadius.mi : distance / earthRadius.km;

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius]
      }
    }
  });

  res.json({
    status: "success",
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getToursDistances = catchAsyncErrors(async (req, res, next) => {
  const { unit } = req.params;
  const [lat, lng] = req.params.latlng.split(",");

  if (!lat || !lng) {
    next(new AppError("Please provide latitude and longitude", BAD_REQ_CODE));
    return;
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: "distance",
        distanceMultiplier: unit === "mi" ? 0.000621371 : 0.001
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.json({
    status: "success",
    data: {
      data: distances
    }
  });
});
