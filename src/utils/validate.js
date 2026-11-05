const mongoose = require("mongoose");
const AppError = require("./AppError");

function bodyObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(400, "Request body must be a JSON object");
  }
  return value;
}

function fields(value, allowed, required = []) {
  const body = bodyObject(value);
  const unknown = Object.keys(body).filter((key) => !allowed.includes(key));
  if (unknown.length)
    throw new AppError(400, `Unknown fields: ${unknown.join(", ")}`);
  for (const key of required) {
    if (body[key] === undefined) throw new AppError(400, `${key} is required`);
  }
  return body;
}

function string(value, name, min, max) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  ) {
    throw new AppError(400, `${name} must be ${min}-${max} characters`);
  }
  return value.trim();
}

function integer(value, name, min, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new AppError(
      400,
      `${name} must be an integer between ${min} and ${max}`,
    );
  }
  return value;
}

function objectId(value, name = "ID") {
  if (!mongoose.isObjectIdOrHexString(value))
    throw new AppError(400, `Invalid ${name}`);
  return value;
}

function pagination(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  integer(page, "page", 1);
  integer(limit, "limit", 1, 100);
  return { page, limit, skip: (page - 1) * limit };
}

module.exports = { bodyObject, fields, string, integer, objectId, pagination };
