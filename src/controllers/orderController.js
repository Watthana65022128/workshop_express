const orderService = require("../services/orderService");
const respond = require("../utils/respond");

async function list(req, res) {
  const result = await orderService.list(req.account.id, req.query);
  return respond(res, 200, "Orders retrieved", result.data, {
    pagination: result.pagination,
  });
}

async function listForProduct(req, res) {
  const result = await orderService.listForProduct(
    req.account.id,
    req.params.id,
    req.query,
  );
  return respond(res, 200, "Product orders retrieved", result.data, {
    pagination: result.pagination,
  });
}

async function create(req, res) {
  const order = await orderService.create(
    req.account.id,
    req.params.id,
    req.body,
  );
  return respond(res, 201, "Order recorded", order);
}

module.exports = { list, listForProduct, create };
