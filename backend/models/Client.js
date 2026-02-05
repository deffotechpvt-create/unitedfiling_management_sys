const mongoose = require('mongoose');
const constants = require('../config/constants');

// 1. Schema Definition
const ClientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
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
    validate: {
      validator: function (v) {
        if (!v) return true; // Phone is optional
        return /^[0-9]{10}$/.test(v.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please provide a valid 10-digit phone number',
    },
  },
  status: {
    type: String,
    enum: {
      values: Object.values(constants.CLIENT_STATUS),
      message: '{VALUE} is not a valid status',
    },
    default: constants.CLIENT_STATUS.ACTIVE,
  },

  // Assignment
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // Metrics
  pendingWork: {
    type: Number,
    default: 0,
    min: [0, 'Pending work cannot be negative'],
  },
  completedWork: {
    type: Number,
    default: 0,
    min: [0, 'Completed work cannot be negative'],
  },

  // Link to User account (USER role)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // Business entities
  companies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
  }],

  joinedDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// 2. Indexes
ClientSchema.index({ email: 1 }, { unique: true, sparse: true });
ClientSchema.index({ assignedAdmin: 1 });
ClientSchema.index({ status: 1 });
ClientSchema.index({ userId: 1 });
ClientSchema.index({ assignedAdmin: 1, status: 1 }); // Compound for admin queries

// 3. Pre/Post Hooks

/**
 * Pre-save: Validate admin assignment capacity
 */
ClientSchema.pre('save', async function (next) {
  if (!this.isModified('assignedAdmin')) return next();

  // If assigning to an admin, check capacity
  if (this.assignedAdmin) {
    const User = mongoose.model('User');
    const admin = await User.findById(this.assignedAdmin);

    if (!admin) {
      return next(new Error('Assigned admin not found'));
    }

    if (admin.role !== constants.ROLES.ADMIN) {
      return next(new Error('Can only assign to users with ADMIN role'));
    }

    // Check if admin has capacity (excluding current client if updating)
    const clientCount = await this.constructor.countDocuments({
      assignedAdmin: this.assignedAdmin,
      _id: { $ne: this._id }, // Exclude current client
    });

    if (clientCount >= constants.MAX_CLIENTS_PER_ADMIN) {
      return next(new Error(`Admin has reached maximum capacity of ${constants.MAX_CLIENTS_PER_ADMIN} clients`));
    }
  }

  next();
});

/**
 * Post-save: Update admin's managedClients array
 */
ClientSchema.post('save', async function (doc) {
  if (doc.assignedAdmin) {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(
      doc.assignedAdmin,
      { $addToSet: { managedClients: doc._id } }
    );
  }
});

// 4. Instance Methods

/**
 * Increment pending work count
 */
ClientSchema.methods.incrementPendingWork = async function () {
  this.pendingWork += 1;
  return this.save();
};

/**
 * Decrement pending work and increment completed work
 */
ClientSchema.methods.completeWork = async function () {
  if (this.pendingWork > 0) {
    this.pendingWork -= 1;
  }
  this.completedWork += 1;
  return this.save();
};

/**
 * Assign to admin
 */
ClientSchema.methods.assignToAdmin = async function (adminId) {
  this.assignedAdmin = adminId;
  return this.save();
};

/**
 * Unassign from admin
 */
ClientSchema.methods.unassign = async function () {
  const oldAdminId = this.assignedAdmin;
  this.assignedAdmin = null;
  await this.save();

  // Remove from admin's managedClients
  if (oldAdminId) {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(
      oldAdminId,
      { $pull: { managedClients: this._id } }
    );
  }
};

// 5. Static Methods

/**
 * Find clients by admin
 */
ClientSchema.statics.findByAdmin = function (adminId) {
  return this.find({ assignedAdmin: adminId, status: constants.CLIENT_STATUS.ACTIVE });
};

/**
 * Find unassigned clients
 */
ClientSchema.statics.findUnassigned = function () {
  return this.find({ assignedAdmin: null, status: constants.CLIENT_STATUS.ACTIVE });
};

/**
 * Get admin workload statistics
 */
ClientSchema.statics.getAdminWorkload = async function (adminId) {
  const clients = await this.find({ assignedAdmin: adminId });

  return {
    totalClients: clients.length,
    totalPendingWork: clients.reduce((sum, c) => sum + c.pendingWork, 0),
    totalCompletedWork: clients.reduce((sum, c) => sum + c.completedWork, 0),
  };
};

// 6. Virtuals

/**
 * Virtual: Total work
 */
ClientSchema.virtual('totalWork').get(function () {
  return this.pendingWork + this.completedWork;
});

/**
 * Virtual: Completion rate percentage
 */
ClientSchema.virtual('completionRate').get(function () {
  const total = this.totalWork;
  if (total === 0) return 0;
  return Math.round((this.completedWork / total) * 100);
});

/**
 * Virtual: Is assigned
 */
ClientSchema.virtual('isAssigned').get(function () {
  return this.assignedAdmin !== null;
});

// 7. Query Helpers

/**
 * Filter active clients
 */
ClientSchema.query.active = function () {
  return this.where({ status: constants.CLIENT_STATUS.ACTIVE });
};

/**
 * Filter assigned clients
 */
ClientSchema.query.assigned = function () {
  return this.where({ assignedAdmin: { $ne: null } });
};

/**
 * Filter unassigned clients
 */
ClientSchema.query.unassigned = function () {
  return this.where({ assignedAdmin: null });
};

module.exports = mongoose.model('Client', ClientSchema);
