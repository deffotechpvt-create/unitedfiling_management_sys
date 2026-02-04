// validators/userValidator.js
const Joi = require('joi');

/**
 * Validation schema for creating admin user
 */
exports.createAdminSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required',
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required',
    }),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Phone must be a valid 10-digit number',
    }),
});

/**
 * Validation schema for updating user status
 */
exports.updateUserStatusSchema = Joi.object({
  status: Joi.string()
    .valid('ACTIVE', 'INACTIVE')
    .required()
    .messages({
      'any.only': 'Status must be either ACTIVE or INACTIVE',
      'any.required': 'Status is required',
    }),
});
