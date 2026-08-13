// Centralized error handler. Never leak stack traces, SQL, secrets, etc.
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  if (err && err.isApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // Unexpected error: log server-side only, return a generic message.
  console.error("[UNHANDLED ERROR]", err);
  return res.status(500).json({ success: false, message: "Internal server error" });
}

function notFoundMiddleware(req, res) {
  return res.status(404).json({ success: false, message: "Route not found" });
}

module.exports = { errorMiddleware, notFoundMiddleware };
