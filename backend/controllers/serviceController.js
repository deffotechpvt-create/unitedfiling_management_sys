const Service = require('../models/Service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get all services
 * @route   GET /api/services
 * @access  Public
 */
exports.getAllServices = asyncHandler(async (req, res) => {
    const services = await Service.find().select('-__v');

    res.status(200).json(
        new ApiResponse(200, {
            services,
            count: services.length,
            message: 'Services retrieved successfully'
        })
    );
});

/**
 * @desc    Get single service
 * @route   GET /api/services/:id
 * @access  Public
 */
exports.getServiceById = asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id).select('-__v');

    if (!service) {
        throw new ApiError(404, 'Service not found');
    }

    res.status(200).json(
        new ApiResponse(200, {
            service,
            message: 'Service retrieved successfully'
        })
    );
});
