const app = require("./app");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 8000;

const DB_URI = process.env.DB_URI.replace(
  "<PASSWORD>",
  process.env.DB_PASSWORD
);

mongoose.connect(DB_URI).then(() => console.log("DB connected"));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
