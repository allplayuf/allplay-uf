/**
 * Validation utilities specific to Cup/Tournament system
 */
import { isValidDate, isValidTime } from './validation.js';

/**
 * Validate cup/tournament data
 */
export function validateCupData(data) {
  const errors = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Tournament name is required and must be a string');
  } else if (data.name.trim().length < 3) {
    errors.push('Tournament name must be at least 3 characters');
  } else if (data.name.trim().length > 100) {
    errors.push('Tournament name must not exceed 100 characters');
  }

  // Location validation
  if (!data.location || typeof data.location !== 'string') {
    errors.push('Location is required');
  } else if (data.location.trim().length < 2) {
    errors.push('Location must be at least 2 characters');
  }

  // Date validation
  if (!isValidDate(data.start_date)) {
    errors.push('Valid start date is required (YYYY-MM-DD)');
  } else {
    const startDate = new Date(data.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      errors.push('Tournament start date cannot be in the past');
    }
  }

  if (data.end_date && !isValidDate(data.end_date)) {
    errors.push('Invalid end date format (YYYY-MM-DD)');
  }

  // Validate end date is after start date
  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    if (end < start) {
      errors.push('End date must be after start date');
    }
  }

  // Time validation
  if (data.start_time && !isValidTime(data.start_time)) {
    errors.push('Invalid time format (HH:MM)');
  }

  // Format validation
  const validFormats = ['5v5', '7v7', '11v11'];
  if (!validFormats.includes(data.format)) {
    errors.push('Format must be one of: 5v5, 7v7, 11v11');
  }

  // Signup type validation
  const validSignupTypes = ['team', 'solo'];
  if (!validSignupTypes.includes(data.signup_type)) {
    errors.push('Signup type must be either team or solo');
  }

  // Skill level validation
  const validSkillLevels = ['beginner', 'intermediate', 'advanced', 'elite', 'mixed'];
  if (data.skill_level && !validSkillLevels.includes(data.skill_level)) {
    errors.push('Invalid skill level');
  }

  // Max participants validation
  if (data.max_participants !== undefined) {
    if (typeof data.max_participants !== 'number' || data.max_participants < 4 || data.max_participants > 64) {
      errors.push('Max participants must be a number between 4 and 64');
    }
    // Must be power of 2 for bracket system
    if (data.has_playoffs && !isPowerOfTwo(data.max_participants)) {
      errors.push('Max participants must be a power of 2 (4, 8, 16, 32, 64) for playoff bracket');
    }
  }

  // Rules validation
  if (data.rules && typeof data.rules === 'string' && data.rules.length > 5000) {
    errors.push('Rules must not exceed 5000 characters');
  }

  // Description validation
  if (data.description && typeof data.description === 'string' && data.description.length > 1000) {
    errors.push('Description must not exceed 1000 characters');
  }

  // Number of groups validation
  if (data.number_of_groups !== undefined) {
    if (typeof data.number_of_groups !== 'number' || data.number_of_groups < 2 || data.number_of_groups > 8) {
      errors.push('Number of groups must be between 2 and 8');
    }
  }

  // Teams advance validation
  if (data.teams_advance_per_group !== undefined) {
    if (typeof data.teams_advance_per_group !== 'number' || data.teams_advance_per_group < 1 || data.teams_advance_per_group > 4) {
      errors.push('Teams advance per group must be between 1 and 4');
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate cup signup data
 */
export function validateCupSignup(data) {
  const errors = [];

  // Cup ID validation
  if (!data.cup_id || typeof data.cup_id !== 'string') {
    errors.push('Cup ID is required');
  }

  // Signup type validation
  const validSignupTypes = ['team', 'solo'];
  if (!validSignupTypes.includes(data.signup_type)) {
    errors.push('Signup type must be either team or solo');
  }

  // For team signups, team_id is required
  if (data.signup_type === 'team' && !data.team_id) {
    errors.push('Team ID is required for team signups');
  }

  // For solo signups, user_id is required
  if (data.signup_type === 'solo' && !data.user_id) {
    errors.push('User ID is required for solo signups');
  }

  // Position validation for solo signups
  if (data.signup_type === 'solo' && data.preferred_position) {
    const validPositions = ['goalkeeper', 'defender', 'midfielder', 'forward', 'any'];
    if (!validPositions.includes(data.preferred_position)) {
      errors.push('Invalid preferred position');
    }
  }

  // Notes validation
  if (data.notes && typeof data.notes === 'string' && data.notes.length > 500) {
    errors.push('Notes must not exceed 500 characters');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate cup match result data
 */
export function validateCupMatchResult(data) {
  const errors = [];

  // Cup match ID validation
  if (!data.cup_match_id || typeof data.cup_match_id !== 'string') {
    errors.push('Cup match ID is required');
  }

  // Score validation
  if (data.team_a_score !== undefined) {
    if (typeof data.team_a_score !== 'number' || data.team_a_score < 0 || data.team_a_score > 50) {
      errors.push('Team A score must be a number between 0 and 50');
    }
  }

  if (data.team_b_score !== undefined) {
    if (typeof data.team_b_score !== 'number' || data.team_b_score < 0 || data.team_b_score > 50) {
      errors.push('Team B score must be a number between 0 and 50');
    }
  }

  // Penalty score validation
  if (data.penalty_score && typeof data.penalty_score === 'string') {
    const penaltyRegex = /^\d+-\d+$/;
    if (!penaltyRegex.test(data.penalty_score)) {
      errors.push('Penalty score must be in format "X-Y" (e.g. "5-4")');
    }
  }

  // Scorers validation
  if (data.scorers && Array.isArray(data.scorers)) {
    data.scorers.forEach((scorer, index) => {
      if (!scorer.user_id || typeof scorer.user_id !== 'string') {
        errors.push(`Scorer ${index + 1}: User ID is required`);
      }
      if (!scorer.team_id || typeof scorer.team_id !== 'string') {
        errors.push(`Scorer ${index + 1}: Team ID is required`);
      }
      if (scorer.minute !== undefined && (typeof scorer.minute !== 'number' || scorer.minute < 0 || scorer.minute > 150)) {
        errors.push(`Scorer ${index + 1}: Minute must be between 0 and 150`);
      }
    });
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Helper function to check if number is power of 2
 */
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}