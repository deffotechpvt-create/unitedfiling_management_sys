/**
 * Helper Utility Functions
 */

/**
 * Generate unique ticket number for consultations
 * Format: TKT-TIMESTAMP-RANDOM
 */
exports.generateTicketNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `TKT-${timestamp}-${random}`;
};

/**
 * Format file size in bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
exports.formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

/**
 * Generate public URL for R2 uploaded file
 * @param {string} key - File key in R2 bucket
 * @returns {string} Public URL
 */
exports.generatePublicUrl = (key) => {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
};

/**
 * Generate unique file name
 * @param {string} originalName - Original file name
 * @returns {string} Unique file name
 */
exports.generateUniqueFileName = (originalName) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.split('.').slice(0, -1).join('.');
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${sanitized}_${timestamp}_${random}.${extension}`;
};

/**
 * Paginate results
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} Pagination object with skip and limit
 */
exports.getPagination = (page = 1, limit = 20) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  const skip = (pageNum - 1) * limitNum;
  
  return {
    skip,
    limit: limitNum,
    page: pageNum,
  };
};

/**
 * Build pagination metadata
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} Pagination metadata
 */
exports.buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
