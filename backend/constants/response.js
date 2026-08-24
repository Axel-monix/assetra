function success(res, { message = "OK", data = null, statusCode = 200 } = {}) {
  return res.status(statusCode).json({ success: true, message, data });
}

function error(res, { message = "Terjadi kesalahan pada server.", statusCode = 500, data = null } = {}) {
  return res.status(statusCode).json({ success: false, message, data });
}

module.exports = { success, error };