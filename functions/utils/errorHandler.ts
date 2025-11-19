/**
 * Standardized Error Handling
 * Provides consistent error responses across all endpoints
 */

import { Logger } from './logger.js';

/**
 * Standard error response format
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Error types for common scenarios
 */
export const ErrorTypes = {
  UNAUTHORIZED: (message = 'Authentication required') => 
    new ApiError(message, 401),
  
  FORBIDDEN: (message = 'You do not have permission to perform this action') => 
    new ApiError(message, 403),
  
  NOT_FOUND: (resource = 'Resource') => 
    new ApiError(`${resource} not found`, 404),
  
  VALIDATION_ERROR: (details) => 
    new ApiError('Validation failed', 400, details),
  
  CONFLICT: (message = 'Resource already exists') => 
    new ApiError(message, 409),
  
  RATE_LIMIT: (retryAfter) => 
    new ApiError('Rate limit exceeded', 429, { retryAfter }),
  
  INTERNAL_ERROR: (message = 'Internal server error') => 
    new ApiError(message, 500),
};

/**
 * Format error response
 */
export function formatErrorResponse(error, logger = null, includeStack = false) {
  // Log error if logger provided
  if (logger) {
    logger.error('Request failed', error, {
      statusCode: error.statusCode || 500
    });
  }
  
  // Determine status code
  const statusCode = error.statusCode || 500;
  
  // Base response
  const response = {
    success: false,
    error: {
      message: error.message || 'An error occurred',
      code: error.name || 'ERROR'
    }
  };
  
  // Add details if available
  if (error.details) {
    response.error.details = error.details;
  }
  
  // Add stack trace only in development
  if (includeStack && Deno.env.get('DENO_ENV') === 'development') {
    response.error.stack = error.stack;
  }
  
  // Don't expose internal errors to clients
  if (statusCode === 500) {
    response.error.message = 'An internal error occurred. Please try again later.';
  }
  
  return Response.json(response, { status: statusCode });
}

/**
 * Async error handler wrapper
 */
export function withErrorHandler(handler, context = 'api') {
  return async (req) => {
    const logger = new Logger(context);
    const startTime = Date.now();
    
    try {
      logger.logRequest(req.method, new URL(req.url).pathname);
      
      const response = await handler(req, logger);
      
      const duration = Date.now() - startTime;
      logger.logResponse(req.method, new URL(req.url).pathname, response.status, duration);
      
      return response;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Handle known API errors
      if (error instanceof ApiError) {
        return formatErrorResponse(error, logger);
      }
      
      // Handle authentication errors
      if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
        return formatErrorResponse(ErrorTypes.UNAUTHORIZED(error.message), logger);
      }
      
      // Handle validation errors
      if (error.message.includes('Validation') || error.message.includes('Invalid')) {
        return formatErrorResponse(ErrorTypes.VALIDATION_ERROR(error.message), logger);
      }
      
      // Log unexpected errors
      logger.error('Unexpected error', error, {
        durationMs: duration,
        method: req.method,
        path: new URL(req.url).pathname
      });
      
      // Return generic error
      return formatErrorResponse(ErrorTypes.INTERNAL_ERROR(), logger);
    }
  };
}

/**
 * Success response helper
 */
export function successResponse(data, statusCode = 200) {
  return Response.json({
    success: true,
    data
  }, { status: statusCode });
}