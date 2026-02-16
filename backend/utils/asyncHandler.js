/**
 * Async Handler Wrapper
 * Eliminates the need for try-catch in every async route handler
 * Automatically passes errors to Express error handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
