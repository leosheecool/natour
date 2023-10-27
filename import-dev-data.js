const mongoose = require("mongoose");
const fs = require("fs");
const Tour = require("./models/tourModel");
const dotenv = require("dotenv");

dotenv.config({ path: ".env" });

const DB_URI = process.env.DB_URI.replace(
  "<PASSWORD>",
  process.env.DB_PASSWORD
);
const OPERATION_ARG_POS = 2;

mongoose.connect(DB_URI).then(() => console.log("DB connected"));

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours.json`, "utf-8")
);
tours.forEach((item) => delete item.id);

console.log("tours", tours);

const importCollectionData = async () => {
  try {
    await Tour.create(tours);
    console.log("Data successfully loaded!");
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

const deleteCollectionData = async () => {
  try {
    await Tour.deleteMany();
    console.log("Data successfully deleted!");
    process.exit();
  } catch {
    console.log(err);
  }
};

if (process.argv[OPERATION_ARG_POS] === "--import") {
  importCollectionData();
}

if (process.argv[OPERATION_ARG_POS] === "--delete") {
  deleteCollectionData();
}

console.log(process.argv);
