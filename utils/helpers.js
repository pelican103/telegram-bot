// utils/helpers.js

/**
 * Normalize phone number to generate search variations
 * Handles Singapore phone numbers with and without country code
 */
export function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  const variations = [digits];
  
  // Handle Singapore numbers (country code 65)
  if (digits.startsWith('65') && digits.length > 8) {
    variations.push(digits.slice(2));
  } else if (digits.length === 8) {
    variations.push('65' + digits);
  }
  
  // Add variations with common prefixes/formats
  if (digits.length === 8) {
    variations.push('+65' + digits);
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

/**
 * Initialize teaching levels object with default values
 */
export function initializeTeachingLevels(tutor) {
  if (!tutor.teachingLevels) {
    tutor.teachingLevels = {
      primary: false,
      secondary: false,
      jc: false,
      ib: false,
      others: false,
    };
  }
  
  // Ensure all required fields exist
  const requiredLevels = ['primary', 'secondary', 'jc', 'ib', 'others'];
  requiredLevels.forEach(level => {
    if (tutor.teachingLevels[level] === undefined) {
      tutor.teachingLevels[level] = false;
    }
  });
}

/**
 * Initialize availability object with default values
 */
export function initializeAvailability(tutor) {
  if (!tutor.availability) {
    tutor.availability = {
      weekdays: false,
      weekends: false,
      mornings: false,
      afternoons: false,
      evenings: false,
    };
  }
  
  // Ensure all required fields exist
  const requiredAvailability = ['weekdays', 'weekends', 'mornings', 'afternoons', 'evenings'];
  requiredAvailability.forEach(slot => {
    if (tutor.availability[slot] === undefined) {
      tutor.availability[slot] = false;
    }
  });
}

/**
 * Get tick mark or empty box based on boolean value
 */
export function getTick(bool) {
  return bool ? '✅' : '⬜';
}

/**
 * Paginate an array into chunks
 * @param {Array} array - Array to paginate
 * @param {number} page - Page number (0-based)
 * @param {number} perPage - Items per page
 * @returns {Array} Paginated slice of the array
 */
export function paginate(array, page = 0, perPage = 5) {
  const start = page * perPage;
  return array.slice(start, start + perPage);
}

/**
 * Calculate pagination metadata
 * @param {number} totalItems - Total number of items
 * @param {number} currentPage - Current page (1-based)
 * @param {number} itemsPerPage - Items per page
 * @returns {Object} Pagination metadata
 */
export function getPaginationInfo(totalItems, currentPage = 1, itemsPerPage = 5) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  
  return {
    currentPage: safePage,
    totalPages,
    itemsPerPage,
    totalItems,
    startIndex,
    endIndex,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
    startItem: startIndex + 1,
    endItem: endIndex
  };
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Safe string comparison (case insensitive)
 */
export function compareStrings(str1, str2) {
  if (!str1 || !str2) return false;
  return str1.toString().toLowerCase() === str2.toString().toLowerCase();
}

/**
 * Format date for display
 */
export function formatDate(date) {
  if (!date) return 'Unknown';
  const d = new Date(date);
  return d.toLocaleDateString('en-SG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format time for display
 */
export function formatDateTime(date) {
  if (!date) return 'Unknown';
  const d = new Date(date);
  return d.toLocaleString('en-SG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Validate required fields in an object
 */
export function validateRequiredFields(obj, requiredFields) {
  const missing = [];
  for (const field of requiredFields) {
    if (!obj[field] || (typeof obj[field] === 'string' && obj[field].trim() === '')) {
      missing.push(field);
    }
  }
  return missing;
}

/**
 * Generate a safe callback data string (max 64 chars for Telegram)
 */
export function createCallbackData(action, ...params) {
  const data = [action, ...params].join('_');
  if (data.length > 64) {
    console.warn(`Callback data too long: ${data}`);
    return data.substring(0, 64);
  }
  return data;
}

/**
 * Parse callback data back into components
 */
export function parseCallbackData(callbackData) {
  const parts = callbackData.split('_');
  return {
    action: parts[0],
    params: parts.slice(1)
  };
}