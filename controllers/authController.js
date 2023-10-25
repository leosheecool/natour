const AppError = require("../utils/AppError");
const catchAsyncError = require("../utils/catchAsyncError");
const {
  BAD_REQ_CODE,
  CREATED_CODE,
  UNAUTHORIZED_CODE,
  SUCCESS_CODE,
  FORBIDEN_CODE,
  NOT_FOUND_CODE,
  INTERNAL_SERV_ERROR_CODE
} = require("../utils/HTTPCodes");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { promisify } = require("util");
const sendEmail = require("../utils/email");
const { encryptToken, getPropertyFromCookie } = require("../utils/token");
const convertToDays = 24 * 60 * 60 * 1000;

const createResCookieWithJWT = (id, res) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) * convertToDays
    ),
    secure: process.env.NODE_ENV === "production",
    httpOnly: true
  });
};

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

  createResCookieWithJWT(user._id, res);

  user.password = null;

  res.status(CREATED_CODE).json({
    status: "success",
    data: {
      user
    }
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

  if (!user || !(await user.isCorrectPassword(password, user.password))) {
    next(new AppError("Incorrect email or password", UNAUTHORIZED_CODE));
    return;
  }

  createResCookieWithJWT(user._id, res);

  res.status(SUCCESS_CODE).json({
    status: "success"
  });
});

exports.protectedRouteHandler = catchAsyncError(async (req, _, next) => {
  const token = getPropertyFromCookie(req.headers.cookie, "jwt");

  if (!token)
    return next(new AppError("You are not logged in", UNAUTHORIZED_CODE));

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).select("+password");

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

exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    next(new AppError("User does not exist", NOT_FOUND_CODE));
    return;
  }

  const resetPasswordToken = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/reset-password?token=${resetPasswordToken}`;

  const mailOptions = {
    email: user.email,
    subject: "Your password reset token (valid for 10 minutes)",
    text: `Here is the URL that you need to request using the PATCH method with in the body the fields: "password" and "passwordConfirm"\n${resetUrl}\n\
    If you didn't request a password reset, please ignore this email`
  };

  try {
    await sendEmail(mailOptions);

    res.status(SUCCESS_CODE).json({
      status: "success",
      message: "Token sent to email"
    });
    return;
  } catch (err) {
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.save({ validateBeforeSave: false });
    next(
      new AppError(
        "Unable to send the forget password email",
        INTERNAL_SERV_ERROR_CODE
      )
    );
    return;
  }
});

exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const encryptedToken = encryptToken(req.query.token);

  const user = await User.findOne({
    passwordResetToken: encryptedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    next(new AppError("Token is invalid or has expired", BAD_REQ_CODE));
    return;
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;

  await user.save();

  createResCookieWithJWT(user._id, res);

  res.status(SUCCESS_CODE).json({
    status: "success",
    message: "Password updated"
  });
});

exports.updatePassword = catchAsyncError(async (req, res, next) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    next(new AppError("Please provide all the fields", BAD_REQ_CODE));
    return;
  }

  if (!(await req.user.isCorrectPassword(currentPassword, req.user.password))) {
    next(new AppError("Incorrect password", UNAUTHORIZED_CODE));
    return;
  }

  req.user.password = newPassword;
  req.user.passwordConfirm = newPasswordConfirm;
  await req.user.save();

  createResCookieWithJWT(req.user._id, res);

  res.status(SUCCESS_CODE).json({
    status: "success"
  });
});
