// middleware/roleCheckMiddleware.js
const ApiError = require('../utils/ApiError');

/**
 * Check if user has required role
 * @param {...String} roles - Allowed roles (e.g., 'SUPER_ADMIN', 'ADMIN')
 */
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    // Check against the role from JWT token (more secure)
    const userRole = req.user.tokenRole || req.user.role;

    if (!roles.includes(userRole)) {
      throw new ApiError(
        403,
        `Access denied. Required roles: ${roles.join(', ')}. Your role: ${userRole}`
      );
    }

    next();
  };
};

module.exports = checkRole;
