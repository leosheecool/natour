const APIUtils = require("../utils/APIUtils");
const AppError = require("../utils/AppError");
const {
  NOT_FOUND_CODE,
  DELETED_CODE,
  BAD_REQ_CODE,
  CREATED_CODE,
  SUCCESS_CODE
} = require("../utils/HTTPCodes");
const catchAsyncError = require("../utils/catchAsyncError");

exports.deleteOne = (Model) =>
  catchAsyncError(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      next(new AppError("Unable to find the document", NOT_FOUND_CODE));
      return;
    }

    res.status(DELETED_CODE).json({
      status: "success",
      data: null
    });
  });

exports.updateOne = (Model) =>
  catchAsyncError(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      next(new AppError("Unable to find the document", NOT_FOUND_CODE));
      return;
    }

    res.status(SUCCESS_CODE).json({
      status: "success",
      data: {
        data: doc
      }
    });
  });

exports.createOne = (Model) =>
  catchAsyncError(async (req, res, next) => {
    const doc = await Model.create(req.body);

    if (!doc) {
      next(new AppError("Unable to create the document", BAD_REQ_CODE));
      return;
    }

    res.status(CREATED_CODE).json({
      status: "success",
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsyncError(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (populateOptions) query = query.populate(populateOptions);

    const doc = await query;

    if (!doc) {
      next(new AppError("No document with that id found", NOT_FOUND_CODE));
      return;
    }

    res.status(SUCCESS_CODE).json({
      status: "success",
      data: {
        data: doc
      }
    });
  });

exports.getAll = (Model) =>
  catchAsyncError(async (req, res) => {
    const EXCLUDED_FIELDS = ["page", "sort", "limit", "fields"];
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIUtils(
      Model.find(filter),
      req.query,
      EXCLUDED_FIELDS
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;

    res.json({
      status: "success",
      results: doc.length,
      data: {
        data: doc
      }
    });
  });
