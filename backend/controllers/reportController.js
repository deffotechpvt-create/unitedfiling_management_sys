const Compliance = require('../models/Compliance');
const Company = require('../models/Company');
const Consultation = require('../models/Consultation');
const Client = require('../models/Client');
const User = require('../models/User');
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
            stats: {
                byRisk: riskStats,
                byStage: stageStats,
                byOrganization: orgStats,
                byDepartment: deptStats,
            },
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
        .select('-payment -notes -attachments -__v')
        .sort({ dueDate: 1 });

    res.status(200).json(
        new ApiResponse(200, {
            compliances,
            message: 'High risk compliances retrieved successfully'
        })
    );
});

/**
 * @desc    Get dashboard metrics for super-admin (revenue etc)
 * @route   GET /api/reports/dashboard-stats
 * @access  Private (SUPER_ADMIN only)
 */
const getDashboardStats = asyncHandler(async (req, res) => {
    // 1. Consultation Revenue (PAID)
    const consultationRevenue = await Consultation.aggregate([
        { $match: { 'payment.status': 'PAID' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
    ]);

    // 2. Compliance Revenue (PAID) - Broken down into Direct vs Service-based
    const serviceRevenue = await Compliance.aggregate([
        { $match: { 'payment.status': 'PAID', 'service': { $exists: true, $ne: null } } },
        { $group: { _id: null, total: { $sum: '$payment.amount' }, count: { $sum: 1 } } }
    ]);

    const directRevenue = await Compliance.aggregate([
        { 
            $match: { 
                'payment.status': 'PAID', 
                $or: [
                    { 'service': { $exists: false } },
                    { 'service': null }
                ]
            } 
        },
        { $group: { _id: null, total: { $sum: '$payment.amount' }, count: { $sum: 1 } } }
    ]);

    const consultTotal = consultationRevenue.length > 0 ? consultationRevenue[0].total : 0;
    const servTotal = serviceRevenue.length > 0 ? serviceRevenue[0].total : 0;
    const dirTotal = directRevenue.length > 0 ? directRevenue[0].total : 0;

    // 3. Current Month Stats
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newClientsMonth = await Client.countDocuments({ createdAt: { $gte: firstDayOfMonth } });
    const consultsMonth = await Consultation.countDocuments({ 
        'payment.status': 'PAID',
        'payment.paidAt': { $gte: firstDayOfMonth } 
    });
    const compliancesMonth = await Compliance.countDocuments({
        'payment.status': 'PAID',
        'payment.paidAt': { $gte: firstDayOfMonth }
    });

    res.status(200).json(
        new ApiResponse(200, {
            summary: {
                totalRevenue: consultTotal + servTotal + dirTotal,
                consultationRevenue: consultTotal,
                serviceEntityRevenue: servTotal,
                directComplianceRevenue: dirTotal,
                newClientsThisMonth: newClientsMonth,
                paidConsultationsThisMonth: consultsMonth,
                paidCompliancesThisMonth: compliancesMonth,
                totalTransactionsThisMonth: consultsMonth + compliancesMonth
            },
            message: 'Dashboard stats retrieved successfully'
        })
    );
});

module.exports = {
    getReportOverview,
    getHighRiskCompliances,
    getDashboardStats
};
