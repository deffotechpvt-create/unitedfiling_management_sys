const mongoose = require('mongoose');
const constants = require('../config/constants');

const ComplianceTemplateSchema = new mongoose.Schema({
    serviceType: {
        type: String,
        required: [true, 'Service type is required'],
        trim: true,
    },
    category: {
        type: String,
        trim: true,
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: Object.values(constants.DEPARTMENTS),
    },
    frequency: {
        type: String,
        enum: ['Monthly', 'Quarterly', 'Annual', 'One-time'],
        required: true,
    },
    daysUntilDue: {
        type: Number,
        default: 30,
        required: true,
    },
    isMandatory: {
        type: Boolean,
        default: true,
    },
    risk: {
        type: String,
        enum: Object.values(constants.RISK_LEVELS),
        default: constants.RISK_LEVELS.LOW,
    },
    description: {
        type: String,
        trim: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('ComplianceTemplate', ComplianceTemplateSchema);
