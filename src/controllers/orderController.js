const orderService = require("../services/orderService");
const respond = require("../utils/respond");

async function list(req, res) {
  const orders = await orderService.list(req.account.id);
  return respond(res, 200, "Orders retrieved", orders);
}

async function listForProduct(req, res) {
  const orders = await orderService.listForProduct(req.account.id, req.params.id);
  return respond(res, 200, "Product orders retrieved", orders);
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
