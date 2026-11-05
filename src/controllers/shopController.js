const shopService = require("../services/shopService");
const respond = require("../utils/respond");

async function listPending(req, res) {
  const result = await shopService.listPending(req.query);
  return respond(res, 200, "Pending shops retrieved", result.data, {
    pagination: result.pagination,
  });
}

async function approve(req, res) {
  const account = await shopService.approve(req.params.id);
  return respond(res, 200, "Shop approved", account);
}

module.exports = { listPending, approve };
