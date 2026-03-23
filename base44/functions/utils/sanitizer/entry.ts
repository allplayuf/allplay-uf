/**
 * Input Sanitization Utility
 * Protects against XSS attacks by sanitizing user input
 */

const ALLOWED_TAGS = ['b', 'i', 'u', 'strong', 'em', 'p', 'br'];
const MAX_LENGTHS = {
  title: 100,
  name: 50,
  bio: 500,
  description: 1000,
  notes: 500,
  message: 2000
};

/**
 * Remove HTML tags except allowed ones
 */
function stripHtmlTags(input, allowedTags = []) {
  if (!input) return '';
  
  let result = String(input);
  
  // Remove all HTML tags except allowed ones
  const tagPattern = allowedTags.length > 0 
    ? new RegExp(`<(?!\\/?(${allowedTags.join('|')})\\b)[^>]*>`, 'gi')
    : /<[^>]*>/g;
  
  result = result.replace(tagPattern, '');
  
  // Remove script and style tags content
  result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  return result;
}

/**
 * Escape HTML entities
 */
function escapeHtml(input) {
  if (!input) return '';
  
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return String(input).replace(/[&<>"'/]/g, char => htmlEntities[char]);
}

/**
 * Sanitize string with max length
 */
function sanitizeString(input, maxLength = 1000, allowHtml = false) {
  if (!input) return '';
  
  let sanitized = String(input).trim();
  
  // Remove HTML or escape it
  sanitized = allowHtml 
    ? stripHtmlTags(sanitized, ALLOWED_TAGS)
    : escapeHtml(sanitized);
  
  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize match data
 */
export function sanitizeMatchData(data) {
  return {
    ...data,
    title: sanitizeString(data.title, MAX_LENGTHS.title),
    notes: data.notes ? sanitizeString(data.notes, MAX_LENGTHS.notes) : undefined,
  };
}

/**
 * Sanitize team data
 */
export function sanitizeTeamData(data) {
  return {
    ...data,
    name: sanitizeString(data.name, MAX_LENGTHS.name),
    description: data.description ? sanitizeString(data.description, MAX_LENGTHS.description) : undefined,
  };
}

/**
 * Sanitize user data
 */
export function sanitizeUserData(data) {
  return {
    ...data,
    full_name: data.full_name ? sanitizeString(data.full_name, MAX_LENGTHS.name) : undefined,
    bio: data.bio ? sanitizeString(data.bio, MAX_LENGTHS.bio) : undefined,
    city: data.city ? sanitizeString(data.city, MAX_LENGTHS.name) : undefined,
  };
}

/**
 * Sanitize message data
 */
export function sanitizeMessageData(data) {
  return {
    ...data,
    content: sanitizeString(data.content, MAX_LENGTHS.message),
  };
}

/**
 * Sanitize cup data
 */
export function sanitizeCupData(data) {
  return {
    ...data,
    name: sanitizeString(data.name, MAX_LENGTHS.title),
    description: data.description ? sanitizeString(data.description, MAX_LENGTHS.description) : undefined,
    rules: data.rules ? sanitizeString(data.rules, MAX_LENGTHS.description) : undefined,
    prize: data.prize ? sanitizeString(data.prize, MAX_LENGTHS.description) : undefined,
  };
}