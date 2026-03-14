const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const constants = require('../config/constants');

// 1. Schema Definition
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // Don't return password by default
    },
    role: {
        type: String,
        enum: {
            values: Object.values(constants.ROLES),
            message: '{VALUE} is not a valid role',
        },
        default: constants.ROLES.USER,
    },

    // For ADMIN role: Track managed clients
    managedClients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
    }],

    isActive: {
        type: Boolean,
        default: true,
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
    },
    lastLogin: {
        type: Date,
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    onboardingTasks: {
        exploreServices: { type: Boolean, default: false },
        exploreDocuments: { type: Boolean, default: false },
        consultExpert: { type: Boolean, default: false },
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true, // Auto-manage createdAt/updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// 2. Indexes
UserSchema.index({ email: 1 }, { unique: true }); // Single index for email lookups
UserSchema.index({ role: 1, isActive: 1 }); // Compound index for role-based queries

// 3. Pre-save Middleware: Hash password before saving
UserSchema.pre('save', async function (next) {
    // Only hash if password is modified
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// 4. Instance Methods

/**
 * Compare entered password with hashed password
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>}
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

/**
 * Check if user can manage more clients (for ADMIN role)
 * @returns {boolean}
 */
UserSchema.methods.canAddClient = function () {
    if (this.role !== constants.ROLES.ADMIN) return false;
    const count = this.managedClients ? this.managedClients.length : 0;
    return count < constants.MAX_CLIENTS_PER_ADMIN;
};

/**
 * Update last login timestamp
 * @returns {Promise<void>}
 */
UserSchema.methods.updateLastLogin = async function () {
    this.lastLogin = new Date();
    return this.save({ validateBeforeSave: false });
};
UserSchema.methods.generateJWT = function () {
    const { generateToken } = require('../utils/generateToken');
    return generateToken(this._id, this.role);
};

/**
 * Remove sensitive data from JSON output
 */
UserSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};

// 5. Static Methods

/**
 * Find users by role
 * @param {string} role - User role
 * @returns {Promise<Array>}
 */
UserSchema.statics.findByRole = function (role) {
    return this.find({ role, isActive: true });
};

/**
 * Find all active admins with available capacity
 * @returns {Promise<Array>}
 */
UserSchema.statics.findAvailableAdmins = async function () {
    const admins = await this.find({
        role: constants.ROLES.ADMIN,
        isActive: true,
    }).populate('managedClients');

    return admins.filter(admin =>
        admin.managedClients.length < constants.MAX_CLIENTS_PER_ADMIN
    );
};

/**
 * Count users by role
 * @param {string} role - User role
 * @returns {Promise<number>}
 */
UserSchema.statics.countByRole = function (role) {
    return this.countDocuments({ role, isActive: true });
};

// 6. Virtuals

/**
 * Virtual: Get client count for ADMIN
 */
UserSchema.virtual('clientCount').get(function () {
    return this.managedClients ? this.managedClients.length : 0;
});

/**
 * Virtual: Check if admin is at capacity
 */
UserSchema.virtual('isAtCapacity').get(function () {
    if (this.role !== constants.ROLES.ADMIN) return false;
    const count = this.managedClients ? this.managedClients.length : 0;
    return count >= constants.MAX_CLIENTS_PER_ADMIN;
});

/**
 * Virtual: Available slots for ADMIN
 */
UserSchema.virtual('availableSlots').get(function () {
    if (this.role !== constants.ROLES.ADMIN) return 0;
    const count = this.managedClients ? this.managedClients.length : 0;
    return Math.max(0, constants.MAX_CLIENTS_PER_ADMIN - count);
});

// 7. Query Helpers

/**
 * Chainable query helper: Filter active users
 */
UserSchema.query.active = function () {
    return this.where({ isActive: true });
};

/**
 * Chainable query helper: Filter by role
 */
UserSchema.query.byRole = function (role) {
    return this.where({ role });
};

module.exports = mongoose.model('User', UserSchema);
