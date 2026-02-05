const mongoose = require('mongoose');
const constants = require('../config/constants');

// 1. Schema Definition
const ComplianceSchema = new mongoose.Schema({
    // References
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, 'Company reference is required'],
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: [true, 'Client reference is required'],
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
    },

    // Details
    serviceType: {
        type: String,
        required: [true, 'Service type is required'],
        trim: true,
    },
    expertName: {
        type: String,
        trim: true,
    },

    // Progress Tracking
    stage: {
        type: String,
        enum: {
            values: Object.values(constants.COMPLIANCE_STAGES),
            message: '{VALUE} is not a valid stage',
        },
        required: true,
        default: constants.COMPLIANCE_STAGES.PAYMENT,
    },
    status: {
        type: String,
        enum: {
            values: Object.values(constants.COMPLIANCE_STATUS),
            message: '{VALUE} is not a valid status',
        },
        required: true,
        default: constants.COMPLIANCE_STATUS.PENDING,
    },

    // Dates
    startDate: {
        type: Date,
        default: Date.now,
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required'],
        validate: {
            validator: function (v) {
                return v > this.startDate;
            },
            message: 'Due date must be after start date',
        },
    },
    completedDate: {
        type: Date,
    },

    // Assignment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    // Additional Information
    notes: {
        type: String,
        maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    attachments: [{
        type: String, // File URLs
    }],

    // Payment Information (if needed)
    payment: {
        amount: {
            type: Number,
            min: [0, 'Payment amount cannot be negative'],
        },
        status: {
            type: String,
            enum: ['PENDING', 'PAID', 'REFUNDED'],
        },
        paidAt: Date,
        razorpayOrderId: String,
        razorpayPaymentId: String,
        razorpaySignature: String,
    },

    // Audit Trail
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator reference is required'],
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// 2. Indexes
ComplianceSchema.index({ company: 1, status: 1, dueDate: -1 }); // Compound for filtering
ComplianceSchema.index({ client: 1 });
ComplianceSchema.index({ assignedTo: 1 });
ComplianceSchema.index({ stage: 1 });
ComplianceSchema.index({ status: 1 });
ComplianceSchema.index({ dueDate: 1 }); // For due date queries

// 3. Pre/Post Hooks

/**
 * Pre-save: Auto-update status to DELAYED if overdue
 */
ComplianceSchema.pre('save', function (next) {
    // Auto-mark as delayed if past due date and not completed
    if (
        this.status !== constants.COMPLIANCE_STATUS.COMPLETED &&
        this.status !== constants.COMPLIANCE_STATUS.FILING_DONE &&
        new Date() > new Date(this.dueDate)
    ) {
        this.status = constants.COMPLIANCE_STATUS.DELAYED;
    }

    // Set completed date if status changed to completed
    if (
        this.isModified('status') &&
        (this.status === constants.COMPLIANCE_STATUS.COMPLETED ||
            this.status === constants.COMPLIANCE_STATUS.FILING_DONE)
    ) {
        this.completedDate = new Date();
    }

    next();
});

/**
 * Post-save: Update client work metrics
 */
ComplianceSchema.post('save', async function (doc) {
    const Client = mongoose.model('Client');

    // Recalculate client's pending and completed work
    const pendingCount = await this.constructor.countDocuments({
        client: doc.client,
        status: { $in: [constants.COMPLIANCE_STATUS.PENDING, constants.COMPLIANCE_STATUS.DELAYED] },
    });

    const completedCount = await this.constructor.countDocuments({
        client: doc.client,
        status: { $in: [constants.COMPLIANCE_STATUS.COMPLETED, constants.COMPLIANCE_STATUS.FILING_DONE] },
    });

    await Client.findByIdAndUpdate(doc.client, {
        pendingWork: pendingCount,
        completedWork: completedCount,
    });
});

// 4. Instance Methods

/**
 * Update stage
 */
ComplianceSchema.methods.updateStage = async function (newStage, userId) {
    this.stage = newStage;
    this.updatedBy = userId;
    return this.save();
};

/**
 * Update status
 */
ComplianceSchema.methods.updateStatus = async function (newStatus, userId) {
    this.status = newStatus;
    this.updatedBy = userId;
    return this.save();
};

/**
 * Assign to expert
 */
ComplianceSchema.methods.assignToExpert = async function (expertId, expertName, userId) {
    this.assignedTo = expertId;
    this.expertName = expertName;
    this.updatedBy = userId;
    return this.save();
};

/**
 * Add attachment
 */
ComplianceSchema.methods.addAttachment = async function (fileUrl) {
    this.attachments.push(fileUrl);
    return this.save();
};

/**
 * Mark as completed
 */
ComplianceSchema.methods.markCompleted = async function (userId) {
    this.status = constants.COMPLIANCE_STATUS.COMPLETED;
    this.completedDate = new Date();
    this.updatedBy = userId;
    return this.save();
};

/**
 * Add note
 */
ComplianceSchema.methods.addNote = async function (note, userId) {
    this.notes = this.notes ? `${this.notes}\n---\n${note}` : note;
    this.updatedBy = userId;
    return this.save();
};

// 5. Static Methods

/**
 * Find compliances by company
 */
ComplianceSchema.statics.findByCompany = function (companyId, filters = {}) {
    return this.find({ company: companyId, ...filters })
        .populate('assignedTo', 'name email')
        .sort({ dueDate: 1 });
};

/**
 * Find compliances by client
 */
ComplianceSchema.statics.findByClient = function (clientId) {
    return this.find({ client: clientId })
        .populate('company', 'name')
        .populate('assignedTo', 'name email')
        .sort({ dueDate: 1 });
};

/**
 * Find compliances assigned to admin
 */
ComplianceSchema.statics.findByAdmin = function (adminId) {
    return this.find({ assignedTo: adminId })
        .populate('company', 'name')
        .populate('client', 'name companyName')
        .sort({ dueDate: 1 });
};

/**
 * Find unassigned compliances
 */
ComplianceSchema.statics.findUnassigned = function () {
    return this.find({ assignedTo: null })
        .populate('company', 'name')
        .populate('client', 'name companyName')
        .sort({ createdAt: -1 });
};

/**
 * Find overdue compliances
 */
ComplianceSchema.statics.findOverdue = function () {
    return this.find({
        dueDate: { $lt: new Date() },
        status: { $nin: [constants.COMPLIANCE_STATUS.COMPLETED, constants.COMPLIANCE_STATUS.FILING_DONE] },
    }).sort({ dueDate: 1 });
};

/**
 * Get compliance statistics for admin
 */
ComplianceSchema.statics.getAdminStats = async function (adminId) {
    const total = await this.countDocuments({ assignedTo: adminId });
    const pending = await this.countDocuments({
        assignedTo: adminId,
        status: constants.COMPLIANCE_STATUS.PENDING,
    });
    const delayed = await this.countDocuments({
        assignedTo: adminId,
        status: constants.COMPLIANCE_STATUS.DELAYED,
    });
    const completed = await this.countDocuments({
        assignedTo: adminId,
        status: { $in: [constants.COMPLIANCE_STATUS.COMPLETED, constants.COMPLIANCE_STATUS.FILING_DONE] },
    });

    return { total, pending, delayed, completed };
};

// 6. Virtuals

/**
 * Virtual: Check if overdue
 */
ComplianceSchema.virtual('isOverdue').get(function () {
    if (
        this.status === constants.COMPLIANCE_STATUS.COMPLETED ||
        this.status === constants.COMPLIANCE_STATUS.FILING_DONE
    ) {
        return false;
    }
    return new Date() > new Date(this.dueDate);
});

/**
 * Virtual: Days remaining
 */
ComplianceSchema.virtual('daysRemaining').get(function () {
    const now = new Date();
    const due = new Date(this.dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

/**
 * Virtual: Is assigned
 */
ComplianceSchema.virtual('isAssigned').get(function () {
    return this.assignedTo !== null && this.assignedTo !== undefined;
});

/**
 * Virtual: Stage progress percentage
 */
ComplianceSchema.virtual('progressPercentage').get(function () {
    const stages = Object.values(constants.COMPLIANCE_STAGES);
    const currentIndex = stages.indexOf(this.stage);
    return Math.round(((currentIndex + 1) / stages.length) * 100);
});

// 7. Query Helpers

/**
 * Filter by status
 */
ComplianceSchema.query.byStatus = function (status) {
    return this.where({ status });
};

/**
 * Filter by stage
 */
ComplianceSchema.query.byStage = function (stage) {
    return this.where({ stage });
};

/**
 * Filter assigned compliances
 */
ComplianceSchema.query.assigned = function () {
    return this.where({ assignedTo: { $ne: null } });
};

/**
 * Filter unassigned compliances
 */
ComplianceSchema.query.unassigned = function () {
    return this.where({ assignedTo: null });
};

/**
 * Filter overdue compliances
 */
ComplianceSchema.query.overdue = function () {
    return this.where({
        dueDate: { $lt: new Date() },
        status: { $nin: [constants.COMPLIANCE_STATUS.COMPLETED, constants.COMPLIANCE_STATUS.FILING_DONE] },
    });
};

module.exports = mongoose.model('Compliance', ComplianceSchema);
