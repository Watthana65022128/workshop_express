const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const { fields, string, integer, objectId } = require("../utils/validate");

function productInput(input, create = false) {
  const required = create ? ["name", "priceSatang", "stock"] : [];
  const body = fields(
    input,
    ["name", "description", "priceSatang", "stock"],
    required,
  );
  if (!create && "stock" in body)
    throw new AppError(400, "Use the stock endpoint to adjust stock");
  if (!create && Object.keys(body).length === 0)
    throw new AppError(400, "At least one field is required");
  const result = {};
  if ("name" in body) result.name = string(body.name, "name", 2, 120);
  if ("description" in body)
    result.description = string(body.description, "description", 0, 1000);
  if ("priceSatang" in body)
    result.priceSatang = integer(body.priceSatang, "priceSatang", 0);
  if ("stock" in body) result.stock = integer(body.stock, "stock", 0);
  return result;
}

async function list(shopId) {
  const filter = { shopId, isActive: true };
  return Product.find(filter).sort({ createdAt: -1 });
}

async function create(shopId, input) {
  return Product.create({ ...productInput(input, true), shopId });
}

async function get(shopId, id) {
  objectId(id, "product ID");
  const product = await Product.findOne({ _id: id, shopId });
  if (!product) throw new AppError(404, "Product not found");
  return product;
}

async function update(shopId, id, input) {
  objectId(id, "product ID");
  const changes = productInput(input);
  const product = await Product.findOneAndUpdate(
    { _id: id, shopId, isActive: true },
    { $set: changes },
    { returnDocument: "after", runValidators: true },
  );
  if (!product) throw new AppError(404, "Product not found");
  return product;
}

async function remove(shopId, id) {
  objectId(id, "product ID");
  const product = await Product.findOneAndUpdate(
    { _id: id, shopId, isActive: true },
    { $set: { isActive: false } },
    { returnDocument: "after" },
  );
  if (!product) throw new AppError(404, "Product not found");
  return product;
}

async function adjustStock(shopId, id, input) {
  objectId(id, "product ID");
  const body = fields(input, ["delta"], ["delta"]);
  const delta = integer(body.delta, "delta", -Number.MAX_SAFE_INTEGER);
  if (delta === 0) throw new AppError(400, "delta must not be zero");
  const product = await Product.findOneAndUpdate(
    {
      _id: id,
      shopId,
      isActive: true,
      stock:
        delta < 0
          ? { $gte: -delta }
          : { $lte: Number.MAX_SAFE_INTEGER - delta },
    },
    { $inc: { stock: delta } },
    { returnDocument: "after", runValidators: true },
  );
  if (product) return product;
  const existing = await Product.findOne({ _id: id, shopId, isActive: true });
  if (!existing) throw new AppError(404, "Product not found");
  throw new AppError(
    409,
    delta < 0 ? "Insufficient stock" : "Stock limit exceeded",
  );
}

module.exports = { list, create, get, update, remove, adjustStock };
