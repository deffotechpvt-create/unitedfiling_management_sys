const crypto = require('crypto');
const Razorpay = require('razorpay');
const Consultation = require('../models/Consultation');
const Compliance = require('../models/Compliance');
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

    if (!['CONSULTATION', 'COMPLIANCE'].includes(entityType)) {
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
        consultationData
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

    } else if (entityType === 'COMPLIANCE') {
        entity = await Compliance.findById(entityId);
        if (!entity) throw new ApiError(404, 'Compliance not found');
        
        // Update payment info
        entity.payment = {
            amount: entity.price, // ensure this is what they paid
            status: 'PAID',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paidAt: Date.now()
        };

        // User requested: "after payement success change the status also like payement to payement donot by client"
        // And update the status and stage
        // Update status and stage (only if it's a forward move)
        const nextStatus = constants.COMPLIANCE_STATUS.PAYMENT_DONE;
        const nextStage = constants.COMPLIANCE_STAGES.DOCUMENTATION;

        if (STATUS_RANK[nextStatus] > STATUS_RANK[entity.status]) {
            entity.status = nextStatus;
        }
        if (STAGE_RANK[nextStage] > STAGE_RANK[entity.stage]) {
            entity.stage = nextStage;
        }
        
        // Add note indicating payment receipt
        entity.notes = entity.notes ? `${entity.notes}\n---\nPayment of ₹${entity.price} received successfully on ${new Date().toLocaleDateString()}.` : `Payment of ₹${entity.price} received successfully on ${new Date().toLocaleDateString()}.`;

        await entity.save();
    }

    res.status(200).json(new ApiResponse(200, {
        entity,
        message: 'Payment verified and status updated successfully.'
    }));
});
