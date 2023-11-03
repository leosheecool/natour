const {
  SUCCESS_CODE,
  NOT_FOUND_CODE,
  BAD_REQ_CODE
} = require("../utils/HTTPCodes");
const AppError = require("../utils/AppError");
const catchAsyncError = require("../utils/catchAsyncError");
const factory = require("./handlerFactory");
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/userModel");

const NOT_FOUND_MESSAGE = "No user found with that ID";

// const multerStorage = multer.diskStorage({
//   destination: (_, __, cb) => {
//     cb(null, "public/img/users");
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

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

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = catchAsyncError(async (req, _, next) => {
  const imgSize = 500;

  if (!req.file) {
    next();
    return;
  }

  req.file.filename = `user-${req.user.id}-${Date.now()}.webp`;

  sharp(req.file.buffer)
    .resize(imgSize, imgSize)
    .toFormat("webp")
    .webp({ quality: 100 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

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

  if (req.file) {
    req.body.photo = req.file.filename;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    filterObj(req.body, "name", "email", "photo"),
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
