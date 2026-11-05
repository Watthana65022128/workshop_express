const Account = require("../models/Account");
const AppError = require("../utils/AppError");
const { objectId, pagination } = require("../utils/validate");
const { publicAccount } = require("./authService");

async function listPending(query) {
  if (query.status !== undefined && query.status !== "pending") {
    throw new AppError(400, "Only status=pending is supported");
  }
  const { page, limit, skip } = pagination(query);
  const filter = { role: "shop", status: "pending" };
  const [accounts, total] = await Promise.all([
    Account.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Account.countDocuments(filter),
  ]);
  return {
    data: accounts.map(publicAccount),
    pagination: { page, limit, total },
  };
}

async function approve(id) {
  objectId(id, "shop ID");
  const account = await Account.findOneAndUpdate(
    { _id: id, role: "shop", status: "pending" },
    { $set: { status: "approved" } },
    { returnDocument: "after" },
  );
  if (account) return publicAccount(account);

  const existing = await Account.findOne({ _id: id, role: "shop" });
  if (!existing) throw new AppError(404, "Shop not found");
  throw new AppError(409, "Shop is already approved");
}

module.exports = { listPending, approve };
