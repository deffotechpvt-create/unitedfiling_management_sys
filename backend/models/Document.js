const mongoose = require('mongoose');

// 1. Schema Definition
const DocumentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Document name is required'],
        trim: true,
    },
    url: {
        type: String,
        required: [true, 'Document URL is required'],
    },
    publicId: {
        type: String,
        required: [true, 'Public ID is required'],
    },
    folder: {
        type: String,
        default: 'General',
        trim: true,
    },
    fileSize: {
        type: Number, // in bytes
        min: [0, 'File size cannot be negative'],
    },
    mimeType: {
        type: String,
        required: [true, 'MIME type is required'],
    },

    // References
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Uploader reference is required'],
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
    },
    relatedCompliance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Compliance',
    },

    // Metadata
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// 2. Indexes
DocumentSchema.index({ company: 1 });
DocumentSchema.index({ client: 1 });
DocumentSchema.index({ uploadedBy: 1 });
DocumentSchema.index({ folder: 1 });
DocumentSchema.index({ company: 1, folder: 1 }); // Compound for filtering
DocumentSchema.index({ createdAt: -1 }); // For recent documents

// 3. Pre/Post Hooks

/**
 * Pre-save: Set client from company if not provided
 */
DocumentSchema.pre('save', async function (next) {
    if (this.company && !this.client) {
        const Company = mongoose.model('Company');
        const company = await Company.findById(this.company);
        if (company) {
            this.client = company.client;
        }
    }
    next();
});

/**
 * Pre-remove: Delete file from Cloudinary
 */
DocumentSchema.pre('remove', async function (next) {
    const { deleteFromCloudinary } = require('../utils/cloudinaryUpload');
    await deleteFromCloudinary(this.publicId);
    next();
});

// 4. Instance Methods

/**
 * Update description
 */
DocumentSchema.methods.updateDescription = async function (description) {
    this.description = description;
    return this.save();
};

/**
 * Link to compliance
 */
DocumentSchema.methods.linkToCompliance = async function (complianceId) {
    this.relatedCompliance = complianceId;

    // Also add to compliance attachments
    const Compliance = mongoose.model('Compliance');
    await Compliance.findByIdAndUpdate(
        complianceId,
        { $addToSet: { attachments: this.url } }
    );

    return this.save();
};

/**
 * Move to different folder
 */
DocumentSchema.methods.moveToFolder = async function (newFolder) {
    this.folder = newFolder;
    return this.save();
};

// 5. Static Methods

/**
 * Find documents by company
 */
DocumentSchema.statics.findByCompany = function (companyId, folder = null) {
    const query = { company: companyId };
    if (folder) query.folder = folder;

    return this.find(query)
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 });
};

/**
 * Find documents by client
 */
DocumentSchema.statics.findByClient = function (clientId) {
    return this.find({ client: clientId })
        .populate('uploadedBy', 'name email')
        .populate('company', 'name')
        .sort({ createdAt: -1 });
};

/**
 * Find documents by folder
 */
DocumentSchema.statics.findByFolder = function (folder) {
    return this.find({ folder }).sort({ createdAt: -1 });
};

/**
 * Find documents uploaded by user
 */
DocumentSchema.statics.findByUploader = function (userId) {
    return this.find({ uploadedBy: userId })
        .populate('company', 'name')
        .sort({ createdAt: -1 });
};

/**
 * Get all unique folders
 */
DocumentSchema.statics.getFolders = async function (companyId = null) {
    const query = companyId ? { company: companyId } : {};
    return this.distinct('folder', query);
};

/**
 * Search documents by name
 */
DocumentSchema.statics.searchByName = function (searchTerm) {
    return this.find({
        name: { $regex: searchTerm, $options: 'i' },
    }).sort({ createdAt: -1 });
};

/**
 * Get storage statistics for client
 */
DocumentSchema.statics.getClientStorage = async function (clientId) {
    const result = await this.aggregate([
        { $match: { client: mongoose.Types.ObjectId(clientId) } },
        {
            $group: {
                _id: null,
                totalFiles: { $sum: 1 },
                totalSize: { $sum: '$fileSize' },
            },
        },
    ]);

    return result[0] || { totalFiles: 0, totalSize: 0 };
};

// 6. Virtuals

/**
 * Virtual: Formatted file size
 */
DocumentSchema.virtual('formattedSize').get(function () {
    if (!this.fileSize) return 'Unknown';

    const bytes = this.fileSize;
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
});

/**
 * Virtual: File extension
 */
DocumentSchema.virtual('fileExtension').get(function () {
    const parts = this.name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
});

/**
 * Virtual: Is image
 */
DocumentSchema.virtual('isImage').get(function () {
    return this.mimeType && this.mimeType.startsWith('image/');
});

/**
 * Virtual: Is PDF
 */
DocumentSchema.virtual('isPDF').get(function () {
    return this.mimeType === 'application/pdf';
});

/**
 * Virtual: Upload date (formatted)
 */
DocumentSchema.virtual('uploadDate').get(function () {
    return this.createdAt.toLocaleDateString('en-IN');
});

// 7. Query Helpers

/**
 * Filter by company
 */
DocumentSchema.query.byCompany = function (companyId) {
    return this.where({ company: companyId });
};

/**
 * Filter by folder
 */
DocumentSchema.query.byFolder = function (folder) {
    return this.where({ folder });
};

/**
 * Filter images only
 */
DocumentSchema.query.imagesOnly = function () {
    return this.where({ mimeType: /^image\// });
};

/**
 * Filter PDFs only
 */
DocumentSchema.query.pdfsOnly = function () {
    return this.where({ mimeType: 'application/pdf' });
};

/**
 * Sort by recent
 */
DocumentSchema.query.recent = function () {
    return this.sort({ createdAt: -1 });
};

module.exports = mongoose.model('Document', DocumentSchema);
