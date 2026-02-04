const mongoose = require('mongoose');
const constants = require('../config/constants');

// 1. Schema Definition
const CompanySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
    },
    registrationNumber: {
        type: String,
        sparse: true,
        trim: true,
        uppercase: true,
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
        type: String,
        trim: true,
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        pincode: { type: String, trim: true },
        country: {
            type: String,
            default: 'India',
            trim: true,
        },
    },

    // Ownership
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: [true, 'Client reference is required'],
    },

    // Members (if multiple users access same company)
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            enum: {
                values: Object.values(constants.COMPANY_ROLES),
                message: '{VALUE} is not a valid company role',
            },
            default: constants.COMPANY_ROLES.VIEWER,
        },
        addedAt: {
            type: Date,
            default: Date.now,
        },
    }],

    status: {
        type: String,
        enum: {
            values: Object.values(constants.STATUS),
            message: '{VALUE} is not a valid status',
        },
        default: constants.STATUS.ACTIVE,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// 2. Indexes
CompanySchema.index({ registrationNumber: 1 }, { unique: true, sparse: true });
CompanySchema.index({ client: 1 });
CompanySchema.index({ status: 1 });
CompanySchema.index({ 'members.user': 1 });
CompanySchema.index({ client: 1, status: 1 });

// 3. Pre/Post Hooks

/**
 * Post-save: Add company to client's companies array
 */
CompanySchema.post('save', async function (doc) {
    const Client = mongoose.model('Client');
    await Client.findByIdAndUpdate(
        doc.client,
        { $addToSet: { companies: doc._id } }
    );
});

/**
 * Pre-remove: Remove company from client's companies array
 */
CompanySchema.pre('remove', async function (next) {
    const Client = mongoose.model('Client');
    await Client.findByIdAndUpdate(
        this.client,
        { $pull: { companies: this._id } }
    );
    next();
});

// 4. Instance Methods

/**
 * Add member to company
 */
CompanySchema.methods.addMember = async function (userId, role = constants.COMPANY_ROLES.VIEWER) {
    // Check if user already exists
    const exists = this.members.some(m => m.user.toString() === userId.toString());

    if (exists) {
        throw new Error('User is already a member of this company');
    }

    this.members.push({ user: userId, role });
    return this.save();
};

/**
 * Remove member from company
 */
CompanySchema.methods.removeMember = async function (userId) {
    this.members = this.members.filter(m => m.user.toString() !== userId.toString());
    return this.save();
};

/**
 * Update member role
 */
CompanySchema.methods.updateMemberRole = async function (userId, newRole) {
    const member = this.members.find(m => m.user.toString() === userId.toString());

    if (!member) {
        throw new Error('User is not a member of this company');
    }

    member.role = newRole;
    return this.save();
};

/**
 * Check if user is member
 */
CompanySchema.methods.isMember = function (userId) {
    return this.members.some(m => m.user.toString() === userId.toString());
};

/**
 * Get user's role in company
 */
CompanySchema.methods.getUserRole = function (userId) {
    const member = this.members.find(m => m.user.toString() === userId.toString());
    return member ? member.role : null;
};

// 5. Static Methods

/**
 * Find companies by client
 */
CompanySchema.statics.findByClient = function (clientId) {
    return this.find({ client: clientId, status: constants.STATUS.ACTIVE });
};

/**
 * Find companies where user is a member
 */
CompanySchema.statics.findByMember = function (userId) {
    return this.find({
        'members.user': userId,
        status: constants.STATUS.ACTIVE,
    });
};

/**
 * Search companies by name
 */
CompanySchema.statics.searchByName = function (searchTerm) {
    return this.find({
        name: { $regex: searchTerm, $options: 'i' },
        status: constants.STATUS.ACTIVE,
    });
};

// 6. Virtuals

/**
 * Virtual: Member count
 */
CompanySchema.virtual('memberCount').get(function () {
    return this.members ? this.members.length : 0;
});

/**
 * Virtual: Full address
 */
CompanySchema.virtual('fullAddress').get(function () {
    const { street, city, state, pincode, country } = this.address || {};
    return [street, city, state, pincode, country]
        .filter(Boolean)
        .join(', ');
});

// 7. Query Helpers

/**
 * Filter active companies
 */
CompanySchema.query.active = function () {
    return this.where({ status: constants.STATUS.ACTIVE });
};

/**
 * Filter by client
 */
CompanySchema.query.byClient = function (clientId) {
    return this.where({ client: clientId });
};

module.exports = mongoose.model('Company', CompanySchema);
