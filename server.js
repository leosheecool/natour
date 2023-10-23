const app = require("./app");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 8000;

process.on("uncaughtException", (err) => {
  console.log(err.message);
  console.log("uncaught exception: shutting down process.");
  process.exit(1);
});

const DB_URI = process.env.DB_URI.replace(
  "<PASSWORD>",
  process.env.DB_PASSWORD
);

mongoose.connect(DB_URI).then(() => console.log("DB connected"));

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.message);
  console.log("Unhandled rejection: shutting down process...");

  server.close(() => {
    process.exit(1);
  });
});
