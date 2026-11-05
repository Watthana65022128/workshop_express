const productService = require("../services/productService");
const respond = require("../utils/respond");

async function list(req, res) {
  const result = await productService.list(req.account.id, req.query);
  return respond(res, 200, "Products retrieved", result.data, {
    pagination: result.pagination,
  });
}

async function create(req, res) {
  const product = await productService.create(req.account.id, req.body);
  return respond(res, 201, "Product created", product);
}

async function get(req, res) {
  const product = await productService.get(req.account.id, req.params.id);
  return respond(res, 200, "Product retrieved", product);
}

async function update(req, res) {
  const product = await productService.update(
    req.account.id,
    req.params.id,
    req.body,
  );
  return respond(res, 200, "Product updated", product);
}

async function remove(req, res) {
  const product = await productService.remove(req.account.id, req.params.id);
  return respond(res, 200, "Product archived", product);
}

async function adjustStock(req, res) {
  const product = await productService.adjustStock(
    req.account.id,
    req.params.id,
    req.body,
  );
  return respond(res, 200, "Stock adjusted", product);
}

module.exports = { list, create, get, update, remove, adjustStock };
