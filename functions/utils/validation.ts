/**
 * Validation utilities for backend input validation
 * All user inputs should be validated on the backend to prevent malicious data
 */

// Email validation
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Phone number validation (Swedish format)
export function isValidPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^(\+46|0)[1-9]\d{8,9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

// URL validation
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Date validation (YYYY-MM-DD format)
export function isValidDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

// Time validation (HH:MM format)
export function isValidTime(timeString) {
  if (!timeString || typeof timeString !== 'string') return false;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

// Match validation
export function validateMatchData(data) {
  const errors = [];

  // Title validation
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required and must be a string');
  } else if (data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  } else if (data.title.trim().length > 100) {
    errors.push('Title must not exceed 100 characters');
  }

  // Venue ID validation
  if (!data.venue_id || typeof data.venue_id !== 'string') {
    errors.push('Venue ID is required');
  }

  // Date validation
  if (!isValidDate(data.date)) {
    errors.push('Valid date is required (YYYY-MM-DD)');
  } else {
    const matchDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (matchDate < today) {
      errors.push('Match date cannot be in the past');
    }
  }

  // Time validation
  if (!isValidTime(data.time)) {
    errors.push('Valid time is required (HH:MM)');
  }

  // Format validation
  const validFormats = ['5v5', '7v7', '11v11'];
  if (!validFormats.includes(data.format)) {
    errors.push('Format must be one of: 5v5, 7v7, 11v11');
  }

  // Max players validation (for non-spontaneous matches)
  if (!data.is_spontaneous) {
    if (typeof data.max_players !== 'number' || data.max_players < 2 || data.max_players > 50) {
      errors.push('Max players must be a number between 2 and 50');
    }
  }

  // Skill bracket validation
  const validSkillBrackets = ['beginner', 'intermediate', 'advanced', 'elite', 'mixed'];
  if (data.skill_bracket && !validSkillBrackets.includes(data.skill_bracket)) {
    errors.push('Invalid skill bracket');
  }

  // Notes validation
  if (data.notes && typeof data.notes === 'string' && data.notes.length > 1000) {
    errors.push('Notes must not exceed 1000 characters');
  }

  return { isValid: errors.length === 0, errors };
}

// Team validation
export function validateTeamData(data) {
  const errors = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Team name is required and must be a string');
  } else if (data.name.trim().length < 2) {
    errors.push('Team name must be at least 2 characters');
  } else if (data.name.trim().length > 50) {
    errors.push('Team name must not exceed 50 characters');
  }

  // Description validation
  if (data.description) {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }
  }

  // City validation
  if (!data.city || typeof data.city !== 'string') {
    errors.push('City is required');
  } else if (data.city.trim().length < 2) {
    errors.push('City must be at least 2 characters');
  }

  // Logo URL validation
  if (data.logo_url && !isValidUrl(data.logo_url)) {
    errors.push('Logo URL must be a valid URL');
  }

  // Max members validation
  if (data.max_members !== undefined) {
    if (typeof data.max_members !== 'number' || data.max_members < 2 || data.max_members > 100) {
      errors.push('Max members must be a number between 2 and 100');
    }
  }

  return { isValid: errors.length === 0, errors };
}

// User profile validation
export function validateUserProfile(data) {
  const errors = [];

  // Full name validation
  if (data.full_name !== undefined) {
    if (typeof data.full_name !== 'string') {
      errors.push('Full name must be a string');
    } else if (data.full_name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters');
    } else if (data.full_name.trim().length > 100) {
      errors.push('Full name must not exceed 100 characters');
    }
  }

  // Email validation
  if (data.email !== undefined && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  // Phone validation
  if (data.phone_number !== undefined && data.phone_number !== null && data.phone_number !== '') {
    if (!isValidPhoneNumber(data.phone_number)) {
      errors.push('Invalid phone number format');
    }
  }

  // Bio validation
  if (data.bio && typeof data.bio === 'string' && data.bio.length > 500) {
    errors.push('Bio must not exceed 500 characters');
  }

  // City validation
  if (data.city !== undefined) {
    if (typeof data.city !== 'string') {
      errors.push('City must be a string');
    } else if (data.city.trim().length > 100) {
      errors.push('City must not exceed 100 characters');
    }
  }

  // Profile image URL validation
  if (data.profile_image_url && !isValidUrl(data.profile_image_url)) {
    errors.push('Profile image URL must be a valid URL');
  }

  // Skill level validation
  const validSkillLevels = ['beginner', 'intermediate', 'advanced', 'elite'];
  if (data.skill_level && !validSkillLevels.includes(data.skill_level)) {
    errors.push('Invalid skill level');
  }

  // Birth year validation
  if (data.birth_year !== undefined) {
    const currentYear = new Date().getFullYear();
    if (typeof data.birth_year !== 'number' || data.birth_year < 1950 || data.birth_year > currentYear - 10) {
      errors.push('Birth year must be between 1950 and ' + (currentYear - 10));
    }
  }

  return { isValid: errors.length === 0, errors };
}

// Chat message validation
export function validateChatMessage(content) {
  const errors = [];

  if (!content || typeof content !== 'string') {
    errors.push('Message content is required and must be a string');
  } else if (content.trim().length === 0) {
    errors.push('Message cannot be empty');
  } else if (content.length > 1000) {
    errors.push('Message must not exceed 1000 characters');
  }

  return { isValid: errors.length === 0, errors };
}

// Venue validation
export function validateVenueData(data) {
  const errors = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Venue name is required');
  } else if (data.name.trim().length < 2) {
    errors.push('Venue name must be at least 2 characters');
  } else if (data.name.trim().length > 100) {
    errors.push('Venue name must not exceed 100 characters');
  }

  // Address validation
  if (!data.address || typeof data.address !== 'string') {
    errors.push('Address is required');
  } else if (data.address.trim().length < 5) {
    errors.push('Address must be at least 5 characters');
  }

  // Coordinates validation
  if (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90) {
    errors.push('Latitude must be a number between -90 and 90');
  }
  if (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180) {
    errors.push('Longitude must be a number between -180 and 180');
  }

  // City validation
  if (!data.city || typeof data.city !== 'string') {
    errors.push('City is required');
  }

  return { isValid: errors.length === 0, errors };
}

// Generic sanitization function
export function sanitizeString(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') return '';
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

// SQL injection prevention (additional layer)
export function containsSuspiciousPatterns(input) {
  if (!input || typeof input !== 'string') return false;
  
  const suspiciousPatterns = [
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(--)/,
    /(\/\*)/,
    /(\*\/)/,
    /(\bEXEC\b|\bEXECUTE\b)/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
}