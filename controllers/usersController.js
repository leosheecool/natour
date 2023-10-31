const AppError = require("../utils/AppError");
const catchAsyncError = require("../utils/catchAsyncError");
const {
  SUCCESS_CODE,
  NOT_FOUND_CODE,
  BAD_REQ_CODE
} = require("../utils/HTTPCodes");
const User = require("../models/userModel");
const factory = require("./handlerFactory");

const NOT_FOUND_MESSAGE = "No user found with that ID";

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

exports.getMe = (req, _, next) => {
  req.params.id = req.user._id;
  next();
};

exports.createUser = factory.createOne(User);

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

exports.updateMe = catchAsyncError(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    next(new AppError("This route is not for password updates", BAD_REQ_CODE));
    return;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    filterObj(req.body, "name", "email"),
    {
      new: true,
      runValidators: true
    }
  );

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

exports.desactivateMe = catchAsyncError(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user._id, { active: false });

  if (!user) {
    next(new AppError("User not found", NOT_FOUND_CODE));
    return;
  }

  res.status(SUCCESS_CODE).json({
    status: "success",
    data: null
  });
});
