const constants = require('../config/constants');
const ApiError = require('./ApiError');

/**
 * Forward-only Status Ranking
 * Higher number means further along in the process.
 */
const STATUS_RANK = {
    // Compliance Statuses (Uppercase)
    [constants.COMPLIANCE_STATUS.PENDING]: 0,
    [constants.COMPLIANCE_STATUS.PAYMENT_DONE]: 1,
    [constants.COMPLIANCE_STATUS.NEEDS_ACTION]: 2,
    [constants.COMPLIANCE_STATUS.IN_PROGRESS]: 3,
    [constants.COMPLIANCE_STATUS.WAITING_FOR_CLIENT]: 4,
    [constants.COMPLIANCE_STATUS.FILING_DONE]: 5,
    [constants.COMPLIANCE_STATUS.COMPLETED]: 6,
    [constants.COMPLIANCE_STATUS.DELAYED]: 0.5, // Treat as pending but slightly further
    [constants.COMPLIANCE_STATUS.OVERDUE]: 0.5,

    // Calendar Statuses (Lowercase - as used in calendarController)
    'pending': 0,
    'in_progress': 3,
    'needs_action': 2,
    'waiting_for_client': 4,
    'delayed': 0.5,
    'overdue': 0.5,
    'completed': 6
};

/**
 * Stage Ranking (Specific to Compliance)
 */
const STAGE_RANK = {
    [constants.COMPLIANCE_STAGES.PAYMENT]: 0,
    [constants.COMPLIANCE_STAGES.DOCUMENTATION]: 1,
    [constants.COMPLIANCE_STAGES.GOVT_APPROVAL]: 2,
    [constants.COMPLIANCE_STAGES.FILING_DONE]: 3
};

/**
 * Validates that status/stage is moving forward.
 * @param {string} current - Current status/stage
 * @param {string} next - Target status/stage
 * @param {'status' | 'stage'} type - Type of check
 * @throws {ApiError} if transition is backward
 */
const checkTransition = (current, next, type = 'status') => {
    const ranks = type === 'status' ? STATUS_RANK : STAGE_RANK;
    
    // If either status is unknown to the ranking system, allow it (fallback)
    if (ranks[current] === undefined || ranks[next] === undefined) {
        return true;
    }

    if (ranks[next] < ranks[current]) {
        throw new ApiError(
            400, 
            `Security Restriction: ${type.charAt(0).toUpperCase() + type.slice(1)} cannot be moved backward from "${current}" to "${next}".`
        );
    }
    
    return true;
};

module.exports = {
    checkTransition,
    STATUS_RANK,
    STAGE_RANK
};
