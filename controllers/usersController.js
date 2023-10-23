const AppError = require("../utils/AppError");
const catchAsyncError = require("../utils/catchAsyncError");
const {
  SUCCESS_CODE,
  NOT_FOUND_CODE,
  BAD_REQ_CODE,
  CREATED_CODE
} = require("../utils/HTTPCodes");
const User = require("../models/userModel");

const NOT_FOUND_MESSAGE = "No user found with that ID";

exports.getAllUsers = catchAsyncError(async (_, res) => {
  const users = await User.find();

  res.status(SUCCESS_CODE).json({
    status: "success",
    data: {
      users
    }
  });
});

exports.getUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    next(new AppError(NOT_FOUND_MESSAGE, NOT_FOUND_CODE));
    return;
  }

  res.status(SUCCESS_CODE).json({
    status: "success",
    data: {
      user
    }
  });
});

exports.createUser = catchAsyncError(async (req, res, next) => {
  const user = await User.create(req.body);

  if (!user) {
    next(new AppError("Unable to create the user", BAD_REQ_CODE));
    return;
  }

  res.status(CREATED_CODE).json({
    status: "success",
    data: {
      user
    }
  });
});

exports.updateUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    next(new AppError(NOT_FOUND_MESSAGE, NOT_FOUND_CODE));
    return;
  }

  res.status(SUCCESS_CODE).json({
    status: "success",
    data: {
      user
    }
  });
});

exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    next(new AppError(NOT_FOUND_MESSAGE, NOT_FOUND_CODE));
    return;
  }

  res.status(SUCCESS_CODE).json({
    status: "success",
    data: null
  });
});
