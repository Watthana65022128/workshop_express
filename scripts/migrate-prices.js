require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const Product = require("../src/models/Product");
const Order = require("../src/models/Order");

async function main() {
  await connectDB();

  const productFields = ["priceSatang", "priceBaht", "price"];
  const orderUnitFields = ["unitPriceSatang", "unitPriceBaht", "unitPrice"];
  const orderTotalFields = ["totalSatang", "totalBaht", "total"];
  const has = (document, field) => Object.hasOwn(document, field);

  for await (const product of Product.collection.find({}, {
    projection: { priceSatang: 1, priceBaht: 1, price: 1 },
  })) {
    if (productFields.filter((field) => has(product, field)).length !== 1) {
      throw new Error(`Product ${product._id} has conflicting or missing price fields`);
    }
  }
  for await (const order of Order.collection.find({}, {
    projection: {
      unitPriceSatang: 1, unitPriceBaht: 1, unitPrice: 1,
      totalSatang: 1, totalBaht: 1, total: 1,
    },
  })) {
    const unit = orderUnitFields.filter((field) => has(order, field));
    const total = orderTotalFields.filter((field) => has(order, field));
    if (unit.length !== 1 || total.length !== 1 || orderUnitFields.indexOf(unit[0]) !== orderTotalFields.indexOf(total[0])) {
      throw new Error(`Order ${order._id} has conflicting or missing price fields`);
    }
  }

  const productSatang = await Product.collection.updateMany(
    { priceSatang: { $exists: true } },
    [{ $set: { price: { $divide: ["$priceSatang", 100] } } }, { $unset: "priceSatang" }],
  );
  const productBaht = await Product.collection.updateMany(
    { priceBaht: { $exists: true } },
    [{ $set: { price: "$priceBaht" } }, { $unset: "priceBaht" }],
  );
  const orderSatang = await Order.collection.updateMany(
    { unitPriceSatang: { $exists: true }, totalSatang: { $exists: true } },
    [{
      $set: {
        unitPrice: { $divide: ["$unitPriceSatang", 100] },
        total: { $divide: ["$totalSatang", 100] },
      },
    }, { $unset: ["unitPriceSatang", "totalSatang"] }],
  );
  const orderBaht = await Order.collection.updateMany(
    { unitPriceBaht: { $exists: true }, totalBaht: { $exists: true } },
    [{ $set: { unitPrice: "$unitPriceBaht", total: "$totalBaht" } },
      { $unset: ["unitPriceBaht", "totalBaht"] }],
  );

  const remainingProducts = await Product.collection.countDocuments({
    $or: [{ priceSatang: { $exists: true } }, { priceBaht: { $exists: true } }],
  });
  const remainingOrders = await Order.collection.countDocuments({
    $or: [
      { unitPriceSatang: { $exists: true } }, { unitPriceBaht: { $exists: true } },
      { totalSatang: { $exists: true } }, { totalBaht: { $exists: true } },
    ],
  });
  if (remainingProducts || remainingOrders) throw new Error("Some legacy price fields remain");

  console.log(`Migrated ${productSatang.modifiedCount + productBaht.modifiedCount} products and ${orderSatang.modifiedCount + orderBaht.modifiedCount} orders`);
}

main()
  .catch((error) => {
    console.error("Price migration failed:", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
