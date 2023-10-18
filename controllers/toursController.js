const fs = require("fs");
const Tour = require("../models/tourModel");

exports.getTours = async (_, res) => {
  try {
    const tours = await Tour.find();
    console.log(tours);

    res.json({
      status: "success",
      results: tours.length,
      data: {
        tours
      }
    });
  } catch (err) {
    const ERROR_CODE = 400;
    res.status(ERROR_CODE).json({
      status: "fail",
      message: err
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
