/**
 * Content sanitization utilities to prevent XSS attacks
 * Sanitizes user-generated content before storing or displaying
 */

/**
 * HTML entity encoding to prevent XSS
 * This is a basic implementation - for production, consider using a library like DOMPurify
 */
export function escapeHtml(text) {
  if (!text || typeof text !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Remove potentially dangerous HTML tags and attributes
 */
export function stripHtml(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Remove all HTML tags
  let cleaned = text.replace(/<[^>]*>/g, '');
  
  // Remove script tags and their content
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their content
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Decode HTML entities
  cleaned = decodeHtmlEntities(cleaned);
  
  return cleaned.trim();
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
  };
  
  return text.replace(/&[a-z]+;|&#x[0-9a-f]+;/gi, (entity) => entities[entity] || entity);
}

/**
 * Sanitize user input for safe storage and display
 * Removes dangerous content but preserves basic formatting
 */
export function sanitizeUserInput(input, options = {}) {
  if (!input || typeof input !== 'string') return '';
  
  const {
    allowLineBreaks = true,
    maxLength = 10000,
    stripHtmlTags = true
  } = options;
  
  let sanitized = input;
  
  // Strip HTML if requested
  if (stripHtmlTags) {
    sanitized = stripHtml(sanitized);
  } else {
    // At minimum, escape dangerous characters
    sanitized = escapeHtml(sanitized);
  }
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Normalize line breaks
  if (allowLineBreaks) {
    sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Limit consecutive line breaks
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  } else {
    sanitized = sanitized.replace(/[\r\n]+/g, ' ');
  }
  
  // Trim excessive whitespace
  sanitized = sanitized.replace(/[ \t]+/g, ' ').trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }
  
  // Only allow http, https, and relative URLs
  if (!trimmed.startsWith('http://') && 
      !trimmed.startsWith('https://') && 
      !trimmed.startsWith('/') &&
      !trimmed.startsWith('./')) {
    return '';
  }
  
  return url.trim();
}

/**
 * Sanitize match data
 */
export function sanitizeMatchData(data) {
  return {
    ...data,
    title: sanitizeUserInput(data.title, { maxLength: 100, stripHtmlTags: true }),
    notes: data.notes ? sanitizeUserInput(data.notes, { maxLength: 1000, allowLineBreaks: true }) : '',
  };
}

/**
 * Sanitize team data
 */
export function sanitizeTeamData(data) {
  return {
    ...data,
    name: sanitizeUserInput(data.name, { maxLength: 50, stripHtmlTags: true }),
    description: data.description ? sanitizeUserInput(data.description, { maxLength: 500, allowLineBreaks: true }) : '',
    city: sanitizeUserInput(data.city, { maxLength: 100, stripHtmlTags: true }),
    logo_url: data.logo_url ? sanitizeUrl(data.logo_url) : '',
  };
}

/**
 * Sanitize user profile data
 */
export function sanitizeUserProfile(data) {
  const sanitized = {
    ...data
  };
  
  if (data.full_name) {
    sanitized.full_name = sanitizeUserInput(data.full_name, { maxLength: 100, stripHtmlTags: true });
  }
  
  if (data.bio) {
    sanitized.bio = sanitizeUserInput(data.bio, { maxLength: 500, allowLineBreaks: true });
  }
  
  if (data.city) {
    sanitized.city = sanitizeUserInput(data.city, { maxLength: 100, stripHtmlTags: true });
  }
  
  if (data.profile_image_url) {
    sanitized.profile_image_url = sanitizeUrl(data.profile_image_url);
  }
  
  return sanitized;
}

/**
 * Sanitize chat message
 */
export function sanitizeChatMessage(content) {
  return sanitizeUserInput(content, { 
    maxLength: 1000, 
    allowLineBreaks: false,
    stripHtmlTags: true 
  });
}

/**
 * Sanitize venue data
 */
export function sanitizeVenueData(data) {
  return {
    ...data,
    name: sanitizeUserInput(data.name, { maxLength: 100, stripHtmlTags: true }),
    address: sanitizeUserInput(data.address, { maxLength: 200, stripHtmlTags: true }),
    city: sanitizeUserInput(data.city, { maxLength: 100, stripHtmlTags: true }),
    contact_info: data.contact_info ? sanitizeUserInput(data.contact_info, { maxLength: 200 }) : '',
    image_url: data.image_url ? sanitizeUrl(data.image_url) : '',
  };
}