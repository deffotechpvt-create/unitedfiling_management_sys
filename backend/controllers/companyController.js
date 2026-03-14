const Company = require('../models/Company');
const Client = require('../models/Client');
const Compliance = require('../models/Compliance');
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

    // Pagination params
    const page = parseInt(req.query.page) || 1;
    const limitParams = req.query.limit;
    let limit;
    if (limitParams === 'all' || limitParams === '0') {
        limit = 0; // return all
    } else {
        limit = parseInt(limitParams) || 10; // default to 10
    }
    const skip = (page - 1) * limit;

    let filter = {};

    // ─── ROLE-BASED SCOPE (immutable base — cannot be overridden by query params) ───
    if (role === constants.ROLES.SUPER_ADMIN) {
        // SUPER_ADMIN sees all companies — no base filter
        // Optional: allow ?client= param to filter by specific client
        if (client && mongoose.Types.ObjectId.isValid(client)) {
            filter.client = client;
        }
    } else if (role === constants.ROLES.ADMIN) {
        // ADMIN sees ONLY companies belonging to their assigned clients
        const myClients = await Client.find({ assignedAdmin: userId }).select('_id');
        const myClientIds = myClients.map(c => c._id);

        // If a specific client is requested, validate it is in their assigned list
        if (client && mongoose.Types.ObjectId.isValid(client)) {
            const requestedClientId = new mongoose.Types.ObjectId(client);
            const isAssigned = myClientIds.some(id => id.equals(requestedClientId));
            if (!isAssigned) {
                // Requested client not assigned to this ADMIN — deny silently with empty set
                return res.status(200).json(
                    new ApiResponse(200, {
                        message: 'Companies fetched successfully',
                        companies: [],
                        count: 0,
                    })
                );
            }
            filter.client = requestedClientId; // Narrow to the specific requested assigned client
        } else {
            filter.client = { $in: myClientIds }; // All assigned clients
        }
    } else if (role === constants.ROLES.USER) {
        // USER sees ONLY companies where they are a member
        // USERs CANNOT filter by client — that would expose other users' companies
        filter['members.user'] = userId;
    } else {
        // Unknown role — deny access with empty result
        return res.status(200).json(
            new ApiResponse(200, { message: 'Companies fetched successfully', companies: [], count: 0 })
        );
    }

    // ─── ADDITIONAL FILTERS (only applied on top of role scope, never replace it) ───

    // Status filter (safe for all roles)
    if (status && Object.values(constants.STATUS).includes(status)) {
        filter.status = status;
    }

    // Search filter (safe for all roles)
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { registrationNumber: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const totalCount = await Company.countDocuments(filter);

    let companiesQuery = Company.find(filter)
        .populate('client', 'name companyName email phone status')
        .populate('members.user', 'name email role')
        .sort({ createdAt: -1 });

    if (limit > 0) {
        companiesQuery = companiesQuery.skip(skip).limit(limit);
    }

    const companies = await companiesQuery;

    return res.status(200).json(
        new ApiResponse(200, {
            message: 'Companies fetched successfully',
            companies,
            count: totalCount,
            totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
            currentPage: page,
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
    const { name, registrationNumber, email, phone, address, members } = req.body;
    let { client } = req.body;
    const { role, _id: userId } = req.user;

    let clientDoc = null;

    if (role === constants.ROLES.USER) {
        // Automatically find the client document belonging to the user
        clientDoc = await Client.findOne({ userId });
        if (!clientDoc) {
            // Lazy-create client record for the user if it doesn't exist
            clientDoc = await Client.create({
                userId,
                name: req.user.name,
                companyName: `${req.user.name}'s Group`,
                email: req.user.email,
                phone: req.user.phone,
                status: constants.CLIENT_STATUS.ACTIVE
            });
        }
        client = clientDoc._id; // Force payload to own client securely
    } else {
        // Validate specifically passed client for ADMIN/SUPER_ADMIN
        clientDoc = await Client.findById(client);
        if (!clientDoc) {
            throw new ApiError(404, 'Client not found');
        }

        // Authorization check for ADMIN
        if (role === constants.ROLES.ADMIN) {
            // ADMIN can only create companies for their assigned clients
            if (clientDoc.assignedAdmin?.toString() !== userId.toString()) {
                throw new ApiError(403, 'You can only create companies for your assigned clients');
            }
        }
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
        client,
        members: members || [],
    };

    if (registrationNumber) companyData.registrationNumber = registrationNumber;
    if (email) companyData.email = email;
    if (phone) companyData.phone = phone;
    if (address && Object.keys(address).length > 0) companyData.address = address;

    // Prevent duplicates in members assignment dynamically
    const hasOwnerAssigned = companyData.members.find(m => m.role === constants.COMPANY_ROLES.OWNER);

    // If USER is creating, add them as OWNER
    if (role === constants.ROLES.USER && !hasOwnerAssigned) {
        companyData.members.push({
            user: userId,
            role: constants.COMPANY_ROLES.OWNER,
        });
    } else if (!hasOwnerAssigned && clientDoc.userId) {
        // If an ADMIN/SUPER_ADMIN creates it for a client, add the client's underlying user as the OWNER
        companyData.members.push({
            user: clientDoc.userId,
            role: constants.COMPANY_ROLES.OWNER,
        });
    }

    const company = await Company.create(companyData);

    // ===========================================
    // AUTO-ASSIGN DEFAULT COMPLIANCES
    // ===========================================
    const defaultCompliances = [
        { serviceType: 'GST Filing', department: constants.DEPARTMENTS.GST, frequency: 'Monthly', days: 30, risk: constants.RISK_LEVELS.HIGH },
        { serviceType: 'TDS Filing', department: constants.DEPARTMENTS.TAX, frequency: 'Quarterly', days: 60, risk: constants.RISK_LEVELS.MEDIUM },
        { serviceType: 'Income Tax Return (ITR)', department: constants.DEPARTMENTS.TAX, frequency: 'Annual', days: 90, risk: constants.RISK_LEVELS.HIGH },
        { serviceType: 'ROC Annual Filing', department: constants.DEPARTMENTS.ROC, frequency: 'Annual', days: 120, risk: constants.RISK_LEVELS.MEDIUM }
    ];

    const compliancePromises = defaultCompliances.map(comp => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + comp.days);

        return Compliance.create({
            company: company._id,
            client: company.client,
            serviceType: comp.serviceType,
            department: comp.department,
            status: constants.COMPLIANCE_STATUS.PENDING,
            stage: constants.COMPLIANCE_STAGES.PAYMENT,
            risk: comp.risk,
            dueDate,
            isMandatory: true,
            createdBy: userId
        });
    });

    await Promise.all(compliancePromises);

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
    if (registrationNumber !== undefined) company.registrationNumber = registrationNumber || undefined;
    if (email !== undefined) company.email = email || undefined;
    if (phone !== undefined) company.phone = phone || undefined;
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
    const { role, _id: userId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid company ID');
    }

    const company = await Company.findById(id);
    if (!company) {
        throw new ApiError(404, 'Company not found');
    }

    // Role-based access validation
    if (role === constants.ROLES.SUPER_ADMIN) {
        // SUPER_ADMIN can delete any company
    } else if (role === constants.ROLES.ADMIN) {
        // ADMIN can delete only if company belongs to their assigned client
        const client = await Client.findById(company.client);
        if (!client || client.assignedAdmin?.toString() !== userId.toString()) {
            throw new ApiError(403, 'You do not have permission to delete this company');
        }
    } else if (role === constants.ROLES.USER) {
        throw new ApiError(403, 'Users are not permitted to delete companies. Please contact support.');
    } else {
        throw new ApiError(403, 'Not authorized to perform this action');
    }

    // Remove company from client's companies array
    await Client.findByIdAndUpdate(
        company.client,
        { $pull: { companies: id } }
    );

    await company.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, { message: 'Company deleted successfully' })
    );
});

/**
 * @desc    Get users that can be added as company members
 * @route   GET /api/companies/:id/members/addable-users
 * @access  Private (SUPER_ADMIN, ADMIN, OWNER)
 */
exports.getAddableUsers = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role, _id: currentUserId } = req.user;

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
        if (!client || client.assignedAdmin?.toString() !== currentUserId.toString()) {
            throw new ApiError(403, 'You can only manage members of your assigned clients');
        }
    }

    const existingMemberIds = company.members.map(m => m.user.toString());
    const User = mongoose.model('User');
    const users = await User.find({ _id: { $nin: existingMemberIds } })
        .select('name email role')
        .limit(100);

    return res.status(200).json(
        new ApiResponse(200, {
            users: users.map(u => ({ _id: u._id, id: u._id, name: u.name, email: u.email, role: u.role })),
            message: 'Users retrieved successfully',
        })
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
    if (role === constants.ROLES.ADMIN) {
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
    if (role === constants.ROLES.ADMIN) {
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
    if (role === constants.ROLES.ADMIN) {
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
