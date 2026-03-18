const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Service title is required'],
        trim: true,
    },
    serviceType: {
        type: String,
        required: [true, 'Service type is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    category: {
        type: String,
        required: [true, 'Service category is required'],
        enum: ['Licenses', 'Trademarks', 'Company Changes', 'Taxation'],
    },
    price: {
        type: Number,
        required: [true, 'Service price is required'],
        min: [0, 'Price cannot be negative']
    },
    benefits: [{
        type: String,
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
});

// 2. Indexes
ServiceSchema.index({ category: 1 });
ServiceSchema.index({ isActive: 1 });

// 3. Pre/Post Hooks

// 4. Instance Methods
/**
 * Support legacy .remove() call by mapping it to deleteOne()
 */
ServiceSchema.methods.remove = function () {
    return this.model('Service').deleteOne({ _id: this._id });
};

// 5. Static Methods

// 6. Virtuals

// 7. Query Helpers

module.exports = mongoose.model('Service', ServiceSchema);
