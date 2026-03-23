/**
 * Request Validation Utility
 * Validates common request patterns and input data
 */

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(data, requiredFields) {
  const missing = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return true;
}

/**
 * Validate date is not in the past
 */
export function validateFutureDate(dateString, timeString = '00:00') {
  const date = new Date(`${dateString}T${timeString}`);
  const now = new Date();
  
  if (date < now) {
    throw new Error('Date cannot be in the past');
  }
  
  return true;
}

/**
 * Validate date range
 */
export function validateDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (end < start) {
    throw new Error('End date must be after start date');
  }
  
  return true;
}

/**
 * Validate number within range
 */
export function validateNumberRange(value, min, max, fieldName = 'Value') {
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a number`);
  }
  
  if (num < min || num > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
  
  return true;
}

/**
 * Validate string length
 */
export function validateStringLength(value, maxLength, fieldName = 'Field') {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  
  if (value.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or less`);
  }
  
  return true;
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  return true;
}

/**
 * Validate enum value
 */
export function validateEnum(value, allowedValues, fieldName = 'Value') {
  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
  
  return true;
}

/**
 * Validate array length
 */
export function validateArrayLength(arr, minLength, maxLength, fieldName = 'Array') {
  if (!Array.isArray(arr)) {
    throw new Error(`${fieldName} must be an array`);
  }
  
  if (arr.length < minLength) {
    throw new Error(`${fieldName} must have at least ${minLength} items`);
  }
  
  if (maxLength && arr.length > maxLength) {
    throw new Error(`${fieldName} must have at most ${maxLength} items`);
  }
  
  return true;
}

/**
 * Comprehensive match data validation
 */
export function validateMatchData(data) {
  validateRequiredFields(data, ['title', 'venue_id', 'date', 'time', 'format']);
  validateFutureDate(data.date, data.time);
  validateStringLength(data.title, 100, 'Title');
  validateEnum(data.format, ['5v5', '7v7', '11v11'], 'Format');
  
  if (data.skill_bracket) {
    validateEnum(data.skill_bracket, ['beginner', 'intermediate', 'advanced', 'elite', 'mixed'], 'Skill bracket');
  }
  
  if (data.max_players && !data.is_spontaneous) {
    validateNumberRange(data.max_players, 4, 50, 'Max players');
  }
  
  if (data.notes) {
    validateStringLength(data.notes, 500, 'Notes');
  }
  
  return true;
}

/**
 * Comprehensive cup data validation
 */
export function validateCupData(data) {
  validateRequiredFields(data, ['name', 'location', 'start_date', 'start_time', 'format', 'max_participants']);
  validateFutureDate(data.start_date, data.start_time);
  validateStringLength(data.name, 100, 'Name');
  validateStringLength(data.location, 100, 'Location');
  validateEnum(data.format, ['5v5', '7v7', '11v11'], 'Format');
  validateEnum(data.signup_type, ['team', 'solo'], 'Signup type');
  validateNumberRange(data.max_participants, 4, 64, 'Max participants');
  
  if (data.end_date) {
    validateDateRange(data.start_date, data.end_date);
  }
  
  if (data.description) {
    validateStringLength(data.description, 1000, 'Description');
  }
  
  if (data.rules) {
    validateStringLength(data.rules, 1000, 'Rules');
  }
  
  if (data.number_of_groups) {
    validateNumberRange(data.number_of_groups, 2, 8, 'Number of groups');
  }
  
  return true;
}

/**
 * Comprehensive team data validation
 */
export function validateTeamData(data) {
  validateRequiredFields(data, ['name', 'city']);
  validateStringLength(data.name, 50, 'Name');
  validateStringLength(data.city, 50, 'City');
  
  if (data.description) {
    validateStringLength(data.description, 500, 'Description');
  }
  
  if (data.max_members) {
    validateNumberRange(data.max_members, 5, 50, 'Max members');
  }
  
  return true;
}