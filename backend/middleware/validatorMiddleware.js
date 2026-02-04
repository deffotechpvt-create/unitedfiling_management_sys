// middleware/validatorMiddleware.js
const ApiError = require('../utils/ApiError');

/**
 * Validate request using Joi schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        // Validate request body against schema
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Return all errors, not just the first one
            stripUnknown: true, // Remove unknown fields
        });

        if (error) {
            // Extract error messages
            const errorMessages = error.details.map((detail) => detail.message);

            // Throw validation error
            throw new ApiError(400, 'Validation failed', errorMessages);
        }

        // Replace req.body with validated and sanitized value
        req.body = value;

        next();
    };
};

module.exports = { validateRequest };
