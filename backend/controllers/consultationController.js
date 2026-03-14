const Consultation = require('../models/Consultation');
const User = require('../models/User');
const Client = require('../models/Client');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { sendEmail } = require('../config/email');
const { otpEmail, consultationBookedEmail, consultationScheduledEmail, adminConsultationNotificationEmail } = require('../utils/emailTemplates');
const constants = require('../config/constants');

const crypto = require('crypto');
const Razorpay = require('razorpay');

/**
 * @desc    Create Razorpay Order for consultation
 * @route   POST /api/consultations/create-order
 * @access  Private (User)
 */
exports.createOrder = asyncHandler(async (req, res) => {
    const { amount = 1000 } = req.body; // Default to 1000 INR

    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_SECRET,
    });

    const options = {
        amount: amount * 100, // Amount in paise
        currency: 'INR',
        receipt: 'consult_' + Date.now(),
        notes: {
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
 * @desc    Verify Payment and create consultation
 * @route   POST /api/consultations/verify-payment
 * @access  Private (User)
 */
exports.verifyPayment = asyncHandler(async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        consultationData
    } = req.body;

    const { type, date, time, notes } = consultationData;

    if (!type) {
        throw new ApiError(400, 'Consultation type is required');
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_SECRET)
        .update(body)
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        throw new ApiError(400, 'Invalid payment signature');
    }

    // Payment is valid, create consultation
    const consultation = await Consultation.create({
        user: req.user._id,
        type,
        scheduledSlot: { date, time }, // Optional at booking, mostly preferred date/time
        notes,
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

    // Send confirmation email to USER
    const userEmailData = consultationBookedEmail(
        req.user.name, 
        consultation.type, 
        consultation.scheduledSlot?.date ? new Date(consultation.scheduledSlot.date).toLocaleDateString() : 'N/A', 
        razorpay_payment_id
    );
    await sendEmail({
        to: req.user.email,
        subject: userEmailData.subject,
        htmlContent: userEmailData.htmlContent,
        textContent: userEmailData.textContent
    });

    // Send notification to ADMIN
    const adminEmailData = adminConsultationNotificationEmail(
        req.user.name,
        req.user.email,
        consultation.type,
        consultation.notes,
        consultation.scheduledSlot?.date ? new Date(consultation.scheduledSlot.date).toLocaleDateString() : 'N/A'
    );
    // Notify all admins or a specific one? For now, let's assume there's a system admin email or we fetch them.
    // As per previous patterns, we might send to a generic support email or specific roles.
    // For this task, I'll send it to a placeholder or handled by the system.
    // Let's check if there's a config for ADMIN_EMAIL.
    await sendEmail({
        to: process.env.ADMIN_EMAIL || 'support@unitedfillings.com',
        subject: adminEmailData.subject,
        htmlContent: adminEmailData.htmlContent,
        textContent: adminEmailData.textContent
    });

    res.status(201).json(new ApiResponse(201, {
        consultation,
        message: 'Consultation confirmed and payment successful.'
    }));
});

/**
 * @desc    Refund a consultation payment
 * @route   POST /api/consultations/:id/refund
 * @access  Private (Super Admin)
 */
exports.refundPayment = asyncHandler(async (req, res) => {
    const consultation = await Consultation.findById(req.params.id).populate('user');

    if (!consultation || !consultation.payment || !consultation.payment.paymentId) {
        throw new ApiError(404, 'Consultation or payment record not found');
    }

    if (consultation.payment.status === 'REFUNDED') {
        throw new ApiError(400, 'Payment is already refunded');
    }

    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Initiate refund
    await razorpay.payments.refund(consultation.payment.paymentId, {
        amount: consultation.payment.amount * 100 // Default 1000 * 100
    });

    consultation.payment.status = 'REFUNDED';
    consultation.status = constants.CONSULTATION_STATUS.CANCELLED;
    await consultation.save();

    // Send refund email
    // NOTE: Requires a new template if instructed, else a simple custom email
    await sendEmail({
        to: consultation.user.email,
        subject: "Consultation Refund Processed - United Fillings",
        htmlContent: `<p>Hi ${consultation.user.name},</p><p>Your consultation refund has been processed.</p><p>Refund Amount: ₹${consultation.payment.amount}</p><p>Original Payment ID: ${consultation.payment.paymentId}</p><p>Refund will reflect in 5-7 business days.</p>`,
        textContent: `Hi ${consultation.user.name}, your consultation refund has been processed. Amount: ₹${consultation.payment.amount}.`
    });

    res.status(200).json(new ApiResponse(200, {
        consultation,
        message: 'Payment refunded successfully'
    }));
});

/**
 * @desc    Get current user's consultations
 * @route   GET /api/consultations
 * @access  Private
 */
exports.getMyConsultations = asyncHandler(async (req, res) => {
    let query = { user: req.user._id };

    // If Admin/Super Admin, they might want all or filtered by user
    if (req.user.role !== constants.ROLES.USER) {
        query = {};
        if (req.query.userId) query.user = req.query.userId;
        if (req.query.expertId) query.assignedExpert = req.query.expertId;
    }

    const consultations = await Consultation.find(query)
        .populate('assignedExpert', 'name email')
        .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, {
        consultations,
        message: 'Consultations retrieved successfully'
    }));
});

/**
 * @desc    Get consultation by ID
 * @route   GET /api/consultations/:id
 * @access  Private
 */
exports.getConsultationById = asyncHandler(async (req, res) => {
    const consultation = await Consultation.findById(req.params.id)
        .populate('user', 'name email')
        .populate('assignedExpert', 'name email')
        .populate('client');

    if (!consultation) {
        throw new ApiError(404, 'Consultation not found');
    }

    // Access control
    const consultUserId = consultation.user._id ? consultation.user._id.toString() : consultation.user.toString();
    if (req.user.role === constants.ROLES.USER && consultUserId !== req.user._id.toString()) {
        throw new ApiError(403, 'Unauthorized to view this consultation');
    }

    res.status(200).json(new ApiResponse(200, {
        consultation,
        message: 'Consultation details retrieved'
    }));
});

/**
 * @desc    Assign expert to consultation
 * @route   PATCH /api/consultations/:id/assign
 * @access  Private (Admin/Super Admin)
 */
exports.assignExpert = asyncHandler(async (req, res) => {
    // Only SUPER_ADMIN can assign experts
    if (req.user.role !== constants.ROLES.SUPER_ADMIN) {
        throw new ApiError(403, 'Only Super Admin can assign experts to consultations');
    }

    const { expertId } = req.body;
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
        throw new ApiError(404, 'Consultation not found');
    }

    const expert = await User.findById(expertId);
    if (!expert || (expert.role !== constants.ROLES.ADMIN && expert.role !== constants.ROLES.SUPER_ADMIN)) {
        throw new ApiError(400, 'Invalid expert selected');
    }

    consultation.assignedExpert = expertId;
    await consultation.save();

    res.status(200).json(new ApiResponse(200, {
        consultation,
        message: 'Expert assigned successfully'
    }));
});

/**
 * @desc    Add message to consultation
 * @route   POST /api/consultations/:id/messages
 * @access  Private
 */
exports.addMessage = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
        throw new ApiError(404, 'Consultation not found');
    }

    // Access control
    let senderRole = 'User';
    if (req.user.role !== constants.ROLES.USER) {
        senderRole = 'Expert';
    }

    const consultUserId = consultation.user._id ? consultation.user._id.toString() : consultation.user.toString();
    if (req.user.role === constants.ROLES.USER && consultUserId !== req.user._id.toString()) {
        throw new ApiError(403, 'Unauthorized');
    }

    await consultation.addMessage(senderRole, content);

    res.status(200).json(new ApiResponse(200, {
        messages: consultation.messages,
        message: 'Message added successfully'
    }));
});

/**
 * @desc    Update consultation status
 * @route   PATCH /api/consultations/:id/status
 * @access  Private (Admin/Super Admin)
 */
exports.updateStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
        throw new ApiError(404, 'Consultation not found');
    }

    if (!Object.values(constants.CONSULTATION_STATUS).includes(status)) {
        throw new ApiError(400, 'Invalid status');
    }

    const oldStatus = consultation.status;
    consultation.status = status;
    await consultation.save();

    // Trigger emails based on status change
    if (oldStatus !== status) {
        if (status === constants.CONSULTATION_STATUS.CONFIRMED) {
            const user = await User.findById(consultation.user);
            if (user) {
                const emailData = consultationScheduledEmail(
                    user.name,
                    consultation.type,
                    consultation.scheduledSlot?.date ? new Date(consultation.scheduledSlot.date).toLocaleDateString() : 'TBD',
                    consultation.scheduledSlot?.time || 'TBD'
                );
                await sendEmail({
                    to: user.email,
                    subject: emailData.subject,
                    htmlContent: emailData.htmlContent,
                    textContent: emailData.textContent
                });
            }
        }
    }

    res.status(200).json(new ApiResponse(200, {
        consultation,
        message: 'Status updated successfully'
    }));
});
