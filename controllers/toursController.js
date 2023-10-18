const fs = require("fs");
const Tour = require("../models/tourModel");

const prepareQuery = async (rawQuery, Model, excludedFields) => {
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 100;
  const DEFAULT_SORT = "-createdAt";
  const DEFAULT_FIELDS = "-__v";
  const SORTING_REGEX = /(gte|gt|lte|lt)\b/g;

  const queryObj = { ...rawQuery };
  excludedFields.forEach((el) => delete queryObj[el]);

  let queryString = JSON.stringify(queryObj);
  queryString = queryString.replace(SORTING_REGEX, (match) => `$${match}`);

  let query = Model.find(JSON.parse(queryString));

  if (rawQuery.sort) {
    query = query.sort(rawQuery.sort.replace(",", " "));
  } else {
    query = query.sort(DEFAULT_SORT);
  }

  if (rawQuery.fields) {
    query = query.select(rawQuery.fields.replace(",", " "));
  } else {
    query = query.select(DEFAULT_FIELDS);
  }

  const page = rawQuery.page * 1 || DEFAULT_PAGE;
  const limit = rawQuery.limit * 1 || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);

  if (rawQuery.page) {
    const numTours = await Tour.countDocuments();
    if (skip >= numTours) throw new Error("This page does not exist");
  }

  return query;
};

exports.getTours = async (req, res) => {
  const EXCLUDED_FIELDS = ["page", "sort", "limit", "fields"];

  try {
    const tours = await prepareQuery(req.query, Tour, EXCLUDED_FIELDS);

    res.json({
      status: "success",
      results: tours.length,
      data: {
        tours
      }
    });
  } catch (err) {
    const ERROR_CODE = 404;
    res.status(ERROR_CODE).json({
      status: "fail",
      message: `${err}`
    });
  }
};

exports.createTour = async (req, res) => {
  const CREATED_CODE = 201;
  const ERROR_CODE = 400;

  try {
    const tour = await Tour.create(req.body);
    res.status(CREATED_CODE).json({
      status: "success",
      data: {
        tour
      }
    });
  } catch (err) {
    res.status(ERROR_CODE).json({
      status: "fail",
      message: err
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    res.json({
      status: "success",
      data: {
        tour
      }
    });
  } catch (err) {
    const NOT_FOUND_STATUS_CODE = 404;
    res.status(NOT_FOUND_STATUS_CODE).json({
      status: "fail",
      message: err
    });
  }
};

exports.updateTour = async (req, res) => {
  const NOT_FOUND_STATUS_CODE = 404;

  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.json({
      status: "success",
      data: {
        tour
      }
    });
  } catch (err) {
    res.status(NOT_FOUND_STATUS_CODE).json({
      status: "fail",
      message: err
    });
  }
};

exports.deleteTour = async (req, res) => {
  const NOT_FOUND_STATUS_CODE = 404;
  const DELETED_CODE = 204;

  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(DELETED_CODE).json({
      status: "success",
      data: null
    });
  } catch (err) {
    res.status(NOT_FOUND_STATUS_CODE).json({
      status: "fail",
      message: err
    });
  }
};
