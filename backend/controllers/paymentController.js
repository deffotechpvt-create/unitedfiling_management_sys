const crypto = require('crypto');
const Razorpay = require('razorpay');
const Consultation = require('../models/Consultation');
const Compliance = require('../models/Compliance');
const Service = require('../models/Service');
const Company = require('../models/Company');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const constants = require('../config/constants');
const { sendEmail } = require('../config/email');
const { consultationBookedEmail } = require('../utils/emailTemplates');
const statusHelper = require('../utils/statusHelper');
const { STATUS_RANK, STAGE_RANK } = statusHelper;

/**
 * @desc    Create Razorpay Order for any entity (Consultation or Compliance)
 * @route   POST /api/payments/create-order
 * @access  Private
 */
exports.createOrder = asyncHandler(async (req, res) => {
    const { entityId, entityType, amount: reqAmount } = req.body;

    if (!entityType) {
        throw new ApiError(400, 'Entity Type is required');
    }

    if (!['CONSULTATION', 'COMPLIANCE', 'SERVICE'].includes(entityType)) {
        throw new ApiError(400, 'Invalid entity type');
    }

    let amount = 0;
    
    if (entityType === 'CONSULTATION') {
        // Consultations can be created after payment, so entityId is optional
        amount = reqAmount || 1000;
    } else if (entityType === 'COMPLIANCE') {
        if (!entityId) throw new ApiError(400, 'Compliance ID is required');
        const entity = await Compliance.findById(entityId);
        if (!entity) throw new ApiError(404, 'Compliance not found');
        amount = entity.price || 0;
    } else if (entityType === 'SERVICE') {
        if (!entityId) throw new ApiError(400, 'Service ID is required');
        const entity = await Service.findById(entityId);
        if (!entity) throw new ApiError(404, 'Service not found');
        amount = entity.price || 0;
    }

    if (amount <= 0) {
        throw new ApiError(400, 'Cannot create a payment order for zero amount');
    }

    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_SECRET,
    });

    const options = {
        amount: amount * 100, // Amount in paise
        currency: 'INR',
        receipt: `receipt_${entityType.toLowerCase()}_${Date.now()}`,
        notes: {
            entityId: entityId,
            entityType: entityType,
            userId: req.user._id.toString(),
            userName: req.user.name,
            userEmail: req.user.email
        }
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json(new ApiResponse(200, {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
    }));
});

/**
 * @desc    Verify Payment and update entity status
 * @route   POST /api/payments/verify-payment
 * @access  Private
 */
exports.verifyPayment = asyncHandler(async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        entityId,
        entityType,
        // Optional payload for consultations
        consultationData,
        // Optional payload for services (must specify companyId)
        companyId
    } = req.body;

    if (!entityId || !entityType) {
        throw new ApiError(400, 'Entity ID and Type are required');
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_SECRET)
        .update(body)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        throw new ApiError(400, 'Invalid payment signature');
    }

    let entity;

    if (entityType === 'CONSULTATION') {
        // If it's a new consultation booking, we might create it here 
        // OR update an existing one. Replicating `consultationController.js` logic for consistency.
        if (consultationData && consultationData.type) {
            entity = await Consultation.create({
                user: req.user._id,
                type: consultationData.type,
                scheduledSlot: { date: consultationData.date, time: consultationData.time },
                notes: consultationData.notes,
                status: constants.CONSULTATION_STATUS.PENDING,
                payment: {
                    orderId: razorpay_order_id,
                    paymentId: razorpay_payment_id,
                    amount: 1000,
                    currency: 'INR',
                    status: 'PAID',
                    paidAt: Date.now()
                }
            });

            // Send confirmation email
            const userEmailData = consultationBookedEmail(
                req.user.name, 
                entity.type, 
                entity.scheduledSlot?.date ? new Date(entity.scheduledSlot.date).toLocaleDateString() : 'N/A', 
                razorpay_payment_id
            );
            await sendEmail({
                to: req.user.email,
                subject: userEmailData.subject,
                htmlContent: userEmailData.htmlContent,
                textContent: userEmailData.textContent
            });
        } else {
             entity = await Consultation.findById(entityId);
             if (!entity) throw new ApiError(404, 'Consultation not found');
             entity.payment = {
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                amount: 1000,
                status: 'PAID',
                paidAt: Date.now()
            };
            await entity.save();
        }

        await entity.save();
    } else if (entityType === 'COMPLIANCE') {
        entity = await Compliance.findById(entityId);
        if (!entity) throw new ApiError(404, 'Compliance not found');
        
        // Update payment info
        entity.payment = {
            amount: entity.price, 
            status: 'PAID',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paidAt: Date.now()
        };

        const nextStatus = constants.COMPLIANCE_STATUS.PAYMENT_DONE;
        const nextStage = constants.COMPLIANCE_STAGES.DOCUMENTATION;

        if (STATUS_RANK[nextStatus] > STATUS_RANK[entity.status]) {
            entity.status = nextStatus;
        }
        if (STAGE_RANK[nextStage] > STAGE_RANK[entity.stage]) {
            entity.stage = nextStage;
        }
        
        entity.notes = entity.notes ? `${entity.notes}\n---\nPayment of ₹${entity.price} received successfully on ${new Date().toLocaleDateString()}.` : `Payment of ₹${entity.price} received successfully on ${new Date().toLocaleDateString()}.`;

        await entity.save();
    } else if (entityType === 'SERVICE') {
        const service = await Service.findById(entityId);
        if (!service) throw new ApiError(404, 'Service not found');

        if (!companyId) {
            throw new ApiError(400, 'Company ID is required to purchase a service');
        }

        const company = await Company.findById(companyId).populate('client');
        if (!company) throw new ApiError(404, 'Company not found');

        // Find due date (default 1 month from now)
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + 1);

        entity = await Compliance.create({
            company: company._id,
            client: company.client?._id,
            service: service._id,
            serviceType: service.serviceType || service.title,
            category: service.category,
            department: constants.DEPARTMENTS.OTHER,
            price: service.price,
            dueDate,
            status: constants.COMPLIANCE_STATUS.PAYMENT_DONE,
            stage: constants.COMPLIANCE_STAGES.DOCUMENTATION,
            payment: {
                amount: service.price,
                status: 'PAID',
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                paidAt: Date.now()
            },
            createdBy: req.user._id,
            notes: `Service "${service.title}" purchased via automated flow.`
        });
    }

    res.status(200).json(new ApiResponse(200, {
        entity,
        message: 'Payment verified and status updated successfully.'
    }));
});
