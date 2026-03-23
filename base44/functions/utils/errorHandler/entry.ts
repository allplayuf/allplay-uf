/**
 * Centralized Error Handling Utility
 * Provides consistent error responses across all backend functions
 */

/**
 * Error types for better error handling
 */
export const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  CONFLICT: 'CONFLICT_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  SERVER: 'SERVER_ERROR'
};

/**
 * HTTP status codes mapping
 */
const StatusCodes = {
  [ErrorTypes.VALIDATION]: 400,
  [ErrorTypes.AUTHENTICATION]: 401,
  [ErrorTypes.AUTHORIZATION]: 403,
  [ErrorTypes.NOT_FOUND]: 404,
  [ErrorTypes.CONFLICT]: 409,
  [ErrorTypes.RATE_LIMIT]: 429,
  [ErrorTypes.SERVER]: 500
};

/**
 * Create standardized error response
 */
export function createErrorResponse(error, type = ErrorTypes.SERVER, details = null) {
  const status = StatusCodes[type] || 500;
  
  const response = {
    success: false,
    error: error.message || 'An error occurred',
    type,
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    response.details = details;
  }
  
  // Log server errors for monitoring
  if (status >= 500) {
    console.error(`[${type}]`, error);
  }
  
  return Response.json(response, { status });
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling(handler) {
  return async (req) => {
    try {
      return await handler(req);
    } catch (error) {
      // Detect error type from message
      if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
        return createErrorResponse(error, ErrorTypes.AUTHENTICATION);
      }
      
      if (error.message.includes('permission') || error.message.includes('Forbidden')) {
        return createErrorResponse(error, ErrorTypes.AUTHORIZATION);
      }
      
      if (error.message.includes('not found') || error.message.includes('Not found')) {
        return createErrorResponse(error, ErrorTypes.NOT_FOUND);
      }
      
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        return createErrorResponse(error, ErrorTypes.CONFLICT);
      }
      
      if (error.message.includes('rate limit') || error.message.includes('Rate limit')) {
        return createErrorResponse(error, ErrorTypes.RATE_LIMIT);
      }
      
      if (error.message.includes('Validation') || error.message.includes('Invalid')) {
        return createErrorResponse(error, ErrorTypes.VALIDATION);
      }
      
      // Default to server error
      return createErrorResponse(error, ErrorTypes.SERVER);
    }
  };
}

/**
 * Retry logic for transient failures
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}