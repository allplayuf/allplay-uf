/**
 * Profile Field Validation Utilities
 * 
 * Centralized validation for profile fields with Swedish error messages.
 * Includes profanity filter and max-length enforcement.
 */

// Simple profanity filter — Swedish + English common words
const BLOCKED_WORDS = [
  'fan', 'jävla', 'fitta', 'kuk', 'hora', 'bög', 'neger',
  'fuck', 'shit', 'ass', 'bitch', 'dick', 'pussy', 'nigger',
  'retard', 'faggot', 'whore', 'cunt'
];

function containsProfanity(text) {
  if (!text) return false;
  const lower = text.toLowerCase().replace(/[^a-zåäö]/g, ' ');
  return BLOCKED_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lower);
  });
}

export const FIELD_LIMITS = {
  display_name: { min: 2, max: 40 },
  bio: { max: 200 },
  username: { min: 3, max: 30 },
  city: { max: 50 },
};

export const SKILL_LEVELS = [
  { value: 'beginner', label: 'Nybörjare' },
  { value: 'intermediate', label: 'Medel' },
  { value: 'advanced', label: 'Avancerad' },
  { value: 'elite', label: 'Elit' },
];

const USERNAME_REGEX = /^[a-z0-9._]{3,30}$/;

/**
 * Validate a single field
 * @returns {string|null} Error message or null if valid
 */
export function validateField(field, value) {
  const trimmed = (value || '').trim();

  switch (field) {
    case 'display_name': {
      if (!trimmed || trimmed.length < FIELD_LIMITS.display_name.min) {
        return `Namn måste vara minst ${FIELD_LIMITS.display_name.min} tecken`;
      }
      if (trimmed.length > FIELD_LIMITS.display_name.max) {
        return `Namn får vara max ${FIELD_LIMITS.display_name.max} tecken`;
      }
      if (containsProfanity(trimmed)) {
        return 'Namnet innehåller otillåtna ord';
      }
      return null;
    }

    case 'bio': {
      if (trimmed.length > FIELD_LIMITS.bio.max) {
        return `Bio får vara max ${FIELD_LIMITS.bio.max} tecken`;
      }
      if (containsProfanity(trimmed)) {
        return 'Bio innehåller otillåtna ord';
      }
      return null;
    }

    case 'username': {
      if (!trimmed) return null; // Optional
      if (trimmed.length < FIELD_LIMITS.username.min) {
        return `Användarnamn måste vara minst ${FIELD_LIMITS.username.min} tecken`;
      }
      if (trimmed.length > FIELD_LIMITS.username.max) {
        return `Användarnamn får vara max ${FIELD_LIMITS.username.max} tecken`;
      }
      if (!USERNAME_REGEX.test(trimmed)) {
        return 'Endast små bokstäver, siffror, punkt och understreck';
      }
      if (containsProfanity(trimmed)) {
        return 'Användarnamnet innehåller otillåtna ord';
      }
      return null;
    }

    case 'city': {
      if (trimmed.length > FIELD_LIMITS.city.max) {
        return `Stad får vara max ${FIELD_LIMITS.city.max} tecken`;
      }
      if (containsProfanity(trimmed)) {
        return 'Fältet innehåller otillåtna ord';
      }
      return null;
    }

    case 'skill_level': {
      if (trimmed && !SKILL_LEVELS.some(s => s.value === trimmed)) {
        return 'Ogiltig nivå vald';
      }
      return null;
    }

    case 'birth_year': {
      if (!trimmed) return null; // Optional
      const year = parseInt(trimmed, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1930 || year > currentYear - 5) {
        return `Födelseår måste vara mellan 1930 och ${currentYear - 5}`;
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Validate all profile fields
 * @returns {{ [field]: string }} Map of field -> error message
 */
export function validateAllFields(data) {
  const errors = {};
  const fieldsToValidate = ['display_name', 'bio', 'username', 'city', 'skill_level', 'birth_year'];

  for (const field of fieldsToValidate) {
    const error = validateField(field, data[field]);
    if (error) {
      errors[field] = error;
    }
  }

  return errors;
}