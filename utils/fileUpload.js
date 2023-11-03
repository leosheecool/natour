const AppError = require("../utils/AppError");
const multer = require("multer");
const sharp = require("sharp");
const { BAD_REQ_CODE } = require("./HTTPCodes");

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

exports.uploadImg = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

/**
 * @param {Array} files File array that you want to resize
 * @param {String} filenameTemplate Filename template
 * @param {String} path The location where the image will be stored
 * @param {{width: Number, height: Number}} size ImageSize
 */
exports.resizePhotos = async (files, filenameTemplate, path, size) => {
  const filenames = [];

  await Promise.all(
    files.map(async (file, i) => {
      const filename = `${filenameTemplate}-${Date.now()}-${i + 1}.webp`;

      await sharp(file)
        .resize(size.width, size.height)
        .toFormat("webp")
        .webp({ quality: 100 })
        .toFile(`${path}${filename}`);
      filenames.push(filename);
    })
  );

  return filenames;
};
