const Compliance = require('../models/Compliance');
const ComplianceTemplate = require('../models/ComplianceTemplate');
const Company = require('../models/Company');
const Client = require('../models/Client');
const User = require('../models/User');
const constants = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const mongoose = require('mongoose');
const statusHelper = require('../utils/statusHelper');

// ─────────────────────────────────────────────────────────────────────────────
// SCOPE HELPERS — reusable across controller functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves authorized company IDs for the calling ADMIN.
 * Uses Company.find({client: {$in: ...}}) rather than c.companies array
 * to avoid fragile denormalized data.
 */
async function getAdminAuthorizedCompanyIds(adminUserId) {
    const myClients = await Client.find({ assignedAdmin: adminUserId }).select('_id');
    const myClientIds = myClients.map(c => c._id);
    const myCompanies = await Company.find({ client: { $in: myClientIds } }).select('_id');
    return myCompanies.map(c => c._id.toString());
}

/**
 * Resolves authorized company IDs for the calling USER (member-based).
 */
async function getUserAuthorizedCompanyIds(userId) {
    const myCompanies = await Company.find({ 'members.user': userId }).select('_id');
    return myCompanies.map(c => c._id.toString());
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get all compliances with filters
 * @route   GET /api/compliances
 * @access  Private (SUPER_ADMIN=all, ADMIN=assigned-client scope, USER=member-company scope)
 */
exports.getAllCompliances = asyncHandler(async (req, res) => {
    const { role, _id: userId } = req.user;
    const { company, status, stage, department, category, search } = req.query;
    let query = {};

    // ── ROLE-BASED SCOPE (immutable base) ────────────────────────────────────
    if (role === constants.ROLES.SUPER_ADMIN) {
        // SUPER_ADMIN sees all; optional company filter
        if (company && mongoose.Types.ObjectId.isValid(company)) {
            query.company = company;
        }
    } else if (role === constants.ROLES.ADMIN) {
        // ADMIN sees strictly their own tasks (assigned or created)
        const scopeFilter = {
            $or: [
                { assignedTo: userId },
                { createdBy: userId }
            ]
        };

        if (company && mongoose.Types.ObjectId.isValid(company)) {
            query.$and = [
                scopeFilter,
                { company: company }
            ];
        } else {
            // Use $and to ensure the scope filter isn't overwritten by subsequent search/status filters
            query.$and = [scopeFilter];
        }
    } else if (role === constants.ROLES.USER) {
        const authorizedIds = await getUserAuthorizedCompanyIds(userId);

        if (company) {
            if (!authorizedIds.includes(company)) {
                throw new ApiError(403, 'You do not have access to this company\'s compliances');
            }
            query.company = company;
        } else {
            query.company = { $in: authorizedIds };
        }
    } else {
        // Unknown role — fail safe
        throw new ApiError(403, 'Access denied');
    }

    // ── ADDITIONAL FILTERS (applied on top of scope, never replace it) ────────
    if (status) {
        query.status = status;
    }
    if (stage) {
        query.stage = stage;
    }
    if (department) {
        query.department = department;
    }
    if (category) {
        query.category = Array.isArray(category) ? { $in: category } : category;
    }

    // ── TAB-SPECIFIC FILTERS (from frontend) ─────────────────────────────────
    const { tab } = req.query;
    if (tab && tab !== "All") {
        switch (tab) {
            case "Pending":
                query.status = constants.COMPLIANCE_STATUS.PENDING;
                break;
            case "Needs action":
                query.status = constants.COMPLIANCE_STATUS.NEEDS_ACTION;
                break;
            case "In progress":
                query.status = constants.COMPLIANCE_STATUS.IN_PROGRESS;
                break;
            case "Waiting For Client":
                query.status = constants.COMPLIANCE_STATUS.WAITING_FOR_CLIENT;
                break;
            case "Payment":
                query.status = constants.COMPLIANCE_STATUS.PAYMENT_DONE;
                break;
            case "Completed":
                query.status = { $in: [constants.COMPLIANCE_STATUS.COMPLETED, constants.COMPLIANCE_STATUS.FILING_DONE] };
                break;
            case "Delayed":
                query.status = constants.COMPLIANCE_STATUS.DELAYED;
                break;
            case "Overdue":
                query.status = constants.COMPLIANCE_STATUS.OVERDUE;
                break;
            case "Service":
                query.service = { $exists: true, $ne: null };
                break;
        }
    }

    if (search || req.query.search) {
        const searchRegex = new RegExp(search || req.query.search, 'i');
        query.$or = [
            { serviceType: searchRegex },
            { category: searchRegex },
            { department: searchRegex },
            { expertName: searchRegex }
        ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 0; // 0 means return all
    const skip = (page - 1) * limit;

    const totalCount = await Compliance.countDocuments(query);

    let compliancesQuery = Compliance.find(query)
        .populate('company', 'name')
        .populate('client', 'name companyName')
        .populate('assignedTo', 'name email')
        .populate('service', 'title')
        .select('-notes -__v')
        .sort({ dueDate: 1 });

    if (limit > 0) {
        compliancesQuery = compliancesQuery.skip(skip).limit(limit);
    }

    const compliances = await compliancesQuery;

    res.status(200).json(new ApiResponse(200, {
        compliances,
        count: totalCount, // Total matched documents
        totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
        currentPage: page,
        message: 'Compliances retrieved successfully'
    }));
});

/**
 * @desc    Export compliances to CSV
 * @route   GET /api/compliances/export
 * @access  Private (SUPER_ADMIN, ADMIN only)
 */
exports.exportCompliances = asyncHandler(async (req, res) => {
    const { role, _id: userId } = req.user;
    const { company, status, stage, department, category, search } = req.query;
    let query = {};

    // ── ROLE-BASED SCOPE ────────────────────────────────────
    if (role === constants.ROLES.SUPER_ADMIN) {
        if (company && mongoose.Types.ObjectId.isValid(company)) {
            query.company = company;
        }
    } else if (role === constants.ROLES.ADMIN) {
        // ADMIN sees strictly their own tasks during export
        const scopeFilter = {
            $or: [
                { assignedTo: userId },
                { createdBy: userId }
            ]
        };

        if (company && mongoose.Types.ObjectId.isValid(company)) {
            query.$and = [
                scopeFilter,
                { company: company }
            ];
        } else {
            query.$and = [scopeFilter];
        }
    } else {
        throw new ApiError(403, 'Access denied');
    }

    if (status) query.status = status;
    if (stage) query.stage = stage;
    if (department) query.department = department;
    if (category) query.category = Array.isArray(category) ? { $in: category } : category;
    if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
            { serviceType: searchRegex },
            { category: searchRegex },
            { department: searchRegex },
            { expertName: searchRegex }
        ];
    }

    const compliances = await Compliance.find(query)
        .populate('company', 'name')
        .populate('client', 'name companyName')
        .populate('assignedTo', 'name email')
        .sort({ dueDate: 1 });

    // Generate CSV
    const headers = [
        'Compliance Name',
        'Company',
        'Client',
        'Expert Name',
        'Due Date',
        'Stage',
        'Status',
        'Department',
        'Category',
        'Mandatory',
        'Risk',
        'Price',
        'Notes'
    ];

    const rows = compliances.map(c => [
        `"${c.serviceType || ''}"`,
        `"${c.company?.name || ''}"`,
        `"${c.client?.name || ''}"`,
        `"${c.expertName || 'Unassigned'}"`,
        `"${c.dueDate ? new Date(c.dueDate).toLocaleDateString('en-GB') : ''}"`,
        `"${c.stage || ''}"`,
        `"${c.status || ''}"`,
        `"${c.department || ''}"`,
        `"${c.category || ''}"`,
        `"${c.isMandatory ? 'Yes' : 'No'}"`,
        `"${c.risk || ''}"`,
        `"${c.price || 0}"`,
        `"${(c.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('compliances.csv');
    return res.send(csvContent);
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get compliance stats
 * @route   GET /api/compliances/stats
 * @access  Private (SUPER_ADMIN=all, ADMIN=scoped, USER=scoped)
 */
exports.getComplianceStats = asyncHandler(async (req, res) => {
    const { role, _id: userId } = req.user;
    const { company } = req.query;
    let query = {};

    // ── ROLE-BASED SCOPE ──────────────────────────────────────────────────────
    if (role === constants.ROLES.SUPER_ADMIN) {
        if (company && mongoose.Types.ObjectId.isValid(company)) {
            query.company = new mongoose.Types.ObjectId(company);
        }
    } else if (role === constants.ROLES.ADMIN) {
        // ADMIN stats strictly for their own tasks (assigned or created)
        const adminId = new mongoose.Types.ObjectId(userId);
        const scopeFilter = {
            $or: [
                { assignedTo: adminId },
                { createdBy: adminId }
            ]
        };

        if (company && mongoose.Types.ObjectId.isValid(company)) {
            query.$and = [
                scopeFilter,
                { company: new mongoose.Types.ObjectId(company) }
            ];
        } else {
            query.$and = [scopeFilter];
        }
    } else if (role === constants.ROLES.USER) {
        let authorizedIds = await getUserAuthorizedCompanyIds(userId);
        authorizedIds = authorizedIds.map(id => new mongoose.Types.ObjectId(id));

        if (company) {
            const companyId = new mongoose.Types.ObjectId(company);
            if (!authorizedIds.some(id => id.equals(companyId))) {
                throw new ApiError(403, 'You do not have access to this company\'s statistics');
            }
            query.company = companyId;
        } else {
            query.company = { $in: authorizedIds };
        }
    } else {
        throw new ApiError(403, 'Access denied');
    }

    const { department, category, search } = req.query;
    if (department) {
        query.department = department;
    }
    if (category) {
        query.category = Array.isArray(category) ? { $in: category } : category;
    }
    if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
            { serviceType: searchRegex },
            { category: searchRegex },
            { department: searchRegex },
            { expertName: searchRegex }
        ];
    }

    const now = new Date();
    const stats = await Compliance.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                pending: {
                    $sum: { $cond: [{ $eq: ['$status', constants.COMPLIANCE_STATUS.PENDING] }, 1, 0] }
                },
                needsAction: {
                    $sum: { $cond: [{ $eq: ['$status', constants.COMPLIANCE_STATUS.NEEDS_ACTION] }, 1, 0] }
                },
                inProgress: {
                    $sum: { $cond: [{ $eq: ['$status', constants.COMPLIANCE_STATUS.IN_PROGRESS] }, 1, 0] }
                },
                waitingForClient: {
                    $sum: { $cond: [{ $eq: ['$status', constants.COMPLIANCE_STATUS.WAITING_FOR_CLIENT] }, 1, 0] }
                },
                completedRaw: {
                    $sum: { $cond: [{ $eq: ['$status', constants.COMPLIANCE_STATUS.COMPLETED] }, 1, 0] }
                },
                filingDone: {
                    $sum: { $cond: [{ $eq: ['$status', constants.COMPLIANCE_STATUS.FILING_DONE] }, 1, 0] }
                },
                delayed: {
                    $sum: { $cond: [{ $eq: ['$status', constants.COMPLIANCE_STATUS.DELAYED] }, 1, 0] }
                },
                overdue: {
                    $sum: { $cond: [{ $eq: ['$status', constants.COMPLIANCE_STATUS.OVERDUE] }, 1, 0] }
                },
                paymentDone: {
                    $sum: { $cond: [{ $eq: ['$status', constants.COMPLIANCE_STATUS.PAYMENT_DONE] }, 1, 0] }
                },
                upcoming: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $gt: ['$dueDate', now] },
                                    { $not: { $in: ['$status', [constants.COMPLIANCE_STATUS.COMPLETED, constants.COMPLIANCE_STATUS.FILING_DONE]] } }
                                ]
                            }, 1, 0
                        ]
                    }
                },
                serviceRaw: {
                    $sum: { $cond: [{ $gt: ['$service', null] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                _id: 0,
                total: 1,
                pending: 1,
                needsAction: 1,
                inProgress: 1,
                waitingForClient: 1,
                completed: { $add: ['$completedRaw', '$filingDone'] },
                delayed: 1,
                overdue: 1,
                upcoming: 1,
                paymentDone: 1,
                service: '$serviceRaw'
            }
        }
    ]);

    const result = stats[0] || {
        total: 0,
        pending: 0,
        needsAction: 0,
        inProgress: 0,
        waitingForClient: 0,
        completed: 0,
        delayed: 0,
        overdue: 0,
        upcoming: 0,
        paymentDone: 0,
        service: 0
    };

    res.status(200).json(new ApiResponse(200, {
        stats: result,
        message: 'Compliance statistics retrieved successfully'
    }));
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Update compliance (status, stage, and/or assign expert)
 * @route   PATCH /api/compliances/:id
 * @access  Private (SUPER_ADMIN, ADMIN only — enforced at route AND controller)
 *
 * USER cannot update compliance status, stage, or assignment under any circumstance.
 * ADMIN can only update compliances for companies belonging to their assigned clients.
 * SUPER_ADMIN can override any compliance.
 */
exports.updateCompliance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, stage, assignedTo, expertName, category, department, serviceType, price } = req.body;
    const { role, _id: userId } = req.user;

    // ── ROLE GUARD (defence-in-depth — route already blocks USER via checkRole) ─
    if (role !== constants.ROLES.SUPER_ADMIN && role !== constants.ROLES.ADMIN) {
        throw new ApiError(403, 'Only ADMIN and SUPER_ADMIN can update compliance records');
    }

    const compliance = await Compliance.findById(id)
        .populate('company', 'name _id')
        .populate('client', 'name companyName assignedAdmin');

    if (!compliance) {
        throw new ApiError(404, 'Compliance not found');
    }

    // ── ADMIN SCOPE CHECK ─────────────────────────────────────────────────────
    if (role === constants.ROLES.ADMIN) {
        // Strictly check for Expert or Creator responsibility
        const isAssignee = compliance.assignedTo?.toString() === userId.toString();
        const isCreator = compliance.createdBy?.toString() === userId.toString();
        if (!isAssignee && !isCreator) {
            throw new ApiError(403, 'Unauthorized: This task is assigned to another admin.');
        }
    }

    // ── STATUS UPDATE (Enforce Forward-Only if PAID) ──────────────────────────
    if (status !== undefined) {
        if (!Object.values(constants.COMPLIANCE_STATUS).includes(status)) {
            throw new ApiError(400, `Invalid status. Allowed values: ${Object.values(constants.COMPLIANCE_STATUS).join(', ')}`);
        }

        // Security: Forward-only logic
        statusHelper.checkTransition(compliance.status, status, 'status');

        compliance.status = status;
    }

    // ── STAGE UPDATE (Enforce Forward-Only if PAID) ───────────────────────────
    if (stage !== undefined) {
        if (!Object.values(constants.COMPLIANCE_STAGES).includes(stage)) {
            throw new ApiError(400, `Invalid stage. Allowed values: ${Object.values(constants.COMPLIANCE_STAGES).join(', ')}`);
        }

        // Security: Forward-only logic
        statusHelper.checkTransition(compliance.stage, stage, 'stage');

        compliance.stage = stage;
    }

    // ── ASSIGNMENT UPDATE ─────────────────────────────────────────────────────
    // Validate the assignee exists and is an ADMIN (not a USER or unknown ID)
    if (assignedTo !== undefined) {
        // Only SUPER_ADMIN can change the assignment
        if (role !== constants.ROLES.SUPER_ADMIN) {
            throw new ApiError(403, 'Only Super Admin can assign experts to compliance records');
        }

        if (assignedTo === null || assignedTo === '' || assignedTo === 'unassigned') {
            // Unassign
            compliance.assignedTo = undefined;
            compliance.expertName = undefined;
        } else {
            if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
                throw new ApiError(400, 'Invalid assignee user ID');
            }
            const expert = await User.findById(assignedTo).select('name role');
            if (!expert) {
                throw new ApiError(404, 'Assigned user not found');
            }
            // Only ADMIN or SUPER_ADMIN users can be assigned as compliance experts
            if (expert.role !== constants.ROLES.ADMIN && expert.role !== constants.ROLES.SUPER_ADMIN) {
                throw new ApiError(400, 'Compliance can only be assigned to ADMIN or SUPER_ADMIN users');
            }
            compliance.assignedTo = assignedTo;
            compliance.expertName = expertName || expert.name;
        }
    }

    if (category !== undefined) compliance.category = category;
    if (department !== undefined && Object.values(constants.DEPARTMENTS).includes(department)) compliance.department = department;
    if (serviceType !== undefined) compliance.serviceType = serviceType;
    if (price !== undefined) compliance.price = Number(price);

    compliance.updatedBy = userId;
    await compliance.save();

    const updated = await Compliance.findById(id)
        .populate('company', 'name')
        .populate('client', 'name companyName')
        .populate('assignedTo', 'name email role')
        .select('-payment -__v');

    res.status(200).json(new ApiResponse(200, {
        compliance: updated,
        message: 'Compliance updated successfully'
    }));
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Create manual compliance for a company
 * @route   POST /api/compliances
 * @access  Private (SUPER_ADMIN, ADMIN only — enforced at route AND controller)
 */
exports.createCompliance = asyncHandler(async (req, res) => {
    const { companyId, serviceType, department, category, dueDate, risk, isMandatory, price } = req.body;
    const { role, _id: userId } = req.user;

    // Defence-in-depth: USER is blocked at route by checkRole, but verify here too
    if (role !== constants.ROLES.SUPER_ADMIN && role !== constants.ROLES.ADMIN) {
        throw new ApiError(403, 'Only ADMIN and SUPER_ADMIN can create compliance records');
    }

    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
        throw new ApiError(400, 'A valid company ID is required');
    }

    if (!serviceType || serviceType.trim().length === 0) {
        throw new ApiError(400, 'Service type is required');
    }

    const company = await Company.findById(companyId).populate('client');
    if (!company) {
        throw new ApiError(404, 'Company not found');
    }

    // ── ADMIN SCOPE CHECK ─────────────────────────────────────────────────────
    if (role === constants.ROLES.ADMIN) {
        const client = company.client;

        // Guard: client must exist and be assigned to this admin
        if (!client) {
            throw new ApiError(404, 'Client record for this company not found');
        }
        if (!client.assignedAdmin || client.assignedAdmin.toString() !== userId.toString()) {
            throw new ApiError(403, 'You can only assign compliance to companies belonging to your assigned clients');
        }
    }

    const complianceData = {
        company: company._id,
        client: company.client._id || company.client,
        serviceType: serviceType.trim(),
        category: category,
        department: department && Object.values(constants.DEPARTMENTS).includes(department)
            ? department
            : constants.DEPARTMENTS.OTHER,
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        risk: risk && Object.values(constants.RISK_LEVELS).includes(risk)
            ? risk
            : constants.RISK_LEVELS.LOW,
        isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : false,
        price: price !== undefined ? Number(price) : 0,
        createdBy: userId,
        status: constants.COMPLIANCE_STATUS.PENDING,
        stage: constants.COMPLIANCE_STAGES.PAYMENT,
    };

    // ✅ If the creator is an ADMIN, automatically assign it to themselves (Expert)
    if (role === constants.ROLES.ADMIN) {
        complianceData.assignedTo = userId;
        complianceData.expertName = req.user.name;
    }

    const compliance = await Compliance.create(complianceData);

    const populated = await Compliance.findById(compliance._id)
        .populate('company', 'name')
        .populate('client', 'name companyName')
        .populate('assignedTo', 'name email')
        .select('-payment -__v');

    res.status(201).json(new ApiResponse(201, {
        compliance: populated,
        message: role === constants.ROLES.ADMIN
            ? 'Compliance created and automatically assigned to you.'
            : 'Compliance assigned successfully'
    }));
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Create a compliance template
 * @route   POST /api/compliances/templates
 * @access  Private (SUPER_ADMIN only — enforced at route AND controller)
 */
exports.createTemplate = asyncHandler(async (req, res) => {
    // Defence-in-depth
    if (req.user.role !== constants.ROLES.SUPER_ADMIN) {
        throw new ApiError(403, 'Only SUPER_ADMIN can create compliance templates');
    }

    const { serviceType, department, category, frequency, daysUntilDue, risk, isMandatory, description } = req.body;

    if (!serviceType || serviceType.trim().length === 0) {
        throw new ApiError(400, 'Service type is required for template creation');
    }

    const template = await ComplianceTemplate.create({
        serviceType: serviceType.trim(),
        category: category,
        department,
        frequency,
        daysUntilDue: daysUntilDue || 30,
        risk: risk && Object.values(constants.RISK_LEVELS).includes(risk)
            ? risk
            : constants.RISK_LEVELS.LOW,
        isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : true,
        description,
        createdBy: req.user._id,
    });

    res.status(201).json(new ApiResponse(201, {
        template,
        message: 'Compliance template created successfully'
    }));
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Update a compliance template
 * @route   PUT /api/compliances/templates/:id
 * @access  Private (SUPER_ADMIN only — enforced at route AND controller)
 */
exports.updateTemplate = asyncHandler(async (req, res) => {
    // Defence-in-depth
    if (req.user.role !== constants.ROLES.SUPER_ADMIN) {
        throw new ApiError(403, 'Only SUPER_ADMIN can update compliance templates');
    }

    const { id } = req.params;
    const { serviceType, department, category, frequency, daysUntilDue, risk, isMandatory, description } = req.body;

    const template = await ComplianceTemplate.findById(id);
    if (!template) {
        throw new ApiError(404, 'Template not found');
    }

    if (serviceType && serviceType.trim().length > 0) {
        template.serviceType = serviceType.trim();
    }
    if (department && Object.values(constants.DEPARTMENTS).includes(department)) {
        template.department = department;
    }
    if (category !== undefined) {
        template.category = category;
    }
    if (frequency) {
        template.frequency = frequency;
    }
    if (daysUntilDue !== undefined) {
        template.daysUntilDue = parseInt(daysUntilDue, 10);
    }
    if (risk && Object.values(constants.RISK_LEVELS).includes(risk)) {
        template.risk = risk;
    }
    if (isMandatory !== undefined) {
        template.isMandatory = Boolean(isMandatory);
    }
    if (description !== undefined) {
        template.description = description;
    }

    await template.save();

    res.status(200).json(new ApiResponse(200, {
        template,
        message: 'Compliance template updated successfully'
    }));
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Delete a compliance template
 * @route   DELETE /api/compliances/templates/:id
 * @access  Private (SUPER_ADMIN only — enforced at route AND controller)
 */
exports.deleteTemplate = asyncHandler(async (req, res) => {
    // Defence-in-depth
    if (req.user.role !== constants.ROLES.SUPER_ADMIN) {
        throw new ApiError(403, 'Only SUPER_ADMIN can delete compliance templates');
    }

    const { id } = req.params;
    const template = await ComplianceTemplate.findById(id);

    if (!template) {
        throw new ApiError(404, 'Template not found');
    }

    await template.deleteOne();

    res.status(200).json(new ApiResponse(200, {
        message: 'Compliance template deleted successfully'
    }));
});

// ─────────────────────────────────────────────────────────────────────────────


/**
 * @desc    Get all compliance templates
 * @route   GET /api/compliances/templates
 * @access  Private (SUPER_ADMIN, ADMIN only — enforced at route)
 */
exports.getTemplates = asyncHandler(async (req, res) => {
    const templates = await ComplianceTemplate.find().sort({ serviceType: 1 });

    res.status(200).json(new ApiResponse(200, {
        templates,
        message: 'Templates retrieved successfully'
    }));
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Add attachment/note to compliance
 * @route   PATCH /api/compliances/:id/attachments
 * @access  Private (all roles — USER=own companies, ADMIN=assigned-client companies, SUPER_ADMIN=all)
 *
 * NOTE: USER can ONLY upload attachments/notes. They cannot change status, stage, or assignment.
 * This route is intentionally open to USER role to allow document uploads.
 */
exports.addAttachment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { url, name, note } = req.body;
    const { role, _id: userId } = req.user;

    if (!url && !note) {
        throw new ApiError(400, 'Either a file URL or a note is required');
    }

    // Fix 2: Guard against USER trying to sneak in status/stage updates
    if (req.user.role === constants.ROLES.USER && (req.body.stage || req.body.status)) {
        throw new ApiError(403, 'As a USER, you are not authorized to change compliance stage or status');
    }

    const compliance = await Compliance.findById(id);
    if (!compliance) {
        throw new ApiError(404, 'Compliance not found');
    }

    // ── OWNERSHIP / SCOPE CHECK ──────────────────────────────────────────────
    if (role === constants.ROLES.USER) {
        // USER can only add attachments to compliances for companies they are members of
        const company = await Company.findOne({
            _id: compliance.company,
            'members.user': userId,
        });
        if (!company) {
            throw new ApiError(403, 'You do not have access to this compliance');
        }
    } else if (role === constants.ROLES.ADMIN) {
        // Strictly check for Expert or Creator responsibility
        const isAssignee = compliance.assignedTo?.toString() === userId.toString();
        const isCreator = compliance.createdBy?.toString() === userId.toString();
        if (!isAssignee && !isCreator) {
            throw new ApiError(403, 'Unauthorized access to another admin\'s task');
        }
    }
    // SUPER_ADMIN — full access, no additional check needed

    // ── MUTATION ─────────────────────────────────────────────────────────────
    if (url) {
        // If name is provided, store as object; else store as url string (fallback)
        if (name) {
            compliance.attachments.push({ name, url });
        } else {
            compliance.attachments.push(url);
        }
    }
    if (note) {
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const formattedNote = `[${timestamp}] ${note}`;
        compliance.notes = compliance.notes
            ? `${compliance.notes}\n\n${formattedNote}`
            : formattedNote;
    }

    compliance.updatedBy = userId;
    
    // Auto-progress status/stage if a document is uploaded
    if (url) {
        const nextStatus = constants.COMPLIANCE_STATUS.IN_PROGRESS;
        const nextStage = constants.COMPLIANCE_STAGES.DOCUMENTATION;

        if (statusHelper.STATUS_RANK[nextStatus] > statusHelper.STATUS_RANK[compliance.status]) {
            compliance.status = nextStatus;
        }
        if (statusHelper.STAGE_RANK[nextStage] > statusHelper.STAGE_RANK[compliance.stage]) {
            compliance.stage = nextStage;
        }
    }

    await compliance.save();

    const updated = await Compliance.findById(id)
        .populate('company', 'name')
        .populate('client', 'name companyName')
        .populate('assignedTo', 'name email');

    res.status(200).json(new ApiResponse(200, {
        compliance: updated,
        message: 'Attachment/note added to compliance successfully'
    }));
});

/**
 * @desc    Bulk delete compliances
 * @route   DELETE /api/compliances/bulk
 * @access  Private (ADMIN / SUPER_ADMIN only)
 */
exports.bulkDeleteCompliances = asyncHandler(async (req, res) => {
    const { role, _id: userId } = req.user;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new ApiError(400, 'Please provide an array of compliance IDs to delete');
    }

    let filter = { _id: { $in: ids } };

    // ── ROLE-BASED SCOPE ──────────────────────────────────────────────────────
    if (role === constants.ROLES.ADMIN) {
        const authorizedIds = await getAdminAuthorizedCompanyIds(userId);
        filter.$and = [
            { company: { $in: authorizedIds } },
            {
                $or: [
                    { assignedTo: userId },
                    { createdBy: userId }
                ]
            }
        ];
    } else if (role !== constants.ROLES.SUPER_ADMIN) {
        throw new ApiError(403, 'You do not have permission to delete compliances');
    }

    const result = await Compliance.deleteMany(filter);

    res.status(200).json(new ApiResponse(200, {
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} compliance(s) deleted successfully`
    }));
});

