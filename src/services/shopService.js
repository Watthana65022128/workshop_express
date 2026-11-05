const Account = require("../models/Account");
const AppError = require("../utils/AppError");
const { objectId } = require("../utils/validate");
const { publicAccount } = require("./authService");

async function listPending(query) {
  if (query.status !== undefined && query.status !== "pending") {
    throw new AppError(400, "Only status=pending is supported");
  }
  const filter = { role: "shop", status: "pending" };
  const accounts = await Account.find(filter).sort({ createdAt: -1 });
  return accounts.map(publicAccount);
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
