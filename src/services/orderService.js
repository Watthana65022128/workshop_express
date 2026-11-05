const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const { fields, string, integer, objectId } = require("../utils/validate");

async function list(shopId) {
  const filter = { shopId };
  return Order.find(filter).sort({ createdAt: -1 });
}

async function listForProduct(shopId, productId) {
  objectId(productId, "product ID");
  const exists = await Product.exists({ _id: productId, shopId });
  if (!exists) throw new AppError(404, "Product not found");
  const filter = { shopId, productId };
  return Order.find(filter).sort({ createdAt: -1 });
}

async function create(shopId, productId, input) {
  objectId(productId, "product ID");
  const body = fields(input, ["quantity", "note"], ["quantity"]);
  const quantity = integer(body.quantity, "quantity", 1);
  const note = body.note === undefined ? "" : string(body.note, "note", 0, 500);

  return mongoose.connection.transaction(async (session) => {
    const product = await Product.findOneAndUpdate(
      { _id: productId, shopId, isActive: true, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { returnDocument: "after", session },
    );

    if (!product) {
      const exists = await Product.exists({
        _id: productId,
        shopId,
        isActive: true,
      }).session(session);
      if (!exists) throw new AppError(404, "Product not found");
      throw new AppError(409, "Insufficient stock");
    }

    const totalSatang = product.priceSatang * quantity;
    if (!Number.isSafeInteger(totalSatang))
      throw new AppError(400, "Order total is too large");

    const [order] = await Order.create(
      [
        {
          shopId,
          productId: product._id,
          productName: product.name,
          unitPriceSatang: product.priceSatang,
          quantity,
          totalSatang,
          note,
        },
      ],
      { session },
    );
    return order;
  });
}

module.exports = { list, listForProduct, create };
