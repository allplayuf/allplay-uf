/**
 * Input Validation Utility
 * Provides comprehensive validation for all entity types
 */

/**
 * Validate match data
 */
export function validateMatchData(data) {
  const errors = [];
  
  // Required fields
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (data.title && data.title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }
  
  if (!data.venue_id) {
    errors.push('Venue is required');
  }
  
  if (!data.date) {
    errors.push('Date is required');
  }
  
  if (!data.time) {
    errors.push('Time is required');
  }
  
  if (!data.format || !['5v5', '7v7', '11v11'].includes(data.format)) {
    errors.push('Format must be 5v5, 7v7, or 11v11');
  }
  
  // Validate date format
  if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('Date must be in YYYY-MM-DD format');
  }
  
  // Validate time format
  if (data.time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.time)) {
    errors.push('Time must be in HH:MM format');
  }
  
  // Validate max_players
  if (!data.is_spontaneous) {
    if (!data.max_players || data.max_players < 2) {
      errors.push('max_players must be at least 2');
    }
    if (data.max_players > 50) {
      errors.push('max_players cannot exceed 50');
    }
  }
  
  // Validate skill_bracket
  const validSkillBrackets = ['beginner', 'intermediate', 'advanced', 'elite', 'mixed'];
  if (data.skill_bracket && !validSkillBrackets.includes(data.skill_bracket)) {
    errors.push(`skill_bracket must be one of: ${validSkillBrackets.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate team data
 */
export function validateTeamData(data) {
  const errors = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Team name is required');
  }
  
  if (data.name && data.name.length > 50) {
    errors.push('Team name must be less than 50 characters');
  }
  
  if (!data.city || data.city.trim().length === 0) {
    errors.push('City is required');
  }
  
  if (data.description && data.description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }
  
  if (data.max_members && (data.max_members < 5 || data.max_members > 50)) {
    errors.push('max_members must be between 5 and 50');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate cup data
 */
export function validateCupData(data) {
  const errors = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Cup name is required');
  }
  
  if (data.name && data.name.length > 100) {
    errors.push('Cup name must be less than 100 characters');
  }
  
  if (!data.location || data.location.trim().length === 0) {
    errors.push('Location is required');
  }
  
  if (!data.start_date) {
    errors.push('Start date is required');
  }
  
  if (!data.start_time) {
    errors.push('Start time is required');
  }
  
  if (!data.format || !['5v5', '7v7', '11v11'].includes(data.format)) {
    errors.push('Format must be 5v5, 7v7, or 11v11');
  }
  
  if (!data.signup_type || !['team', 'solo'].includes(data.signup_type)) {
    errors.push('Signup type must be team or solo');
  }
  
  if (!data.max_participants || data.max_participants < 4 || data.max_participants > 64) {
    errors.push('max_participants must be between 4 and 64');
  }
  
  if (data.number_of_groups && (data.number_of_groups < 2 || data.number_of_groups > 8)) {
    errors.push('number_of_groups must be between 2 and 8');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate user profile data
 */
export function validateUserData(data) {
  const errors = [];
  
  if (data.full_name !== undefined) {
    if (!data.full_name || data.full_name.trim().length === 0) {
      errors.push('Full name is required');
    }
    if (data.full_name && data.full_name.length > 50) {
      errors.push('Full name must be less than 50 characters');
    }
  }
  
  if (data.bio !== undefined && data.bio.length > 500) {
    errors.push('Bio must be less than 500 characters');
  }
  
  if (data.city !== undefined && data.city.length > 50) {
    errors.push('City must be less than 50 characters');
  }
  
  const validSkillLevels = ['beginner', 'intermediate', 'advanced', 'elite'];
  if (data.skill_level && !validSkillLevels.includes(data.skill_level)) {
    errors.push(`skill_level must be one of: ${validSkillLevels.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}