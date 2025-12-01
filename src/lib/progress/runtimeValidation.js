/**
 * Runtime Data Validation
 * 
 * Provides lightweight validation for critical data structures before persistence
 * to prevent database corruption.
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('progress:validation');

/**
 * Validates an attempt object before saving
 * @param {Object} attempt - The attempt object to validate
 * @throws {Error} If validation fails
 */
export function validateAttempt(attempt) {
    if (!attempt) {
        throw new Error('Attempt object is null or undefined');
    }

    const errors = [];

    // Required fields
    if (!attempt.userId || typeof attempt.userId !== 'string') {
        errors.push('Missing or invalid userId');
    }

    if (!attempt.itemId || typeof attempt.itemId !== 'string') {
        errors.push('Missing or invalid itemId');
    }

    if (typeof attempt.correct !== 'boolean') {
        errors.push('Missing or invalid correct status');
    }

    // Timestamp validation
    const timestamp = attempt.createdAt || attempt.timestamp;
    if (!timestamp) {
        // Will be auto-generated if missing, so just a warning in dev
        // but strictly speaking we want to ensure it's handled
    } else {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            errors.push('Invalid timestamp');
        }
    }

    // Structure validation
    if (attempt.errorTags && !Array.isArray(attempt.errorTags)) {
        errors.push('errorTags must be an array');
    }

    if (errors.length > 0) {
        const msg = `Invalid attempt data: ${errors.join(', ')}`;
        logger.error('validateAttempt', msg, attempt);
        throw new Error(msg);
    }

    return true;
}
