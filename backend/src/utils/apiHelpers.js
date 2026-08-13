// Wraps an async Express handler so thrown errors reach the centralized
// error middleware instead of crashing the process or hanging the request.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// A structured, expected application error. Anything thrown that is NOT an
// ApiError is treated as unexpected and reported as a generic 500 so that
// internals (stack traces, SQL errors, etc.) are never leaked to clients.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isApiError = true;
  }
}

function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ success: false, message });
}

module.exports = { asyncHandler, ApiError, sendSuccess, sendError };
