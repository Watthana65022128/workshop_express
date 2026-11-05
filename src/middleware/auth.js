const jwt = require("jsonwebtoken");
const Account = require("../models/Account");
const AppError = require("../utils/AppError");

async function authenticate(req, res, next) {
  const match = /^Bearer (\S+)$/i.exec(req.get("authorization") || "");
  if (!match) return next(new AppError(401, "Bearer token required"));

  try {
    const claims = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    const account = await Account.findById(claims.sub);
    if (!account) return next(new AppError(401, "Account no longer exists"));
    req.account = account;
    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return next(new AppError(401, "Invalid or expired token"));
    }
    return next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.account.role !== "admin")
    return next(new AppError(403, "Admin access required"));
  return next();
}

function requireApprovedShop(req, res, next) {
  if (req.account.role !== "shop" || req.account.status !== "approved") {
    return next(new AppError(403, "Approved shop access required"));
  }
  return next();
}

module.exports = { authenticate, requireAdmin, requireApprovedShop };
