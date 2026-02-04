// controllers/userController.js
const User = require('../models/User');
const Client = require('../models/Client');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const constants = require('../config/constants');

/**
 * @desc    Get all users (filtered by role)
 * @route   GET /api/users
 * @access  Private (SUPER_ADMIN only)
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { role, status } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status; // ✅ Changed from isActive to status

  const users = await User.find(filter)
    .select('-password') // ✅ Exclude password
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, {
      users,
      count: users.length
    })
  );
});

/**
 * @desc    Get all admins with utilization
 * @route   GET /api/users/admins
 * @access  Private (SUPER_ADMIN only)
 */
exports.getAllAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: constants.ROLES.ADMIN })
    .select('-password')
    .sort({ createdAt: -1 });

  // Get client counts for each admin
  const adminsWithUtilization = await Promise.all(
    admins.map(async (admin) => {
      const clientCount = await Client.countDocuments({
        assignedAdmin: admin._id
      });

      const clients = await Client.find({ assignedAdmin: admin._id })
        .select('name companyName pendingWork completedWork');

      const totalPending = clients.reduce((sum, c) => sum + (c.pendingWork || 0), 0);
      const totalCompleted = clients.reduce((sum, c) => sum + (c.completedWork || 0), 0);

      return {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        status: admin.status,
        createdAt: admin.createdAt,
        utilization: {
          clientCount,
          maxClients: constants.MAX_CLIENTS_PER_ADMIN,
          availableSlots: constants.MAX_CLIENTS_PER_ADMIN - clientCount,
          isAtCapacity: clientCount >= constants.MAX_CLIENTS_PER_ADMIN,
          totalPendingWork: totalPending,
          totalCompletedWork: totalCompleted,
        },
      };
    })
  );

  res.status(200).json(
    new ApiResponse(200, {
      admins: adminsWithUtilization,
      count: adminsWithUtilization.length
    })
  );
});

/**
 * @desc    Create admin user
 * @route   POST /api/users/admins
 * @access  Private (SUPER_ADMIN only)
 */
exports.createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'User already exists with this email');
  }

  // Create admin user
  const admin = await User.create({
    name,
    email,
    password,
    phone,
    role: constants.ROLES.ADMIN,
    status: 'ACTIVE', // ✅ Set default status
  });

  res.status(201).json(
    new ApiResponse(201, {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        status: admin.status,
      },
      message: 'Admin created successfully'
    })
  );
});

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private (SUPER_ADMIN only)
 */
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // If admin, get their clients
  let clients = [];
  if (user.role === constants.ROLES.ADMIN) {
    clients = await Client.find({ assignedAdmin: user._id })
      .select('name companyName pendingWork completedWork status');
  }

  res.status(200).json(
    new ApiResponse(200, {
      user: {
        ...user.toObject(),
        clients: clients.length > 0 ? clients : undefined,
      }
    })
  );
});

/**
 * @desc    Update user status (activate/deactivate)
 * @route   PATCH /api/users/:id/status
 * @access  Private (SUPER_ADMIN only)
 */
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // ✅ Changed from isActive to status

  // Validate status
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    throw new ApiError(400, 'Invalid status. Must be ACTIVE or INACTIVE');
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Don't allow deactivating SUPER_ADMIN
  if (user.role === constants.ROLES.SUPER_ADMIN && status === 'INACTIVE') {
    throw new ApiError(403, 'Cannot deactivate super admin user');
  }

  user.status = status;
  
  await user.save();

  res.status(200).json(
    new ApiResponse(200, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
      message: `User ${status === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`
    })
  );
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private (SUPER_ADMIN only)
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Don't allow deleting SUPER_ADMIN
  if (user.role === constants.ROLES.SUPER_ADMIN) {
    throw new ApiError(403, 'Cannot delete super admin user');
  }

  // Check if admin has assigned clients
  if (user.role === constants.ROLES.ADMIN) {
    const clientCount = await Client.countDocuments({ assignedAdmin: user._id });
    if (clientCount > 0) {
      throw new ApiError(400, `Cannot delete admin with ${clientCount} assigned clients. Please reassign clients first.`);
    }
  }

  await User.findByIdAndDelete(req.params.id); // ✅ Changed from user.remove()

  res.status(200).json(
    new ApiResponse(200, 'User deleted successfully')
  );
});

/**
 * @desc    Get admin utilization/workload
 * @route   GET /api/users/admins/:id/utilization
 * @access  Private (SUPER_ADMIN only)
 */
exports.getAdminUtilization = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.params.id).select('-password');

  if (!admin) {
    throw new ApiError(404, 'Admin not found');
  }

  if (admin.role !== constants.ROLES.ADMIN) {
    throw new ApiError(400, 'User is not an admin');
  }

  const clients = await Client.find({ assignedAdmin: admin._id })
    .select('name companyName pendingWork completedWork status email phone');

  const clientCount = clients.length;
  const totalPending = clients.reduce((sum, c) => sum + (c.pendingWork || 0), 0);
  const totalCompleted = clients.reduce((sum, c) => sum + (c.completedWork || 0), 0);

  const utilization = {
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      status: admin.status,
    },
    clientCount,
    maxClients: constants.MAX_CLIENTS_PER_ADMIN,
    availableSlots: constants.MAX_CLIENTS_PER_ADMIN - clientCount,
    isAtCapacity: clientCount >= constants.MAX_CLIENTS_PER_ADMIN,
    utilizationPercentage: Math.round((clientCount / constants.MAX_CLIENTS_PER_ADMIN) * 100),
    totalPendingWork: totalPending,
    totalCompletedWork: totalCompleted,
    clients,
  };

  res.status(200).json(
    new ApiResponse(200, utilization)
  );
});
