const AppError = require("../utils/AppError");
const respond = require("../utils/respond");

function notFound(req, res, next) {
  next(new AppError(404, "Endpoint not found"));
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof AppError)
    return respond(res, error.status, error.message);
  if (error.code === 11000)
    return respond(res, 409, "Email already registered");
  if (error.name === "ValidationError" || error.name === "CastError") {
    return respond(res, 400, error.message);
  }
  if (error.type === "entity.parse.failed")
    return respond(res, 400, "Invalid JSON");
  if (error.type === "entity.too.large")
    return respond(res, 413, "Request body too large");

  console.error(error);
  return respond(res, 500, "Internal server error");
}

module.exports = { notFound, errorHandler };
