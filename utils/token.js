const crypto = require("crypto");

exports.encryptToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");
