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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 0; // 0 means return all
    const skip = (page - 1) * limit;

    const totalCount = await Service.countDocuments();

    let query = Service.find().select('-__v');

    if (limit > 0) {
        query = query.skip(skip).limit(limit);
    }

    const services = await query;

    res.status(200).json(
        new ApiResponse(200, {
            services,
            count: totalCount,
            totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
            currentPage: page,
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

/**
 * @desc    Create new service
 * @route   POST /api/services
 * @access  Private (Super Admin)
 */
exports.createService = asyncHandler(async (req, res) => {
    const { title, serviceType, description, category, price, benefits } = req.body;

    const service = await Service.create({
        title,
        serviceType,
        description,
        category,
        price,
        benefits
    });

    res.status(201).json(
        new ApiResponse(201, {
            service,
            message: 'Service created successfully'
        })
    );
});

/**
 * @desc    Update service
 * @route   PUT /api/services/:id
 * @access  Private (Super Admin)
 */
exports.updateService = asyncHandler(async (req, res) => {
    let service = await Service.findById(req.params.id);

    if (!service) {
        throw new ApiError(404, 'Service not found');
    }

    service = await Service.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json(
        new ApiResponse(200, {
            service,
            message: 'Service updated successfully'
        })
    );
});

/**
 * @desc    Delete service
 * @route   DELETE /api/services/:id
 * @access  Private (Super Admin)
 */
exports.deleteService = asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id);

    if (!service) {
        throw new ApiError(404, 'Service not found');
    }

    await service.remove();

    res.status(200).json(
        new ApiResponse(200, {
            message: 'Service deleted successfully'
        })
    );
});
