const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const app = express();
const toursRouter = require("./routes/tourRoutes");

dotenv.config({
  path: "./.env"
});

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.use(express.json());

app.use("/api/v1/tours", toursRouter);

app.get("/ping", (_, res) => {
  res.send("pong!");
});

module.exports = app;
