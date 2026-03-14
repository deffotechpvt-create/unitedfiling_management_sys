const User = require('../models/User');
const Client = require('../models/Client');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const constants = require('../config/constants');

exports.getServerStats = asyncHandler(async (req, res) => {
  const uptimeSeconds = process.uptime();
  const uptimePercentage = 99.9; // You can calculate based on logs/monitoring service

  // Format uptime
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const serverData = {
    uptimeSeconds,
    uptimeFormatted: `${days}d ${hours}h ${minutes}m`,
    uptimePercentage,
    serverStartTime: new Date(Date.now() - uptimeSeconds * 1000).toISOString(),
  }
  res.status(200).json(
    new ApiResponse(200, {
      serverData
    })
  );
});
/**
 * @desc    Get all users (filtered by role)
 * @route   GET /api/users
 * @access  Private (SUPER_ADMIN only)
 */
exports.getAllUsers = asyncHandler(async (req, res) => {

  const users = await User.find({ role: constants.ROLES.USER })
    .select('name email status createdAt')
    .sort({ createdAt: -1 });
  const sanitizedUsers = users.map(u => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    status: u.status,        // or u.isActive ? 'ACTIVE' : 'INACTIVE'
    createdAt: u.createdAt, // format on frontend if needed
  }));
  res.status(200).json(
    new ApiResponse(200, {
      users: sanitizedUsers,
      count: users.length,
      message: 'Users retrieved successfully'
    })
  );
});

/**
 * @desc    Get admins for compliance assignment (minimal list)
 * @route   GET /api/users/admins/for-assignment
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
exports.getAdminsForAssignment = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: constants.ROLES.ADMIN })
    .select('name email')
    .sort({ name: 1 });
  res.status(200).json(
    new ApiResponse(200, {
      admins: admins.map(a => ({ _id: a._id, id: a._id, name: a.name, email: a.email })),
      message: 'Admins retrieved for assignment'
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
  const { company: companyId } = req.query;
  const { role: userRole } = req.user;

  const adminsWithUtilization = await Promise.all(
    admins.map(async (admin) => {
      const clientFilter = { assignedAdmin: admin._id };
      if (companyId) {
        // Find clients that have this company associated
        clientFilter.companies = companyId;
      }

      const clientCount = await Client.countDocuments(clientFilter);

      const clients = await Client.find(clientFilter)
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
      count: adminsWithUtilization.length,
      message: 'Admins retrieved successfully'
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
    status: 'ACTIVE',
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
      },
      message: 'User retrieved successfully'
    })
  );
});

/**
 * @desc    Update user status (activate/deactivate)
 * @route   PATCH /api/users/:id/status
 * @access  Private (SUPER_ADMIN only)
 */
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

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
  if (user.role === constants.ROLES.ADMIN && status === 'INACTIVE') {
    const assignedClientsCount = await Client.countDocuments({
      assignedAdmin: user._id,
      status: constants.STATUS.ACTIVE
    });

    if (assignedClientsCount > 0) {
      throw new ApiError(
        400,
        `Cannot deactivate admin. They have ${assignedClientsCount} active client${assignedClientsCount > 1 ? 's' : ''} assigned. Please reassign or remove clients first.`
      );
    }
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
      message: `${user.role} ${status === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`
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

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json(
    new ApiResponse(200, { message: 'User deleted successfully' })
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

  const { company: companyId } = req.query;
  const clientFilter = { assignedAdmin: admin._id };
  if (companyId) {
    clientFilter.companies = companyId;
  }

  const clients = await Client.find(clientFilter)

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
    new ApiResponse(200, {
      ...utilization,
      message: 'Admin utilization retrieved successfully'
    })
  );
});
