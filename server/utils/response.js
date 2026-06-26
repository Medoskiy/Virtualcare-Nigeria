function sendSuccess(res, data = {}, message = '', status = 200) {
  return res.status(status).json({ success: true, data, message, errors: null });
}

function sendError(res, message, status = 400, errors = null) {
  return res.status(status).json({ success: false, data: null, message, errors });
}

module.exports = { sendSuccess, sendError };
