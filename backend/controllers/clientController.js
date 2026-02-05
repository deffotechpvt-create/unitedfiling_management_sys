const Client = require('../models/Client');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const constants = require('../config/constants');
const { sendEmail } = require('../config/email');
const { clientAssignedEmail } = require('../utils/emailTemplates');

/**
 * @desc    Get all clients
 * @route   GET /api/clients
 * @access  Private (SUPER_ADMIN: all, ADMIN: assigned only)
 */
exports.getAllClients = asyncHandler(async (req, res) => {
    let filter = {};

    // ADMIN can only see their assigned clients
    if (req.user.role === constants.ROLES.ADMIN) {
        filter.assignedAdmin = req.user._id;
    }

    const { status, assignedAdmin } = req.query;

    if (status) filter.status = status;
    if (assignedAdmin && req.user.role === constants.ROLES.SUPER_ADMIN) {
        filter.assignedAdmin = assignedAdmin;
    }

    const clients = await Client.find(filter)
        .populate('assignedAdmin', 'name email')
        .populate('companies', 'name registrationNumber')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, { clients, count: clients.length }, 'Clients retrieved successfully')
    );
});

/**
 * @desc    Create new client
 * @route   POST /api/clients
 * @access  Private (SUPER_ADMIN only)
 */
exports.createClient = asyncHandler(async (req, res) => {
    const { name, companyName, email, phone, userId, assignedAdmin } = req.body;

    // Check if email already exists
    if (email) {
        const existingClient = await Client.findOne({ email });
        if (existingClient) {
            throw new ApiError(400, 'Client with this email already exists');
        }
    }

    // Create client
    const client = await Client.create({
        name,
        companyName,
        email,
        phone,
        userId,
        assignedAdmin: assignedAdmin || null,
    });

    // If assigned to admin, send notification email
    if (assignedAdmin) {
        const admin = await User.findById(assignedAdmin);
        if (admin && admin.email) {
            sendEmail({
                to: admin.email,
                ...clientAssignedEmail(admin.name, client.name),
            }).catch(err => console.error('Error sending assignment email:', err));
        }
    }

    const populatedClient = await Client.findById(client._id)
        .populate('assignedAdmin', 'name email')
        .populate('userId', 'name email');

    res.status(201).json(
        new ApiResponse(201, { client: populatedClient }, 'Client created successfully')
    );
});

/**
 * @desc    Get single client by ID
 * @route   GET /api/clients/:id
 * @access  Private (SUPER_ADMIN: all, ADMIN: assigned only)
 */
exports.getClientById = asyncHandler(async (req, res) => {
    const client = await Client.findById(req.params.id)
        .populate('assignedAdmin', 'name email')
        .populate('companies', 'name registrationNumber email phone')
        .populate('userId', 'name email');

    if (!client) {
        throw new ApiError(404, 'Client not found');
    }

    // ADMIN can only view their assigned clients
    if (req.user.role === constants.ROLES.ADMIN) {
        if (!client.assignedAdmin || client.assignedAdmin._id.toString() !== req.user._id.toString()) {
            throw new ApiError(403, 'Not authorized to view this client');
        }
    }

    res.status(200).json(
        new ApiResponse(200, { client }, 'Client retrieved successfully')
    );
});

/**
 * @desc    Update client
 * @route   PUT /api/clients/:id
 * @access  Private (SUPER_ADMIN only)
 */
exports.updateClient = asyncHandler(async (req, res) => {
    const { name, companyName, email, phone, status } = req.body;

    const client = await Client.findById(req.params.id);

    if (!client) {
        throw new ApiError(404, 'Client not found');
    }

    // Update fields
    if (name) client.name = name;
    if (companyName) client.companyName = companyName;
    if (email) client.email = email;
    if (phone) client.phone = phone;
    if (status) client.status = status;

    await client.save();

    const updatedClient = await Client.findById(client._id)
        .populate('assignedAdmin', 'name email')
        .populate('companies', 'name');

    res.status(200).json(
        new ApiResponse(200, { client: updatedClient }, 'Client updated successfully')
    );
});

/**
 * @desc    Delete client
 * @route   DELETE /api/clients/:id
 * @access  Private (SUPER_ADMIN only)
 */
exports.deleteClient = asyncHandler(async (req, res) => {
    const client = await Client.findById(req.params.id);

    if (!client) {
        throw new ApiError(404, 'Client not found');
    }

    // Unassign from admin first
    if (client.assignedAdmin) {
        await client.unassign();
    }

    await client.remove();

    res.status(200).json(
        new ApiResponse(200, null, 'Client deleted successfully')
    );
});

/**
 * @desc    Assign client to admin
 * @route   POST /api/clients/:id/assign
 * @access  Private (SUPER_ADMIN only)
 */
exports.assignClient = asyncHandler(async (req, res) => {
    const { adminId } = req.body;

    if (!adminId) {
        throw new ApiError(400, 'Admin ID is required');
    }

    const client = await Client.findById(req.params.id);

    if (!client) {
        throw new ApiError(404, 'Client not found');
    }

    const admin = await User.findById(adminId);

    if (!admin) {
        throw new ApiError(404, 'Admin not found');
    }

    if (admin.role !== constants.ROLES.ADMIN) {
        throw new ApiError(400, 'User is not an admin');
    }

    // Check if admin has capacity
    if (!admin.canAddClient()) {
        throw new ApiError(400, `Admin has reached maximum capacity of ${constants.MAX_CLIENTS_PER_ADMIN} clients`);
    }

    // Unassign from previous admin if exists
    if (client.assignedAdmin && client.assignedAdmin.toString() !== adminId) {
        await client.unassign();
    }

    // Assign to new admin
    await client.assignToAdmin(adminId);

    // Send notification email
    if (admin.email) {
        sendEmail({
            to: admin.email,
            ...clientAssignedEmail(admin.name, client.name),
        }).catch(err => console.error('Error sending assignment email:', err));
    }

    const updatedClient = await Client.findById(client._id)
        .populate('assignedAdmin', 'name email');

    res.status(200).json(
        new ApiResponse(200, { client: updatedClient }, 'Client assigned successfully')
    );
});

/**
 * @desc    Unassign client from admin
 * @route   POST /api/clients/:id/unassign
 * @access  Private (SUPER_ADMIN only)
 */
exports.unassignClient = asyncHandler(async (req, res) => {
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
        new ApiResponse(200, { client: updatedClient }, 'Client unassigned successfully')
    );
});

/**
 * @desc    Get unassigned clients
 * @route   GET /api/clients/unassigned
 * @access  Private (SUPER_ADMIN only)
 */
exports.getUnassignedClients = asyncHandler(async (req, res) => {
    const clients = await Client.findUnassigned()
        .populate('userId', 'name email')
        .populate('companies', 'name');

    res.status(200).json(
        new ApiResponse(200, { clients, count: clients.length }, 'Unassigned clients retrieved successfully')
    );
});
