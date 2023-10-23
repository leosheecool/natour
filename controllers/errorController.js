const AppError = require("../utils/AppError");
const {
  BAD_REQ_CODE,
  INTERNAL_SERV_ERROR_CODE,
  UNAUTHORIZED_CODE
} = require("../utils/HTTPCodes");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, BAD_REQ_CODE);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value: "${err.keyValue.name}". Please use another value`;
  return new AppError(message, BAD_REQ_CODE);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(", ")}`;
  return new AppError(message, BAD_REQ_CODE);
};

const handleJwtError = () => new AppError("Invalid token", UNAUTHORIZED_CODE);
const handleJwtExpired = () => new AppError("Expired token", UNAUTHORIZED_CODE);

const errorHandler = (err, _, res, next) => {
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

  let error = { ...err, name: err.name, message: err.message };

  if (error.name === "CastError") error = handleCastErrorDB(error);
  if (error.code === DUPLICATE_FIELDS_CODE)
    error = handleDuplicateFieldsDB(error);
  if (error.name === "ValidationError") error = handleValidationErrorDB(error);
  if (error.name === "JsonWebTokenError") error = handleJwtError();
  if (error.name === "TokenExpiredError") error = handleJwtExpired();

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
