const Client = require('../models/Client');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const constants = require('../config/constants');

/**
 * @desc    Get all clients
 * @route   GET /api/clients
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
const getAllClients = asyncHandler(async (req, res) => {
    const { status, assignedAdmin, search } = req.query;

    // Build query
    let query = {};

    // Filter by status
    if (status) {
        query.status = status;
    }

    // Filter by assigned admin
    if (assignedAdmin) {
        if (assignedAdmin === 'unassigned') {
            query.assignedAdmin = null;
        } else {
            query.assignedAdmin = assignedAdmin;
        }
    }

    // If user is ADMIN, only show their clients
    if (req.user.role === constants.ROLES.ADMIN) {
        query.assignedAdmin = req.user._id;
    }

    // Search by name, company, email, phone
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { companyName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
        ];
    }

    const clients = await Client.find(query)
        .populate('assignedAdmin', 'name email')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, {
            clients,
            message: 'Clients retrieved successfully'
        })
    );
});

/**
 * @desc    Get single client by ID
 * @route   GET /api/clients/:id
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
const getClientById = asyncHandler(async (req, res) => {
    const client = await Client.findById(req.params.id)
        .populate('assignedAdmin', 'name email phone')
        .populate('userId', 'name email')
        .populate('companies');

    if (!client) {
        throw new ApiError(404, 'Client not found');
    }

    // If ADMIN, can only view their own clients
    if (req.user.role === constants.ROLES.ADMIN) {
        if (!client.assignedAdmin || client.assignedAdmin._id.toString() !== req.user._id.toString()) {
            throw new ApiError(403, 'Not authorized to view this client');
        }
    }

    res.status(200).json(
        new ApiResponse(200, {
            client,
            message: 'Client retrieved successfully'
        })
    );
});

/**
 * @desc    Create new client
 * @route   POST /api/clients
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
const createClient = asyncHandler(async (req, res) => {
    const { name, companyName, email, phone, assignedAdmin } = req.body;

    // Check if email already exists
    if (email) {
        const existingClient = await Client.findOne({ email });
        if (existingClient) {
            throw new ApiError(400, 'Client with this email already exists');
        }
    }

    // If ADMIN creates client, auto-assign to themselves
    let adminToAssign = assignedAdmin;
    if (req.user.role === constants.ROLES.ADMIN) {
        adminToAssign = req.user._id;
    }

    // Validate admin if provided
    if (adminToAssign) {
        const admin = await User.findById(adminToAssign);
        if (!admin || admin.role !== constants.ROLES.ADMIN) {
            throw new ApiError(400, 'Invalid admin ID');
        }

        // Check admin capacity
        const clientCount = await Client.countDocuments({ assignedAdmin: adminToAssign });
        if (clientCount >= constants.MAX_CLIENTS_PER_ADMIN) {
            throw new ApiError(400, `Admin has reached maximum capacity of ${constants.MAX_CLIENTS_PER_ADMIN} clients`);
        }
    }

    const client = await Client.create({
        name,
        companyName,
        email,
        phone,
        assignedAdmin: adminToAssign,
    });

    const populatedClient = await Client.findById(client._id)
        .populate('assignedAdmin', 'name email');

    res.status(201).json(
        new ApiResponse(201, {
            client: populatedClient,
            message: 'Client created successfully'
        })
    );
});

/**
 * @desc    Update client
 * @route   PUT /api/clients/:id
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
const updateClient = asyncHandler(async (req, res) => {
    const client = await Client.findById(req.params.id);

    if (!client) {
        throw new ApiError(404, 'Client not found');
    }

    // If ADMIN, can only update their own clients
    if (req.user.role === constants.ROLES.ADMIN) {
        if (!client.assignedAdmin || client.assignedAdmin.toString() !== req.user._id.toString()) {
            throw new ApiError(403, 'Not authorized to update this client');
        }
        // ADMIN cannot change assignedAdmin
        delete req.body.assignedAdmin;
    }

    // Check email uniqueness if updating
    if (req.body.email && req.body.email !== client.email) {
        const existingClient = await Client.findOne({ email: req.body.email });
        if (existingClient) {
            throw new ApiError(400, 'Client with this email already exists');
        }
    }

    // Update fields
    const allowedFields = ['name', 'companyName', 'email', 'phone', 'status', 'assignedAdmin'];
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            client[field] = req.body[field];
        }
    });

    await client.save();

    const updatedClient = await Client.findById(client._id)
        .populate('assignedAdmin', 'name email');

    res.status(200).json(
        new ApiResponse(200, {
            client: updatedClient,
            message: 'Client updated successfully'
        })
    );
});

/**
 * @desc    Delete client
 * @route   DELETE /api/clients/:id
 * @access  Private (SUPER_ADMIN only)
 */
const deleteClient = asyncHandler(async (req, res) => {
    const client = await Client.findById(req.params.id);

    if (!client) {
        throw new ApiError(404, 'Client not found');
    }

    // Remove from admin's managedClients if assigned
    if (client.assignedAdmin) {
        await User.findByIdAndUpdate(
            client.assignedAdmin,
            { $pull: { managedClients: client._id } }
        );
    }

    await Client.findByIdAndDelete(req.params.id);

    res.status(200).json(
        new ApiResponse(200, {
            message: 'Client deleted successfully'
        })
    );
});

/**
 * @desc    Assign client to admin
 * @route   POST /api/clients/:id/assign
 * @access  Private (SUPER_ADMIN only)
 */
const assignClientToAdmin = asyncHandler(async (req, res) => {
    const { adminId } = req.body;

    const client = await Client.findById(req.params.id);
    if (!client) {
        throw new ApiError(404, 'Client not found');
    }

    // Validate admin
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== constants.ROLES.ADMIN) {
        throw new ApiError(400, 'Invalid admin ID or user is not an admin');
    }

    // Check admin capacity
    const clientCount = await Client.countDocuments({
        assignedAdmin: adminId,
        _id: { $ne: client._id } // Exclude current client
    });

    if (clientCount >= constants.MAX_CLIENTS_PER_ADMIN) {
        throw new ApiError(400, `Admin has reached maximum capacity of ${constants.MAX_CLIENTS_PER_ADMIN} clients`);
    }

    // Remove from old admin if exists
    if (client.assignedAdmin) {
        await User.findByIdAndUpdate(
            client.assignedAdmin,
            { $pull: { managedClients: client._id } }
        );
    }

    // Assign to new admin
    await client.assignToAdmin(adminId);

    const updatedClient = await Client.findById(client._id)
        .populate('assignedAdmin', 'name email');

    res.status(200).json(
        new ApiResponse(200, {
            client: updatedClient,
            message: 'Client assigned successfully'
        })
    );
});

/**
 * @desc    Unassign client from admin
 * @route   POST /api/clients/:id/unassign
 * @access  Private (SUPER_ADMIN only)
 */
const unassignClient = asyncHandler(async (req, res) => {
    const client = await Client.findById(req.params.id);

    if (!client) {
        throw new ApiError(404, 'Client not found');
    }

    if (!client.assignedAdmin) {
        throw new ApiError(400, 'Client is not assigned to any admin');
    }

    await client.unassign();

    const updatedClient = await Client.findById(client._id);

    res.status(200).json(
        new ApiResponse(200, {
            client: updatedClient,
            message: 'Client unassigned successfully'
        })
    );
});

/**
 * @desc    Get unassigned clients
 * @route   GET /api/clients/unassigned/list
 * @access  Private (SUPER_ADMIN only)
 */
const getUnassignedClients = asyncHandler(async (req, res) => {
    const clients = await Client.findUnassigned()
        .sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, {
            clients,
            count: clients.length,
            message: 'Unassigned clients retrieved successfully'
        })
    );
});

/**
 * @desc    Get client statistics
 * @route   GET /api/clients/stats/overview
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
const getClientStats = asyncHandler(async (req, res) => {
    let query = {};

    // If ADMIN, only their clients
    if (req.user.role === constants.ROLES.ADMIN) {
        query.assignedAdmin = req.user._id;
    }

    const totalClients = await Client.countDocuments(query);
    const activeClients = await Client.countDocuments({ ...query, status: constants.CLIENT_STATUS.ACTIVE });
    const inactiveClients = await Client.countDocuments({ ...query, status: constants.CLIENT_STATUS.INACTIVE });
    const unassignedClients = await Client.countDocuments({ ...query, assignedAdmin: null });

    // Work statistics
    const clients = await Client.find(query);
    const totalPendingWork = clients.reduce((sum, c) => sum + c.pendingWork, 0);
    const totalCompletedWork = clients.reduce((sum, c) => sum + c.completedWork, 0);

    res.status(200).json(
        new ApiResponse(200, {
            stats: {
                totalClients,
                activeClients,
                inactiveClients,
                unassignedClients,
                totalPendingWork,
                totalCompletedWork,
                totalWork: totalPendingWork + totalCompletedWork,
            },
            message: 'Client statistics retrieved successfully'
        })
    );
});

module.exports = {
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    assignClientToAdmin,
    unassignClient,
    getUnassignedClients,
    getClientStats,
};
