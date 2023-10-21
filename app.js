const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const app = express();
const toursRouter = require("./routes/tourRoutes");
const usersRouter = require("./routes/userRoutes");
const AppError = require("./utils/AppError");
const errorHandler = require("./controllers/errorController");

dotenv.config({
  path: "./.env"
});

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use(express.json());

app.get("/ping", (_, res) => {
  res.send("pong!");
});

app.use("/api/v1/tours", toursRouter);
app.use("/api/v1/users", usersRouter);

app.all("*", (req, _, next) => {
  const NOT_FOUND_STATUS_CODE = 404;

  next(new AppError(`Can't find ${req.originalUrl}`, NOT_FOUND_STATUS_CODE));
});

app.use(errorHandler);

module.exports = app;
