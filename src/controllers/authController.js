const authService = require("../services/authService");
const respond = require("../utils/respond");

async function register(req, res) {
  const account = await authService.register(req.body);
  return respond(res, 201, "Shop registered; awaiting approval", account);
}

async function login(req, res) {
  const data = await authService.login(req.body);
  return respond(res, 200, "Login successful", data);
}

function me(req, res) {
  return respond(
    res,
    200,
    "Account retrieved",
    authService.publicAccount(req.account),
  );
}

module.exports = { register, login, me };
