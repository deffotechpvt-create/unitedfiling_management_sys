const mongoose = require('mongoose');
const constants = require('../config/constants');
const { generateTicketNumber } = require('../utils/helpers');

// 1. Schema Definition
const ConsultationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required'],
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
    },
    type: {
        type: String,
        enum: {
            values: Object.values(constants.CONSULTATION_TYPES),
            message: '{VALUE} is not a valid consultation type',
        },
        required: [true, 'Consultation type is required'],
    },

    // Operational Details
    ticketNumber: {
        type: String,
        default: () => generateTicketNumber(),
        unique: true
    },
    status: {
        type: String,
        enum: {
            values: Object.values(constants.CONSULTATION_STATUS),
            message: '{VALUE} is not a valid status',
        },
        default: constants.CONSULTATION_STATUS.PENDING,
    },

    // Scheduling
    scheduledSlot: {
        date: {
            type: Date,
        },
        time: {
            type: String,
        },
    },

    // Assignment
    assignedExpert: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    // Communication Log
    messages: [{
        sender: {
            type: String,
            enum: ['User', 'Expert'],
            required: true,
        },
        content: {
            type: String,
            required: true,
            maxlength: [1000, 'Message cannot exceed 1000 characters'],
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    }],

    // Payment Details
    payment: {
        orderId: { type: String },
        paymentId: { type: String },
        amount: { type: Number, default: 1000 },
        currency: { type: String, default: 'INR' },
        status: {
            type: String,
            enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
            default: 'PENDING'
        },
        paidAt: { type: Date }
    },

    // Additional Information
    notes: {
        type: String,
        maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// 2. Indexes
ConsultationSchema.index({ ticketNumber: 1 }, { unique: true });
ConsultationSchema.index({ user: 1 });
ConsultationSchema.index({ status: 1 });
ConsultationSchema.index({ assignedExpert: 1 });
ConsultationSchema.index({ 'scheduledSlot.date': 1 });
ConsultationSchema.index({ user: 1, status: 1 });

// 3. Pre/Post Hooks

/**
 * Pre-save: Set client from user
 */
ConsultationSchema.pre('save', async function (next) {
    if (this.user && !this.client) {
        const Client = mongoose.model('Client');
        const client = await Client.findOne({ userId: this.user });
        if (client) {
            this.client = client._id;
        }
    }
    next();
});

// 4. Instance Methods

/**
 * Add message to conversation
 */
ConsultationSchema.methods.addMessage = async function (sender, content) {
    this.messages.push({ sender, content });
    return this.save();
};

/**
 * Schedule consultation
 */
ConsultationSchema.methods.schedule = async function (date, time) {
    this.scheduledSlot = { date, time };
    this.status = constants.CONSULTATION_STATUS.CONFIRMED;
    return this.save();
};

/**
 * Assign to expert
 */
ConsultationSchema.methods.assignToExpert = async function (expertId) {
    this.assignedExpert = expertId;
    return this.save();
};

/**
 * Mark as completed
 */
ConsultationSchema.methods.markCompleted = async function () {
    this.status = constants.CONSULTATION_STATUS.COMPLETED;
    return this.save();
};


/**
 * Add note
 */
ConsultationSchema.methods.addNote = async function (note) {
    this.notes = this.notes ? `${this.notes}\n---\n${note}` : note;
    return this.save();
};

// 5. Static Methods

/**
 * Find consultations by user
 */
ConsultationSchema.statics.findByUser = function (userId) {
    return this.find({ user: userId })
        .populate('assignedExpert', 'name email')
        .sort({ createdAt: -1 });
};

/**
 * Find consultations assigned to expert
 */
ConsultationSchema.statics.findByExpert = function (expertId) {
    return this.find({ assignedExpert: expertId })
        .populate('user', 'name email')
        .sort({ 'scheduledSlot.date': 1 });
};

/**
 * Find consultations by status
 */
ConsultationSchema.statics.findByStatus = function (status) {
    return this.find({ status })
        .populate('user', 'name email')
        .populate('assignedExpert', 'name email')
        .sort({ createdAt: -1 });
};

/**
 * Find pending consultations
 */
ConsultationSchema.statics.findPending = function () {
    return this.find({ status: constants.CONSULTATION_STATUS.PENDING })
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
};

/**
 * Find unassigned consultations
 */
ConsultationSchema.statics.findUnassigned = function () {
    return this.find({
        assignedExpert: null,
        status: { $ne: constants.CONSULTATION_STATUS.PENDING },
    })
        .populate('user', 'name email')
        .sort({ createdAt: -1 });
};

/**
 * Get consultation statistics
 */
ConsultationSchema.statics.getStats = async function () {
    const total = await this.countDocuments();
    const pending = await this.countDocuments({
        status: constants.CONSULTATION_STATUS.PENDING,
    });
    const scheduled = await this.countDocuments({
        status: constants.CONSULTATION_STATUS.CONFIRMED,
    });
    const completed = await this.countDocuments({
        status: constants.CONSULTATION_STATUS.COMPLETED,
    });

    return { total, pending, scheduled, completed };
};

/**
 * Find consultations by ticket number
 */
ConsultationSchema.statics.findByTicket = function (ticketNumber) {
    return this.findOne({ ticketNumber })
        .populate('user', 'name email')
        .populate('assignedExpert', 'name email');
};

// 6. Virtuals

/**
 * Virtual: Message count
 */
ConsultationSchema.virtual('messageCount').get(function () {
    return this.messages ? this.messages.length : 0;
});

/**
 * Virtual: Is scheduled
 */
ConsultationSchema.virtual('isScheduled').get(function () {
    return this.scheduledSlot && this.scheduledSlot.date !== null;
});

/**
 * Virtual: Is assigned
 */
ConsultationSchema.virtual('isAssigned').get(function () {
    return this.assignedExpert !== null && this.assignedExpert !== undefined;
});

/**
 * Virtual: Scheduled date formatted
 */
ConsultationSchema.virtual('scheduledDateFormatted').get(function () {
    if (!this.scheduledSlot || !this.scheduledSlot.date) return null;
    return this.scheduledSlot.date.toLocaleDateString('en-IN');
});

/**
 * Virtual: Last message
 */
ConsultationSchema.virtual('lastMessage').get(function () {
    if (!this.messages || this.messages.length === 0) return null;
    return this.messages[this.messages.length - 1];
});

// 7. Query Helpers

/**
 * Filter by user
 */
ConsultationSchema.query.byUser = function (userId) {
    return this.where({ user: userId });
};

/**
 * Filter by expert
 */
ConsultationSchema.query.byExpert = function (expertId) {
    return this.where({ assignedExpert: expertId });
};

/**
 * Filter by type
 */
ConsultationSchema.query.byType = function (type) {
    return this.where({ type });
};

/**
 * Filter by status
 */
ConsultationSchema.query.byStatus = function (status) {
    return this.where({ status });
};

/**
 * Filter scheduled consultations
 */
ConsultationSchema.query.scheduled = function () {
    return this.where({ 'scheduledSlot.date': { $ne: null } });
};

/**
 * Filter unassigned consultations
 */
ConsultationSchema.query.unassigned = function () {
    return this.where({ assignedExpert: null });
};

module.exports = mongoose.model('Consultation', ConsultationSchema);
