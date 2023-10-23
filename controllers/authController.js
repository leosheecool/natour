const AppError = require("../utils/AppError");
const catchAsyncError = require("../utils/catchAsyncError");
const {
  BAD_REQ_CODE,
  CREATED_CODE,
  UNAUTHORIZED_CODE,
  SUCCESS_CODE,
  FORBIDEN_CODE
} = require("../utils/HTTPCodes");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { promisify } = require("util");

const getSignedJWT = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

exports.signUp = catchAsyncError(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  if (!user) {
    next(new AppError("Unable to create the user", BAD_REQ_CODE));
    return;
  }

  res.status(CREATED_CODE).json({
    status: "success",
    data: {
      user
    },
    token: getSignedJWT(user._id)
  });
});

exports.signIn = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(new AppError("Please provide email and password", BAD_REQ_CODE));
    return;
  }

  const user = await User.findOne({
    email
  }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    next(new AppError("Incorrect email or password", UNAUTHORIZED_CODE));
    return;
  }

  res.status(SUCCESS_CODE).json({
    status: "success",
    token: getSignedJWT(user._id)
  });
});

exports.protectedRouteHandler = catchAsyncError(async (req, _, next) => {
  if (!req.headers.authorization?.startsWith("Bearer"))
    return next(new AppError("You are not logged in", UNAUTHORIZED_CODE));

  const token = req.headers.authorization.split(" ")[1];

  if (!token) return next(new AppError("No token found", UNAUTHORIZED_CODE));

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);

  if (!user)
    return next(
      new AppError(
        "The user belonging to this token no longer exists",
        UNAUTHORIZED_CODE
      )
    );

  if (user.changedPasswordAfter(decoded.iat))
    return next(
      new AppError(
        "User recently changed password. Please log in again",
        UNAUTHORIZED_CODE
      )
    );

  req.user = user;

  return next();
});

exports.restrictTo = (...roles) => {
  return (req, _, next) => {
    if (!roles.includes(req.user.role) && req.user.role !== "admin")
      return next(new AppError("Operation not permitted", FORBIDEN_CODE));
    return next();
  };
};
