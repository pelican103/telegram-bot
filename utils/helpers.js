// utils/helpers.js

export function normalizePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    const variations = [digits];
    if (digits.startsWith('65') && digits.length > 8) {
      variations.push(digits.slice(2));
    } else if (digits.length === 8) {
      variations.push('65' + digits);
    }
    return variations;
  }
  
  export function initializeTeachingLevels(tutor) {
    tutor.teachingLevels = tutor.teachingLevels || {
      primary: false,
      secondary: false,
      jc: false,
      ib: false,
      others: false,
    };
  }
  
  export function initializeAvailability(tutor) {
    tutor.availability = tutor.availability || {
      weekdays: false,
      weekends: false,
      mornings: false,
      afternoons: false,
      evenings: false,
    };
  }
  
  export function getTick(bool) {
    return bool ? '✅' : '⬜';
  }
  
  export function paginate(array, page = 0, perPage = 5) {
    const start = page * perPage;
    return array.slice(start, start + perPage);
  }
  