const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Service title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Service description is required'],
        trim: true,
    },
    category: {
        type: String,
        required: [true, 'Service category is required'],
        enum: ['Licenses', 'Trademarks', 'Company Changes', 'Taxation'],
    },
    price: {
        type: String,
        required: [true, 'Service price is required'],
    },
    benefits: [{
        type: String,
    }],
    processSteps: [{
        title: { type: String, required: true },
        description: { type: String, required: true },
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('Service', ServiceSchema);
