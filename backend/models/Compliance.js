const mongoose = require('mongoose');
const constants = require('../config/constants');

// 1. Schema Definition
const ComplianceSchema = new mongoose.Schema({
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
    serviceType: {
        type: String,
        required: [true, 'Service type is required'],
        trim: true,
    },
    category: {
        type: String,
        trim: true,
    },
    expertName: {
        type: String,
        trim: true,
    },
    risk: {
        type: String,
        enum: {
            values: Object.values(constants.RISK_LEVELS),
            message: '{VALUE} is not a valid risk level',
        },
        default: constants.RISK_LEVELS.LOW,
    },
    department: {
        type: String,
        enum: {
            values: Object.values(constants.DEPARTMENTS),
            message: '{VALUE} is not a valid department',
        },
        default: constants.DEPARTMENTS.OTHER,
    },
    isMandatory: {
        type: Boolean,
        default: false,
    },
    price: {
        type: Number,
        default: 0,
        min: [0, 'Price cannot be negative']
    },
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
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    notes: {
        type: String,
        maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    attachments: [mongoose.Schema.Types.Mixed],
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
ComplianceSchema.index({ company: 1, status: 1, dueDate: -1 });
ComplianceSchema.index({ client: 1 });
ComplianceSchema.index({ assignedTo: 1 });
ComplianceSchema.index({ stage: 1 });
ComplianceSchema.index({ status: 1 });
ComplianceSchema.index({ dueDate: 1 });

// 3. Pre/Post Hooks

ComplianceSchema.pre('save', function (next) {
    // ✅ Capture isNew BEFORE save
    this.wasNew = this.isNew;

    // Auto-mark delayed if past due date and not completed
    if (
        this.status !== constants.COMPLIANCE_STATUS.COMPLETED &&
        this.status !== constants.COMPLIANCE_STATUS.FILING_DONE &&
        new Date() > new Date(this.dueDate)
    ) {
        this.status = constants.COMPLIANCE_STATUS.DELAYED;
    }

    // Auto-set completedDate
    if (
        this.isModified('status') &&
        (this.status === constants.COMPLIANCE_STATUS.COMPLETED ||
            this.status === constants.COMPLIANCE_STATUS.FILING_DONE)
    ) {
        this.completedDate = new Date();
    }

    // Clear completedDate if re-opened
    if (
        this.isModified('status') &&
        this.status !== constants.COMPLIANCE_STATUS.COMPLETED &&
        this.status !== constants.COMPLIANCE_STATUS.FILING_DONE
    ) {
        this.completedDate = undefined;
    }

    next();
});

ComplianceSchema.post('save', async function (doc) {
    const Client = mongoose.model('Client');
    const CalendarEvent = mongoose.model('CalendarEvent');

    // ✅ Recalculate client metrics
    const pendingCount = await this.constructor.countDocuments({
        client: doc.client,
        status: { $nin: [constants.COMPLIANCE_STATUS.COMPLETED, constants.COMPLIANCE_STATUS.FILING_DONE] },
    });
    const completedCount = await this.constructor.countDocuments({
        client: doc.client,
        status: { $in: [constants.COMPLIANCE_STATUS.COMPLETED, constants.COMPLIANCE_STATUS.FILING_DONE] },
    });
    await Client.findByIdAndUpdate(doc.client, {
        pendingWork: pendingCount,
        completedWork: completedCount,
    });

    // ✅ NEW DOC → create exactly 1 calendar event directly
    if (this.wasNew) {
        try {
            await CalendarEvent.create({
                title: doc.serviceType,
                compliance: doc._id,
                company: doc.company,
                client: doc.client,
                serviceType: doc.serviceType,
                department: doc.department || constants.DEPARTMENTS.OTHER,
                deadlineDate: doc.dueDate,      // ✅ same due date as compliance
                frequency: 'One-time',        // ✅ 1 compliance = 1 event
                status: 'pending',
                isMandatory: doc.isMandatory,
                assignedTo: doc.assignedTo,   // ✅ Pass assigned expert
                createdBy: doc.createdBy,
                stage: doc.stage,             // ✅ Pass initial stage
            });
            console.log(`[Calendar] ✅ 1 event created for: ${doc.serviceType}`);
        } catch (err) {
            console.error('[Calendar] ❌ Calendar event creation failed:', err.message);
        }
        return; // ✅ skip sync logic for new docs
    }

    try {
        // ✅ Map compliance status → calendar status
        const COMPLIANCE_TO_CALENDAR_STATUS = {
            [constants.COMPLIANCE_STATUS.COMPLETED]: 'completed',
            [constants.COMPLIANCE_STATUS.FILING_DONE]: 'filing_done',
            [constants.COMPLIANCE_STATUS.PENDING]: 'pending',
            [constants.COMPLIANCE_STATUS.DELAYED]: 'delayed',
            [constants.COMPLIANCE_STATUS.OVERDUE]: 'overdue',
            [constants.COMPLIANCE_STATUS.IN_PROGRESS]: 'in_progress',
            [constants.COMPLIANCE_STATUS.NEEDS_ACTION]: 'needs_action',
            [constants.COMPLIANCE_STATUS.WAITING_FOR_CLIENT]: 'waiting_for_client',
            [constants.COMPLIANCE_STATUS.PAYMENT_DONE]: 'payment_done',
        };

        const calendarStatus = COMPLIANCE_TO_CALENDAR_STATUS[doc.status];
        if (!calendarStatus) return;

        // ✅ Find linked calendar event
        const calendarEvent = await CalendarEvent.findOne({ compliance: doc._id });
        if (!calendarEvent) {
            console.log(`[Calendar] ℹ️ No linked calendar event found for compliance: ${doc._id}`);
            return;
        }

        // ✅ Check if sync is needed
        const hasStatusChanged = calendarEvent.status !== calendarStatus;
        const hasStageChanged = calendarEvent.stage !== doc.stage;
        const hasAssigneeChanged = calendarEvent.assignedTo?.toString() !== doc.assignedTo?.toString();

        if (!hasStatusChanged && !hasStageChanged && !hasAssigneeChanged) return;

        // ✅ Set sync flag to true BEFORE saving
        calendarEvent._syncedFromCompliance = true;
        
        if (hasStatusChanged) {
            calendarEvent.status = calendarStatus;
            if (calendarStatus === 'completed') {
                calendarEvent.completedDate = doc.completedDate || new Date();
            } else {
                calendarEvent.completedDate = null;
            }
        }

        if (hasStageChanged) {
            calendarEvent.stage = doc.stage;
        }

        if (hasAssigneeChanged) {
            calendarEvent.assignedTo = doc.assignedTo;
        }

        await calendarEvent.save();
        console.log(`[Calendar] ✅ Synced compliance status "${doc.status}" → calendar status "${calendarStatus}" for: ${doc.serviceType}`);
    } catch (err) {
        console.error('[Calendar] ❌ Calendar sync failed:', err.message);
    }
});

/**
 * Handle Cleanup on Delete
 * Deletes the linked CalendarEvent when a Compliance is deleted.
 */
ComplianceSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        const CalendarEvent = mongoose.model('CalendarEvent');
        await CalendarEvent.deleteMany({ compliance: this._id });
        next();
    } catch (err) {
        next(err);
    }
});

ComplianceSchema.pre('findOneAndDelete', async function (next) {
    try {
        const docToDelete = await this.model.findOne(this.getQuery());
        if (docToDelete) {
            const CalendarEvent = mongoose.model('CalendarEvent');
            await CalendarEvent.deleteMany({ compliance: docToDelete._id });
        }
        next();
    } catch (err) {
        next(err);
    }
});

ComplianceSchema.pre('deleteMany', async function (next) {
    try {
        const CalendarEvent = mongoose.model('CalendarEvent');
        const filter = this.getFilter();
        
        // If deleting by IDs (common in bulk delete)
        if (filter._id && filter._id.$in) {
            await CalendarEvent.deleteMany({ compliance: { $in: filter._id.$in } });
        } else if (filter.company) {
            // If deleting by company (cascading from company delete)
            await CalendarEvent.deleteMany({ company: filter.company });
        }
        next();
    } catch (err) {
        next(err);
    }
});

// 4. Instance Methods

ComplianceSchema.methods.updateStage = async function (newStage, userId) {
    this.stage = newStage;
    this.updatedBy = userId;
    return this.save();
};

ComplianceSchema.methods.updateStatus = async function (newStatus, userId) {
    this.status = newStatus;
    this.updatedBy = userId;
    return this.save();
};

ComplianceSchema.methods.assignToExpert = async function (expertId, expertName, userId) {
    this.assignedTo = expertId;
    this.expertName = expertName;
    this.updatedBy = userId;
    return this.save();
};

ComplianceSchema.methods.addAttachment = async function (fileData) {
    // fileData can be a string (URL) or an object { name, url }
    this.attachments.push(fileData);
    return this.save();
};

ComplianceSchema.methods.markCompleted = async function (userId) {
    this.status = constants.COMPLIANCE_STATUS.COMPLETED;
    this.completedDate = new Date();
    this.updatedBy = userId;
    return this.save();
};

ComplianceSchema.methods.addNote = async function (note, userId) {
    this.notes = this.notes ? `${this.notes}\n---\n${note}` : note;
    this.updatedBy = userId;
    return this.save();
};

// 5. Static Methods

ComplianceSchema.statics.findByCompany = function (companyId, filters = {}) {
    return this.find({ company: companyId, ...filters })
        .populate('assignedTo', 'name email')
        .sort({ dueDate: 1 });
};

ComplianceSchema.statics.findByClient = function (clientId) {
    return this.find({ client: clientId })
        .populate('company', 'name')
        .populate('assignedTo', 'name email')
        .sort({ dueDate: 1 });
};

ComplianceSchema.statics.findByAdmin = function (adminId) {
    return this.find({ assignedTo: adminId })
        .populate('company', 'name')
        .populate('client', 'name companyName')
        .sort({ dueDate: 1 });
};

ComplianceSchema.statics.findUnassigned = function () {
    return this.find({ assignedTo: null })
        .populate('company', 'name')
        .populate('client', 'name companyName')
        .sort({ createdAt: -1 });
};

ComplianceSchema.statics.findOverdue = function () {
    return this.find({
        dueDate: { $lt: new Date() },
        status: { $nin: [constants.COMPLIANCE_STATUS.COMPLETED, constants.COMPLIANCE_STATUS.FILING_DONE] },
    }).sort({ dueDate: 1 });
};

ComplianceSchema.statics.getAdminStats = async function (adminId) {
    const total = await this.countDocuments({ assignedTo: adminId });
    const pending = await this.countDocuments({ assignedTo: adminId, status: constants.COMPLIANCE_STATUS.PENDING });
    const delayed = await this.countDocuments({ assignedTo: adminId, status: constants.COMPLIANCE_STATUS.DELAYED });
    const completed = await this.countDocuments({
        assignedTo: adminId,
        status: { $in: [constants.COMPLIANCE_STATUS.COMPLETED, constants.COMPLIANCE_STATUS.FILING_DONE] },
    });
    return { total, pending, delayed, completed };
};

// 6. Virtuals

ComplianceSchema.virtual('isOverdue').get(function () {
    if (
        this.status === constants.COMPLIANCE_STATUS.COMPLETED ||
        this.status === constants.COMPLIANCE_STATUS.FILING_DONE
    ) return false;
    return new Date() > new Date(this.dueDate);
});

ComplianceSchema.virtual('daysRemaining').get(function () {
    const now = new Date();
    const due = new Date(this.dueDate);
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
});

ComplianceSchema.virtual('isAssigned').get(function () {
    return this.assignedTo !== null && this.assignedTo !== undefined;
});

ComplianceSchema.virtual('progressPercentage').get(function () {
    const stages = Object.values(constants.COMPLIANCE_STAGES);
    const currentIndex = stages.indexOf(this.stage);
    return Math.round(((currentIndex + 1) / stages.length) * 100);
});

// 7. Query Helpers

ComplianceSchema.query.byStatus = function (status) { return this.where({ status }); };
ComplianceSchema.query.byStage = function (stage) { return this.where({ stage }); };
ComplianceSchema.query.assigned = function () { return this.where({ assignedTo: { $ne: null } }); };
ComplianceSchema.query.unassigned = function () { return this.where({ assignedTo: null }); };
ComplianceSchema.query.overdue = function () {
    return this.where({
        dueDate: { $lt: new Date() },
        status: { $nin: [constants.COMPLIANCE_STATUS.COMPLETED, constants.COMPLIANCE_STATUS.FILING_DONE] },
    });
};

module.exports = mongoose.model('Compliance', ComplianceSchema);
