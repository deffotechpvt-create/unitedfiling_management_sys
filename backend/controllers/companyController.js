const Company = require('../models/Company');
const Client = require('../models/Client');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const constants = require('../config/constants');
const mongoose = require('mongoose');

/**
 * @desc    Get all companies (filtered by role)
 * @route   GET /api/companies
 * @access  Private (SUPER_ADMIN, ADMIN, USER)
 */
exports.getAllCompanies = asyncHandler(async (req, res) => {
    const { status, client, search } = req.query;
    const { role, _id: userId } = req.user;

    let filter = {};

    // Role-based filtering
    if (role === constants.ROLES.SUPER_ADMIN) {
        // SUPER_ADMIN sees all companies
    } else if (role === constants.ROLES.ADMIN) {
        // ADMIN sees companies of their assigned clients
        const clients = await Client.find({ assignedAdmin: userId }).select('_id');
        const clientIds = clients.map(c => c._id);
        filter.client = { $in: clientIds };
    } else if (role === constants.ROLES.USER) {
        // USER sees only companies where they are members
        filter['members.user'] = userId;
    }

    // Status filter
    if (status && Object.values(constants.STATUS).includes(status)) {
        filter.status = status;
    }

    // Client filter
    if (client && mongoose.Types.ObjectId.isValid(client)) {
        filter.client = client;
    }

    // Search filter
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { registrationNumber: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const companies = await Company.find(filter)
        .populate('client', 'name companyName email phone status')
        .populate('members.user', 'name email role')
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, {
            message: 'Companies fetched successfully',
            companies,
            count: companies.length,
        })
    );
});

/**
 * @desc    Get company by ID
 * @route   GET /api/companies/:id
 * @access  Private (SUPER_ADMIN, ADMIN, Member)
 */
exports.getCompanyById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role, _id: userId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid company ID');
    }

    const company = await Company.findById(id)
        .populate('client', 'name companyName email phone status assignedAdmin')
        .populate('members.user', 'name email role');

    if (!company) {
        throw new ApiError(404, 'Company not found');
    }

    // Authorization check
    if (role === constants.ROLES.USER) {
        const isMember = company.isMember(userId);
        if (!isMember) {
            throw new ApiError(403, 'You do not have access to this company');
        }
    } else if (role === constants.ROLES.ADMIN) {
        // Check if company belongs to admin's client
        const client = await Client.findById(company.client);
        if (!client || client.assignedAdmin?.toString() !== userId.toString()) {
            throw new ApiError(403, 'You do not have access to this company');
        }
    }

    return res.status(200).json(
        new ApiResponse(200, {
            message: 'Company fetched successfully',
            company,
        })
    );
});

/**
 * @desc    Create new company
 * @route   POST /api/companies
 * @access  Private (SUPER_ADMIN, ADMIN, USER)
 */
exports.createCompany = asyncHandler(async (req, res) => {
    const { name, registrationNumber, email, phone, address, client, members } = req.body;
    const { role, _id: userId } = req.user;

    // Validate client exists
    const clientDoc = await Client.findById(client);
    if (!clientDoc) {
        throw new ApiError(404, 'Client not found');
    }

    // Authorization check
    if (role === constants.ROLES.ADMIN) {
        // ADMIN can only create companies for their assigned clients
        if (clientDoc.assignedAdmin?.toString() !== userId.toString()) {
            throw new ApiError(403, 'You can only create companies for your assigned clients');
        }
    } else if (role === constants.ROLES.USER) {
        // USER can create companies (will be added as OWNER automatically)
        // No additional check needed
    }

    // Check if registration number already exists
    if (registrationNumber) {
        const existingCompany = await Company.findOne({ registrationNumber });
        if (existingCompany) {
            throw new ApiError(400, 'Company with this registration number already exists');
        }
    }

    const companyData = {
        name,
        registrationNumber,
        email,
        phone,
        address,
        client,
        members: members || [],
    };

    // If USER is creating, add them as OWNER
    if (role === constants.ROLES.USER) {
        companyData.members.push({
            user: userId,
            role: constants.COMPANY_ROLES.OWNER,
        });
    }

    const company = await Company.create(companyData);

    const populatedCompany = await Company.findById(company._id)
        .populate('client', 'name companyName email')
        .populate('members.user', 'name email role');

    return res.status(201).json(
        new ApiResponse(201, {
            message: 'Company created successfully',
            company: populatedCompany,
        })
    );
});

/**
 * @desc    Update company
 * @route   PUT /api/companies/:id
 * @access  Private (SUPER_ADMIN, ADMIN, OWNER)
 */
exports.updateCompany = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, registrationNumber, email, phone, address, status } = req.body;
    const { role, _id: userId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid company ID');
    }

    const company = await Company.findById(id);
    if (!company) {
        throw new ApiError(404, 'Company not found');
    }

    // Authorization check
    if (role === constants.ROLES.ADMIN) {
        const client = await Client.findById(company.client);
        if (!client || client.assignedAdmin?.toString() !== userId.toString()) {
            throw new ApiError(403, 'You can only update companies of your assigned clients');
        }
    } else if (role === constants.ROLES.USER) {
        const userRole = company.getUserRole(userId);
        if (userRole !== constants.COMPANY_ROLES.OWNER) {
            throw new ApiError(403, 'Only company owners can update company details');
        }
    }

    // Check registration number uniqueness
    if (registrationNumber && registrationNumber !== company.registrationNumber) {
        const existingCompany = await Company.findOne({ registrationNumber });
        if (existingCompany) {
            throw new ApiError(400, 'Company with this registration number already exists');
        }
    }

    // Update fields
    if (name) company.name = name;
    if (registrationNumber !== undefined) company.registrationNumber = registrationNumber;
    if (email !== undefined) company.email = email;
    if (phone !== undefined) company.phone = phone;
    if (address) company.address = { ...company.address, ...address };

    // Only SUPER_ADMIN can change status
    if (status && role === constants.ROLES.SUPER_ADMIN) {
        company.status = status;
    }

    await company.save();

    const updatedCompany = await Company.findById(id)
        .populate('client', 'name companyName email')
        .populate('members.user', 'name email role');

    return res.status(200).json(
        new ApiResponse(200, {
            message: 'Company updated successfully',
            company: updatedCompany,
        })
    );
});

/**
 * @desc    Delete company
 * @route   DELETE /api/companies/:id
 * @access  Private (SUPER_ADMIN only)
 */
exports.deleteCompany = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid company ID');
    }

    const company = await Company.findById(id);
    if (!company) {
        throw new ApiError(404, 'Company not found');
    }

    // Remove company from client's companies array
    await Client.findByIdAndUpdate(
        company.client,
        { $pull: { companies: id } }
    );

    await company.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, 'Company deleted successfully')
    );
});

/**
 * @desc    Add member to company
 * @route   POST /api/companies/:id/members
 * @access  Private (SUPER_ADMIN, ADMIN, OWNER)
 */
exports.addMember = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { userId: newUserId, role: memberRole } = req.body;
    const { role, _id: currentUserId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid company ID');
    }

    if (!mongoose.Types.ObjectId.isValid(newUserId)) {
        throw new ApiError(400, 'Invalid user ID');
    }

    const company = await Company.findById(id);
    if (!company) {
        throw new ApiError(404, 'Company not found');
    }

    // Authorization check
    if (role === constants.ROLES.USER) {
        const userRole = company.getUserRole(currentUserId);
        if (userRole !== constants.COMPANY_ROLES.OWNER) {
            throw new ApiError(403, 'Only company owners can add members');
        }
    } else if (role === constants.ROLES.ADMIN) {
        const client = await Client.findById(company.client);
        if (!client || client.assignedAdmin?.toString() !== currentUserId.toString()) {
            throw new ApiError(403, 'You can only manage members of your assigned clients');
        }
    }

    // Check if user exists
    const User = mongoose.model('User');
    const userExists = await User.findById(newUserId);
    if (!userExists) {
        throw new ApiError(404, 'User not found');
    }

    await company.addMember(newUserId, memberRole || constants.COMPANY_ROLES.VIEWER);

    const updatedCompany = await Company.findById(id)
        .populate('members.user', 'name email role');

    return res.status(200).json(
        new ApiResponse(200, {
            message: 'Member added successfully',
            company: updatedCompany,
        })
    );
});

/**
 * @desc    Remove member from company
 * @route   DELETE /api/companies/:id/members/:userId
 * @access  Private (SUPER_ADMIN, ADMIN, OWNER)
 */
exports.removeMember = asyncHandler(async (req, res) => {
    const { id, userId: memberUserId } = req.params;
    const { role, _id: currentUserId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberUserId)) {
        throw new ApiError(400, 'Invalid ID');
    }

    const company = await Company.findById(id);
    if (!company) {
        throw new ApiError(404, 'Company not found');
    }

    // Authorization check
    if (role === constants.ROLES.USER) {
        const userRole = company.getUserRole(currentUserId);
        if (userRole !== constants.COMPANY_ROLES.OWNER) {
            throw new ApiError(403, 'Only company owners can remove members');
        }
    } else if (role === constants.ROLES.ADMIN) {
        const client = await Client.findById(company.client);
        if (!client || client.assignedAdmin?.toString() !== currentUserId.toString()) {
            throw new ApiError(403, 'You can only manage members of your assigned clients');
        }
    }

    // Prevent removing the last owner
    const owners = company.members.filter(m => m.role === constants.COMPANY_ROLES.OWNER);
    const isOwner = company.getUserRole(memberUserId) === constants.COMPANY_ROLES.OWNER;
    if (isOwner && owners.length === 1) {
        throw new ApiError(400, 'Cannot remove the last owner of the company');
    }

    await company.removeMember(memberUserId);

    const updatedCompany = await Company.findById(id)
        .populate('members.user', 'name email role');

    return res.status(200).json(
        new ApiResponse(200, {
            message: 'Member removed successfully',
            company: updatedCompany,
        })
    );
});

/**
 * @desc    Update member role
 * @route   PATCH /api/companies/:id/members/:userId/role
 * @access  Private (SUPER_ADMIN, ADMIN, OWNER)
 */
exports.updateMemberRole = asyncHandler(async (req, res) => {
    const { id, userId: memberUserId } = req.params;
    const { role: newRole } = req.body;
    const { role, _id: currentUserId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberUserId)) {
        throw new ApiError(400, 'Invalid ID');
    }

    if (!Object.values(constants.COMPANY_ROLES).includes(newRole)) {
        throw new ApiError(400, 'Invalid company role');
    }

    const company = await Company.findById(id);
    if (!company) {
        throw new ApiError(404, 'Company not found');
    }

    // Authorization check
    if (role === constants.ROLES.USER) {
        const userRole = company.getUserRole(currentUserId);
        if (userRole !== constants.COMPANY_ROLES.OWNER) {
            throw new ApiError(403, 'Only company owners can update member roles');
        }
    } else if (role === constants.ROLES.ADMIN) {
        const client = await Client.findById(company.client);
        if (!client || client.assignedAdmin?.toString() !== currentUserId.toString()) {
            throw new ApiError(403, 'You can only manage members of your assigned clients');
        }
    }

    // Prevent downgrading the last owner
    const currentMemberRole = company.getUserRole(memberUserId);
    const owners = company.members.filter(m => m.role === constants.COMPANY_ROLES.OWNER);
    if (currentMemberRole === constants.COMPANY_ROLES.OWNER && owners.length === 1 && newRole !== constants.COMPANY_ROLES.OWNER) {
        throw new ApiError(400, 'Cannot change role of the last owner');
    }

    await company.updateMemberRole(memberUserId, newRole);

    const updatedCompany = await Company.findById(id)
        .populate('members.user', 'name email role');

    return res.status(200).json(
        new ApiResponse(200, {
            message: 'Member role updated successfully',
            company: updatedCompany,
        })
    );
});

/**
 * @desc    Get company statistics
 * @route   GET /api/companies/stats/overview
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
exports.getCompanyStats = asyncHandler(async (req, res) => {
    const { role, _id: userId } = req.user;

    let filter = {};

    // Role-based filtering
    if (role === constants.ROLES.ADMIN) {
        const clients = await Client.find({ assignedAdmin: userId }).select('_id');
        const clientIds = clients.map(c => c._id);
        filter.client = { $in: clientIds };
    }

    const [
        totalCompanies,
        activeCompanies,
        inactiveCompanies,
        companiesWithMembers,
    ] = await Promise.all([
        Company.countDocuments(filter),
        Company.countDocuments({ ...filter, status: constants.STATUS.ACTIVE }),
        Company.countDocuments({ ...filter, status: constants.STATUS.INACTIVE }),
        Company.countDocuments({ ...filter, 'members.0': { $exists: true } }),
    ]);

    const stats = {
        totalCompanies,
        activeCompanies,
        inactiveCompanies,
        companiesWithMembers,
        companiesWithoutMembers: totalCompanies - companiesWithMembers,
    };

    return res.status(200).json(
        new ApiResponse(200, {
            message: 'Company statistics fetched successfully',
            stats,
        })
    );
});
