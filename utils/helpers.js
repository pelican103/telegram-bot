// utils/helpers.js

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
      primary: {
        english: false,
        math: false,
        science: false,
        chinese: false,
        malay: false,
        tamil: false
      },
      secondary: {
        english: false,
        math: false,
        aMath: false,
        eMath: false,
        physics: false,
        chemistry: false,
        biology: false,
        science: false,
        history: false,
        geography: false,
        literature: false,
        chinese: false,
        malay: false,
        tamil: false
      },
      jc: {
        generalPaper: false,
        h1Math: false,
        h2Math: false,
        h1Physics: false,
        h2Physics: false,
        h1Chemistry: false,
        h2Chemistry: false,
        h1Biology: false,
        h2Biology: false,
        h1Economics: false,
        h2Economics: false,
        h1History: false,
        h2History: false
      },
      international: {
        ib: false,
        igcse: false,
        ielts: false,
        toefl: false
      }
    };
  }
}

/**
 * Initialize availability object with default values
 */
export function initializeAvailability(tutor) {
  if (!tutor.availableTimeSlots) {
    tutor.availableTimeSlots = {
      weekdayMorning: false,
      weekdayAfternoon: false,
      weekdayEvening: false,
      weekendMorning: false,
      weekendAfternoon: false,
      weekendEvening: false
    };
  }
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

export function initializeAssignment(tutorId) {
  return {
    title: '',
    level: '',
    subject: '',
    location: '',
    frequency: '',
    duration: 0,
    rate: 0,
    rateType: 'hour',
    studentGender: 'Any',
    studentCount: 1,
    tutorRequirements: {
      gender: 'Any',
      race: 'Any',
      experience: 'None',
      qualifications: 'Any'
    },
    preferredTiming: {
      weekday: {
        morning: false,
        afternoon: false,
        evening: false
      },
      weekend: {
        morning: false,
        afternoon: false,
        evening: false
      }
    },
    additionalDetails: '',
    notes: '',
    status: 'Open',
    startDate: null,
    deadline: null,
    applicants: [],
    tutor: tutorId
  };
}

export function validateAssignment(assignment) {
  const errors = [];

  if (!assignment.title) {
    errors.push('Title is required');
  }

  if (!assignment.level) {
    errors.push('Education level is required');
  }

  if (!assignment.subject) {
    errors.push('Subject is required');
  }

  if (!assignment.location) {
    errors.push('Location is required');
  }

  if (!assignment.frequency) {
    errors.push('Frequency is required');
  }

  if (!assignment.duration || assignment.duration <= 0) {
    errors.push('Duration must be greater than 0');
  }

  if (!assignment.rate || assignment.rate <= 0) {
    errors.push('Rate must be greater than 0');
  }

  if (!assignment.studentCount || assignment.studentCount <= 0) {
    errors.push('Student count must be greater than 0');
  }

  // Check if at least one time slot is selected
  const hasTimeSlot = assignment.preferredTiming &&
    ((assignment.preferredTiming.weekday &&
      (assignment.preferredTiming.weekday.morning ||
       assignment.preferredTiming.weekday.afternoon ||
       assignment.preferredTiming.weekday.evening)) ||
     (assignment.preferredTiming.weekend &&
      (assignment.preferredTiming.weekend.morning ||
       assignment.preferredTiming.weekend.afternoon ||
       assignment.preferredTiming.weekend.evening)));

  if (!hasTimeSlot) {
    errors.push('At least one time slot must be selected');
  }

  return errors;
}

export function formatTimeSlot(timeSlot) {
  const { weekday, weekend } = timeSlot;
  let text = '';

  if (weekday) {
    text += 'Weekdays: ';
    const weekdaySlots = [];
    if (weekday.morning) weekdaySlots.push('Morning (8AM-12PM)');
    if (weekday.afternoon) weekdaySlots.push('Afternoon (12PM-6PM)');
    if (weekday.evening) weekdaySlots.push('Evening (6PM-10PM)');
    text += weekdaySlots.join(', ') + '\n';
  }

  if (weekend) {
    text += 'Weekends: ';
    const weekendSlots = [];
    if (weekend.morning) weekendSlots.push('Morning (8AM-12PM)');
    if (weekend.afternoon) weekendSlots.push('Afternoon (12PM-6PM)');
    if (weekend.evening) weekendSlots.push('Evening (6PM-10PM)');
    text += weekendSlots.join(', ');
  }

  return text;
}