const crypto = require("crypto");

exports.encryptToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

exports.getPropertyFromCookie = (cookie, wantedCookieName) => {
  let token;
  if (cookie) {
    const value = `; ${cookie}`;
    const parts = value.split(`; ${wantedCookieName}=`);
    if (parts.length === 2) {
      token = parts.pop().split(";").shift();
    }
  }
  return token;
};
