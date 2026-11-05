require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Account = require("../src/models/Account");
const Product = require("../src/models/Product");
const Order = require("../src/models/Order");

async function main() {
  await connectDB();
  for (const model of [Account, Product, Order]) {
    const result = await model.collection.updateMany(
      { __v: { $exists: true } },
      { $unset: { __v: "" } },
    );
    console.log(`${model.collection.name}: removed __v from ${result.modifiedCount} documents`);
  }
}

main()
  .catch((error) => {
    console.error("Version key cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
