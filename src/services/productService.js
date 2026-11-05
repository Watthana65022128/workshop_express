const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const { fields, string, integer, objectId } = require("../utils/validate");
const { toMinorUnits } = require("../utils/money");

function productInput(input, create = false) {
  const required = create ? ["name", "price", "stock"] : [];
  const body = fields(
    input,
    ["name", "description", "price", "stock"],
    required,
  );
  if (!create && Object.keys(body).length === 0)
    throw new AppError(400, "At least one field is required");
  const result = {};
  if ("name" in body) result.name = string(body.name, "name", 2, 120);
  if ("description" in body)
    result.description = string(body.description, "description", 0, 1000);
  if ("price" in body) {
    toMinorUnits(body.price);
    result.price = body.price;
  }
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

module.exports = { list, create, get, update, remove };
