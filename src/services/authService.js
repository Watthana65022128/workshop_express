const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Account = require("../models/Account");
const AppError = require("../utils/AppError");
const { fields, string } = require("../utils/validate");

function publicAccount(account) {
  const { _id, email, shopName, role, status, createdAt, updatedAt } = account;
  return {
    id: String(_id),
    email,
    shopName: shopName || null,
    role,
    status,
    createdAt,
    updatedAt,
  };
}

function emailAddress(value) {
  const email = string(value, "email", 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError(400, "Invalid email");
  }
  return email;
}

function passwordValue(value) {
  if (
    typeof value !== "string" ||
    value.length < 8 ||
    Buffer.byteLength(value, "utf8") > 72
  ) {
    throw new AppError(
      400,
      "password must be at least 8 characters and at most 72 UTF-8 bytes",
    );
  }
  return value;
}

async function register(input) {
  const body = fields(
    input,
    ["email", "password", "shopName"],
    ["email", "password", "shopName"],
  );
  const email = emailAddress(body.email);
  const password = passwordValue(body.password);
  const shopName = string(body.shopName, "shopName", 2, 100);
  const passwordHash = await bcrypt.hash(password, 12);
  const account = await Account.create({
    email,
    passwordHash,
    shopName,
    role: "shop",
    status: "pending",
  });
  return publicAccount(account);
}

async function login(input) {
  const body = fields(input, ["email", "password"], ["email", "password"]);
  const email = emailAddress(body.email);
  passwordValue(body.password);
  const account = await Account.findOne({ email }).select("+passwordHash");
  const valid =
    account && (await bcrypt.compare(body.password, account.passwordHash));
  if (!valid) throw new AppError(401, "Invalid email or password");

  const token = jwt.sign({}, process.env.JWT_SECRET, {
    algorithm: "HS256",
    subject: String(account._id),
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
  return { token, account: publicAccount(account) };
}

module.exports = {
  register,
  login,
  publicAccount,
  emailAddress,
  passwordValue,
};
