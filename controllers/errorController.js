const AppError = require("../utils/AppError");
const INVALID_PARAMETER = 400;

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, INVALID_PARAMETER);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value: "${err.keyValue.name}". Please use another value`;
  return new AppError(message, INVALID_PARAMETER);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(", ")}`;
  return new AppError(message, INVALID_PARAMETER);
};

const errorHandler = (err, _, res, next) => {
  const INTERNAL_SERV_ERROR_CODE = 500;
  const DUPLICATE_FIELDS_CODE = 11000;
  const isDevEnv = process.env.NODE_ENV === "development";

  err.statusCode ??= INTERNAL_SERV_ERROR_CODE;
  err.status ??= "error";

  let errorObj = {
    status: err.status,
    message: err.message,
    error: isDevEnv ? err : undefined,
    stack: isDevEnv ? err.stack : undefined
  };

  if (isDevEnv) {
    res.status(err.statusCode).json(errorObj);
    next();
    return;
  }

  let error = { ...err, name: err.name };

  if (error.name === "CastError") error = handleCastErrorDB(error);
  if (error.code === DUPLICATE_FIELDS_CODE)
    error = handleDuplicateFieldsDB(error);
  if (error.name === "ValidationError") error = handleValidationErrorDB(error);

  errorObj = {
    status: error.status,
    message: error.message
  };

  if (error.isOperational) res.status(error.statusCode).json(errorObj);
  else
    res.status(INTERNAL_SERV_ERROR_CODE).json({
      status: "error",
      message: "an error occured on our side"
    });
  next();
};

module.exports = errorHandler;
