function respond(res, status, message, data = null, extra = {}) {
  return res.status(status).json({ status, message, data, ...extra });
}

module.exports = respond;
