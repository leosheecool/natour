const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { encryptToken } = require("../utils/token");

const MIN_PASSWORD_LENGTH = 8;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "User must have a name"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "User must have an email"],
    unique: [true, "Duplicate key"],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email"]
  },
  photo: {
    type: String,
    default: "default.jpg"
  },
  password: {
    type: String,
    required: [true, "User must have a password"],
    minlength: [
      MIN_PASSWORD_LENGTH,
      "Password must have at least 8 characters"
    ],
    validate: [validator.isStrongPassword, "Password not strong enough"],
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, "User must confirm the password"],
    validate: {
      validator(el) {
        return el === this.password;
      },
      message: "Passwords are not the same"
    }
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user"
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true
  }
});

userSchema.pre("save", async function (next) {
  const COST = 12;

  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, COST);

  this.passwordConfirm = null;

  return next();
});

userSchema.pre("save", async function (next) {
  const timeDelta = 1000;

  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - timeDelta;

  return next();
});

userSchema.methods.isCorrectPassword = bcrypt.compare;
userSchema.methods.changedPasswordAfter = (time) => {
  const millisecondsToSeconds = 1000;

  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / millisecondsToSeconds,
      10
    );

    return changedTimestamp > time;
  }

  return false;
};

userSchema.methods.generateResetPasswordToken = function () {
  const stringLength = 32;
  const min = 10;
  const sec = 60;
  const ms = 1000;
  const validityTime = min * sec * ms;

  const resetToken = crypto.randomBytes(stringLength).toString("hex");

  this.passwordResetToken = encryptToken(resetToken);

  this.passwordResetExpires = Date.now() + validityTime;

  return resetToken;
};

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
