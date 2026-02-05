// utils/ApiResponse.js

/**
 * Simple API Response Class
 * Spreads all properties directly into response
 */
class ApiResponse {
  constructor(statusCode, responseData) {
    // Always include success
    this.success = statusCode >= 200 && statusCode < 300;

    // If responseData is a string, treat as message
    if (typeof responseData === 'string') {
      this.message = responseData;
    }
    // If responseData is an object, spread all properties
    else if (responseData && typeof responseData === 'object') {
      Object.assign(this, responseData);
    }
  }
}

module.exports = ApiResponse;
