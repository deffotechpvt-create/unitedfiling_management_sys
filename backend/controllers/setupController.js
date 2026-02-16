// controllers/setupController.js
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    One-time Super Admin setup
 * @route   POST /api/setup/super-admin
 * @access  Public (but requires secret key)
 */
exports.setupSuperAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, setupKey } = req.body;

  // Verify setup key
  if (setupKey !== process.env.SUPER_ADMIN_SETUP_KEY) {
    throw new ApiError(403, 'Invalid setup key');
  }

  // Check if super admin already exists
  const existingSuperAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
  if (existingSuperAdmin) {
    throw new ApiError(400, 'Super Admin already exists. Setup is disabled.');
  }

  // Create Super Admin
  const superAdmin = await User.create({
    name,
    email,
    password,
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
  });

  res.status(201).json(
    new ApiResponse(201, {
      user: {
        id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
      },
      message: 'Super Admin created successfully'
    })
  );
});
