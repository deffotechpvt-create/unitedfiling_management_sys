const Compliance = require('../models/Compliance');
const Company = require('../models/Company');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const constants = require('../config/constants');

const mongoose = require('mongoose');

/**
 * @desc    Get report overview statistics
 * @route   GET /api/reports/overview
 * @access  Private (SUPER_ADMIN only)
 */
const getReportOverview = asyncHandler(async (req, res) => {
    let query = {};
    if (req.query.company) {
        query.company = new mongoose.Types.ObjectId(req.query.company);
    }

    // 1. By Risk
    const riskStats = await Compliance.aggregate([
        { $match: query },
        { $group: { _id: '$risk', count: { $sum: 1 } } }
    ]);

    // 2. By Stage
    const stageStats = await Compliance.aggregate([
        { $match: query },
        { $group: { _id: '$stage', count: { $sum: 1 } } }
    ]);

    // 3. By Organization (Top 10 companies by compliance count)
    const orgStats = await Compliance.aggregate([
        { $match: query },
        { $group: { _id: '$company', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: 'companies',
                localField: '_id',
                foreignField: '_id',
                as: 'companyInfo'
            }
        },
        { $unwind: '$companyInfo' },
        {
            $project: {
                name: '$companyInfo.name',
                count: 1
            }
        }
    ]);

    // 4. By Department
    const deptStats = await Compliance.aggregate([
        { $match: query },
        { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            byRisk: riskStats,
            byStage: stageStats,
            byOrganization: orgStats,
            byDepartment: deptStats,
            message: 'Report overview retrieved successfully'
        })
    );
});

/**
 * @desc    Get high risk compliances
 * @route   GET /api/reports/high-risk
 * @access  Private (SUPER_ADMIN only)
 */
const getHighRiskCompliances = asyncHandler(async (req, res) => {
    let query = { risk: constants.RISK_LEVELS.HIGH };
    if (req.query.company) {
        query.company = req.query.company;
    }

    const compliances = await Compliance.find(query)
        .populate('company', 'name')
        .populate('client', 'name')
        .populate('assignedTo', 'name')
        .sort({ dueDate: 1 });

    res.status(200).json(
        new ApiResponse(200, {
            compliances,
            message: 'High risk compliances retrieved successfully'
        })
    );
});

module.exports = {
    getReportOverview,
    getHighRiskCompliances
};
