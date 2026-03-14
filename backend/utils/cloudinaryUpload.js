const cloudinary = require('../config/cloudinary');
const ApiError = require('./ApiError');

/**
 * Upload file to Cloudinary from buffer
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalName - Original file name
 * @param {string} mimeType - MIME type
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<Object>} Upload result
 */
exports.uploadToCloudinary = async (fileBuffer, originalName, mimeType, folder = 'united-fillings') => {
    try {
        // Convert buffer to base64 data URI
        const b64 = Buffer.from(fileBuffer).toString('base64');
        const dataURI = `data:${mimeType};base64,${b64}`;

        // Sanitize filename and keep extension
        const extension = originalName.includes('.') ? originalName.slice(originalName.lastIndexOf('.')) : '';
        const nameWithoutExt = originalName.includes('.') ? originalName.slice(0, originalName.lastIndexOf('.')) : originalName;
        const sanitizedName = nameWithoutExt.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(dataURI, {
            resource_type: 'raw',
            folder: folder,
            public_id: `${Date.now()}-${sanitizedName}${extension}`,
            use_filename: true,
            unique_filename: false,
        });

        let fileUrl = uploadResult.secure_url;

        // Fix URL if it has /image/upload/ instead of /raw/upload/
        if (fileUrl.includes('/image/upload/')) {
            fileUrl = fileUrl.replace('/image/upload/', '/raw/upload/');
        }

        return {
            url: fileUrl,
            publicId: uploadResult.public_id,
            name: originalName
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new ApiError(500, 'File upload to Cloudinary failed');
    }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
exports.deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    } catch (error) {
        console.error('Cloudinary deletion error:', error);
    }
};
