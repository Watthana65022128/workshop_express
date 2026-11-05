const AppError = require("./AppError");

function toMinorUnits(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new AppError(400, "price must be a non-negative number with at most 2 decimal places");
  }
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) {
    throw new AppError(400, "price must be a non-negative number with at most 2 decimal places");
  }
  const satang = BigInt(match[1]) * 100n + BigInt((match[2] || "").padEnd(2, "0"));
  if (satang > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new AppError(400, "price is too large");
  }
  return Number(satang);
}

function fromMinorUnits(value) {
  return value / 100;
}

module.exports = { toMinorUnits, fromMinorUnits };
