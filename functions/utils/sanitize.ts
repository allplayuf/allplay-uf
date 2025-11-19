// Input sanitization utilities for XSS protection

export function sanitizeText(input) {
  if (!input || typeof input !== 'string') return input;
  
  // Remove HTML tags
  let cleaned = input.replace(/<[^>]*>/g, '');
  
  // Escape special characters
  cleaned = cleaned
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Remove null bytes and control characters
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return cleaned.trim();
}

export function sanitizeMatchData(data) {
  return {
    ...data,
    title: sanitizeText(data.title),
    notes: data.notes ? sanitizeText(data.notes) : data.notes,
  };
}

export function sanitizeTeamData(data) {
  return {
    ...data,
    name: sanitizeText(data.name),
    description: data.description ? sanitizeText(data.description) : data.description,
  };
}

export function sanitizeCupData(data) {
  return {
    ...data,
    name: sanitizeText(data.name),
    description: data.description ? sanitizeText(data.description) : data.description,
    rules: data.rules ? sanitizeText(data.rules) : data.rules,
    prize: data.prize ? sanitizeText(data.prize) : data.prize,
  };
}

export function validateMatchData(data) {
  const errors = [];

  // Required fields
  if (!data.title || data.title.length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  if (data.title && data.title.length > 100) {
    errors.push('Title cannot exceed 100 characters');
  }

  if (!data.venue_id) {
    errors.push('Venue is required');
  }

  if (!data.date) {
    errors.push('Date is required');
  }

  // Validate date is not in the past
  const matchDate = new Date(data.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (matchDate < today) {
    errors.push('Match date cannot be in the past');
  }

  if (!data.time || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.time)) {
    errors.push('Valid time is required (HH:MM format)');
  }

  if (!data.format || !['5v5', '7v7', '11v11'].includes(data.format)) {
    errors.push('Valid format is required (5v5, 7v7, or 11v11)');
  }

  // Validate max_players for non-spontaneous matches
  if (!data.is_spontaneous) {
    if (!data.max_players || data.max_players < 4 || data.max_players > 50) {
      errors.push('Max players must be between 4 and 50');
    }
  }

  // Validate notes length
  if (data.notes && data.notes.length > 500) {
    errors.push('Notes cannot exceed 500 characters');
  }

  return errors;
}

export function validateTeamData(data) {
  const errors = [];

  if (!data.name || data.name.length < 3) {
    errors.push('Team name must be at least 3 characters');
  }
  if (data.name && data.name.length > 50) {
    errors.push('Team name cannot exceed 50 characters');
  }

  if (data.description && data.description.length > 500) {
    errors.push('Description cannot exceed 500 characters');
  }

  if (!data.city) {
    errors.push('City is required');
  }

  return errors;
}