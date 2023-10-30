const express = require("express");
const app = express();
const AppError = require("./utils/AppError");
const dotenv = require("dotenv");
const errorHandler = require("./controllers/errorController");
const expressRateLimiter = require("express-rate-limit");
const helmet = require("helmet");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");
const xssClean = require("xss-clean");

const toursRouter = require("./routes/tourRoutes");
const usersRouter = require("./routes/userRoutes");
const reviewsRouter = require("./routes/reviewRoutes");

dotenv.config({
  path: "./.env"
});

// Set HTTP security headers
app.use(helmet());

// Set Development logging
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Set rate limiter
const limiter = expressRateLimiter({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests from this IP, please try again in 15 min!"
});
app.use("/api", limiter);

// Set body parser
app.use(
  express.json({
    limit: "15kb"
  })
);
app.use(express.static(`${__dirname}/public`));

// Set data sanitization against NoSQL query injection, xss and http parameter pollution
app.use(mongoSanitize());
app.use(xssClean());
app.use(
  hpp({
    whitelist: [
      "difficulty",
      "duration",
      "maxGroupSize",
      "ratingsAverage",
      "ratingsQuantity",
      "price"
    ]
  })
);

app.get("/ping", (_, res) => {
  res.send("pong!");
});

// Set routers
app.use("/api/v1/tours", toursRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/reviews", reviewsRouter);

// Set route fallback
app.all("*", (req, _, next) => {
  const NOT_FOUND_STATUS_CODE = 404;

  next(new AppError(`Can't find ${req.originalUrl}`, NOT_FOUND_STATUS_CODE));
});

// Set error handler
app.use(errorHandler);

module.exports = app;
