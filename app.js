const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const app = express();
const toursRouter = require("./routes/tourRoutes");
const usersRouter = require("./routes/userRoutes");

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

app.all("*", (req, res, next) => {
  const NOT_FOUND_STATUS_CODE = 404;

  res.status(NOT_FOUND_STATUS_CODE).json({
    status: "fail",
    message: `Can't find ${req.originalUrl}`
  });

  next();
});

module.exports = app;
