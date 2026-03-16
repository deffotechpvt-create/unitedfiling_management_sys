// models/CalendarEvent.js
const mongoose = require('mongoose');
const constants = require('../config/constants');

const CalendarEventSchema = new mongoose.Schema({

  // References
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client reference is required'],
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company reference is required'],
  },
  compliance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Compliance',
    default: null,
  },

  // Event Details
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    trim: true,
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
  },
  department: {
    type: String,
    enum: Object.values(constants.DEPARTMENTS),
    default: constants.DEPARTMENTS.OTHER,
  },
  frequency: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Annual', 'One-time'],
    required: true,
  },

  // Dates
  deadlineDate: {
    type: Date,
    required: [true, 'Deadline date is required'],
  },
  completedDate: {
    type: Date,
    default: null,
  },

  // Status — expanded to match compliance statuses
  status: {
    type: String,
    enum: ['pending', 'completed', 'overdue', 'in_progress', 'needs_action', 'waiting_for_client', 'delayed'],
    default: 'pending',
  },

  // Audit
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // ✅ Internal flag to prevent infinite loop between hooks
  _syncedFromCompliance: {
    type: Boolean,
    default: false,
    select: false, // hidden from API responses
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
CalendarEventSchema.index({ client: 1, deadlineDate: 1 });
CalendarEventSchema.index({ company: 1 });
CalendarEventSchema.index({ status: 1 });
CalendarEventSchema.index({ deadlineDate: 1 });
CalendarEventSchema.index({ client: 1, status: 1 });
CalendarEventSchema.index({ compliance: 1 }); // ✅ for fast compliance lookup

// Virtual: days remaining
CalendarEventSchema.virtual('daysRemaining').get(function () {
  const now = new Date();
  const due = new Date(this.deadlineDate);
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
});

// Virtual: isOverdue
CalendarEventSchema.virtual('isOverdue').get(function () {
  if (this.status === 'completed') return false;
  return new Date() > new Date(this.deadlineDate);
});

// ─────────────────────────────────────────
// Pre-save: capture isNew + auto overdue
// ─────────────────────────────────────────
CalendarEventSchema.pre('save', function (next) {
  // ✅ Capture isNew before save so post('save') can use it
  this.wasNew = this.isNew;

  // ✅ Capture sync flag and reset it for DB persistence
  this._isSyncing = this._syncedFromCompliance;
  this._syncedFromCompliance = false; 

  // ✅ Auto mark overdue if past deadline and not completed
  // BUT: don't override if the status is being explicitly modified (manual update)
  if (!this.isModified('status') && this.status !== 'completed' && new Date() > new Date(this.deadlineDate)) {
    this.status = 'overdue';
  }

  // Auto set completedDate when marked completed
  if (this.isModified('status') && this.status === 'completed') {
    this.completedDate = new Date();
  }

  // Clear completedDate if re-opened
  if (this.isModified('status') && this.status !== 'completed') {
    this.completedDate = null;
  }

  next();
});

// ─────────────────────────────────────────
// Post-save: sync status back to Compliance
// ─────────────────────────────────────────
CalendarEventSchema.post('save', async function (doc) {
  try {
    // ✅ Skip if no linked compliance
    if (!doc.compliance) return;

    // ✅ Skip if this save was triggered BY compliance (prevent infinite loop)
    // We check both the transient flag from pre-save AND the doc property
    if (this._isSyncing || doc._syncedFromCompliance) {
      console.log(`[Sync] ✋ Infinite loop prevented for CalendarEvent: ${doc.title}`);
      return;
    }

    // ✅ Skip for newly created events — no need to sync back on creation
    if (this.wasNew) return;

    const Compliance = mongoose.model('Compliance');

    // ✅ Map CalendarEvent status → Compliance status
    const STATUS_MAP = {
      'completed': constants.COMPLIANCE_STATUS.COMPLETED,
      'pending': constants.COMPLIANCE_STATUS.PENDING,
      'overdue': constants.COMPLIANCE_STATUS.DELAYED,
      'delayed': constants.COMPLIANCE_STATUS.DELAYED,
      'in_progress': constants.COMPLIANCE_STATUS.IN_PROGRESS,
      'needs_action': constants.COMPLIANCE_STATUS.NEEDS_ACTION,
      'waiting_for_client': constants.COMPLIANCE_STATUS.WAITING_FOR_CLIENT,
    };

    const newComplianceStatus = STATUS_MAP[doc.status];
    if (!newComplianceStatus) return;

    const compliance = await Compliance.findById(doc.compliance);
    if (!compliance) return;

    // ✅ Only update if status actually changed — prevent unnecessary saves
    if (compliance.status === newComplianceStatus) return;

    compliance.status = newComplianceStatus;
    if (doc.createdBy) compliance.updatedBy = doc.createdBy;
    await compliance.save();

    console.log(`[Sync] ✅ Compliance "${compliance.serviceType}" status → ${newComplianceStatus}`);
  } catch (err) {
    console.error('[Sync] ❌ Calendar → Compliance sync failed:', err.message);
  }
});

// Statics
CalendarEventSchema.statics.findByClient = function (clientId) {
  return this.find({ client: clientId }).sort({ deadlineDate: 1 });
};

CalendarEventSchema.statics.findUpcoming = function (clientId) {
  const now = new Date();
  const next30Days = new Date();
  next30Days.setDate(now.getDate() + 30);
  return this.find({
    client: clientId,
    deadlineDate: { $gte: now, $lte: next30Days },
    status: 'pending',
  }).sort({ deadlineDate: 1 });
};

CalendarEventSchema.statics.findAllOverdue = function () {
  return this.find({
    status: { $ne: 'completed' },
    deadlineDate: { $lt: new Date() },
  });
};

module.exports = mongoose.model('CalendarEvent', CalendarEventSchema);
