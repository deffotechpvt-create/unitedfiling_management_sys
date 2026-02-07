const Compliance = require('../models/Compliance');
const constants = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    Get all compliances with filters
 * @route   GET /api/compliances
 * @access  Private
 */
exports.getAllCompliances = asyncHandler(async (req, res) => {
    const { role, _id: userId } = req.user;
    const { company, status, stage } = req.query;
    let query = {};

    // Role-based filtering & RBAC
    if (role === constants.ROLES.SUPER_ADMIN) {
        if (company) query.company = company;
    } else if (role === constants.ROLES.ADMIN) {
        // ADMIN can only see compliances assigned to them OR companies of their assigned clients
        const ClientModel = require('../models/Client');
        const myClients = await ClientModel.find({ assignedAdmin: userId }).select('_id companies');
        const authorizedCompanies = myClients.flatMap(c => c.companies.map(id => id.toString()));

        if (company) {
            if (!authorizedCompanies.includes(company)) {
                throw new ApiError(403, 'You do not have access to this company');
            }
            query.company = company;
        } else {
            // If no company selected, show all authorized for this admin
            query.company = { $in: authorizedCompanies };
        }
    } else if (role === constants.ROLES.USER) {
        const CompanyModel = require('../models/Company');
        const myCompanies = await CompanyModel.find({ 'members.user': userId }).select('_id');
        const myCompanyIds = myCompanies.map(c => c._id.toString());

        if (company) {
            if (!myCompanyIds.includes(company)) {
                throw new ApiError(403, 'You do not have access to this company');
            }
            query.company = company;
        } else {
            query.company = { $in: myCompanyIds };
        }
    }

    if (status) query.status = status;
    if (stage) query.stage = stage;

    const compliances = await Compliance.find(query)
        .populate('company', 'name')
        .populate('client', 'name companyName')
        .populate('assignedTo', 'name email')
        .sort({ dueDate: 1 });

    res.status(200).json(
        new ApiResponse(200, {
            compliances,
            count: compliances.length,
            message: 'Compliances retrieved successfully'
        })
    );
});

/**
 * @desc    Get compliance stats
 * @route   GET /api/compliances/stats
 * @access  Private
 */
exports.getComplianceStats = asyncHandler(async (req, res) => {
    const { role, _id: userId } = req.user;
    const { company } = req.query;
    let query = {};

    // Role-based filtering & RBAC for stats
    if (role === constants.ROLES.SUPER_ADMIN) {
        if (company) query.company = company;
    } else if (role === constants.ROLES.ADMIN) {
        const ClientModel = require('../models/Client');
        const myClients = await ClientModel.find({ assignedAdmin: userId }).select('_id companies');
        const authorizedCompanies = myClients.flatMap(c => c.companies.map(id => id.toString()));

        if (company) {
            if (!authorizedCompanies.includes(company)) {
                throw new ApiError(403, 'You do not have access to this company');
            }
            query.company = company;
        } else {
            query.company = { $in: authorizedCompanies };
        }
    } else if (role === constants.ROLES.USER) {
        const CompanyModel = require('../models/Company');
        const myCompanies = await CompanyModel.find({ 'members.user': userId }).select('_id');
        const myCompanyIds = myCompanies.map(c => c._id.toString());

        if (company) {
            if (!myCompanyIds.includes(company)) {
                throw new ApiError(403, 'You do not have access to this company');
            }
            query.company = company;
        } else {
            query.company = { $in: myCompanyIds };
        }
    }

    const stats = await Compliance.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                pending: {
                    $sum: {
                        $cond: [{ $eq: ['$status', constants.COMPLIANCE_STATUS.PENDING] }, 1, 0]
                    }
                },
                delayed: {
                    $sum: {
                        $cond: [{ $eq: ['$status', constants.COMPLIANCE_STATUS.DELAYED] }, 1, 0]
                    }
                },
                completed: {
                    $sum: {
                        $cond: [{ $in: ['$status', [constants.COMPLIANCE_STATUS.COMPLETED, constants.COMPLIANCE_STATUS.FILING_DONE]] }, 1, 0]
                    }
                }
            }
        }
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            stats: stats[0] || { total: 0, pending: 0, delayed: 0, completed: 0 },
            message: 'Compliance statistics retrieved successfully'
        })
    );
});
